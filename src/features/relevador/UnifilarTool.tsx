import { useState, useMemo } from 'react'
import { useCurrentProject } from '../../core/ProjectContext'
import { useNavigate } from 'react-router-dom'
import { AppHeader } from '../../components/AppHeader'
import { UnifilarCanvas } from '../unifilar/UnifilarCanvas'
import { UnifilarSidebar } from '../unifilar/UnifilarSidebar'
import { generateId } from '../../lib/storage'
import { FormularioCircuito } from '../../components/shared/FormularioCircuito'
import type { Project, Tablero, Diferencial, Circuito } from '../../types/index'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '6px',
  border: '1px solid #334155',
  background: '#1e293b',
  color: '#f8fafc',
  fontFamily: 'Inter, sans-serif',
  fontSize: '13px',
  outline: 'none',
  marginTop: '4px',
  marginBottom: '12px'
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontWeight: '600',
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
}

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer'
}


export function UnifilarTool() {
  const { activeProject, updateProject, undoAmbiente, canUndo, ui } = useCurrentProject()
  const navigate = useNavigate()

  // Estados locales
  const [activeTableroId, setActiveTableroId] = useState<string | null>(() => {
    return activeProject?.tableros?.[0]?.id || null
  })
  
  const [selectedElement, setSelectedElement] = useState<{
    type: 'suministro' | 'tablero' | 'diferencial' | 'circuito'
    id: string
  } | null>(null)

  const [isCreatingTablero, setIsCreatingTablero] = useState(false)
  const [newTableroForm, setNewTableroForm] = useState({
    nombre: '',
    tipo: 'seccional' as Tablero['tipo'],
    ubicacion: ''
  })

  const [editingCircuitId, setEditingCircuitId] = useState<string | null>(null)

  // Obtener tablero activo
  const activeTablero = useMemo(() => {
    const tableros = activeProject?.tableros || []
    if (!activeTableroId && tableros.length > 0) {
      return tableros[0]
    }
    return tableros.find(t => t.id === activeTableroId) || null
  }, [activeProject?.tableros, activeTableroId])

  // ========================================================
  // MOTOR DE VALIDACIONES AEA 90364
  // ========================================================
  const validations = useMemo(() => {
    if (!activeProject) return []
    const alerts: Array<{
      elementId: string
      elementType: 'circuito' | 'diferencial' | 'tablero'
      severity: 'error' | 'warning'
      message: string
    }> = []

    const circuitos = activeProject.circuitos || []
    const diferenciales = activeProject.diferenciales || []
    const tableros = activeProject.tableros || []

    circuitos.forEach(c => {
      // 1. Sección mínima conductor (AEA 771.13)
      if (c.tipo === 'IUG' && c.seccion < 1.5) {
        alerts.push({
          elementId: c.id,
          elementType: 'circuito',
          severity: 'warning',
          message: `AEA exige sección mínima de 1.5 mm² para circuitos de Iluminación General (IUG). Se especificó: ${c.seccion} mm².`
        })
      }
      if (c.tipo === 'TUG' && c.seccion < 2.5) {
        alerts.push({
          elementId: c.id,
          elementType: 'circuito',
          severity: 'warning',
          message: `AEA exige sección mínima de 2.5 mm² para circuitos de Tomacorrientes Generales (TUG). Se especificó: ${c.seccion} mm².`
        })
      }
      if (['TUE', 'IUE', 'ACU'].includes(c.tipo) && c.seccion < 2.5) {
        alerts.push({
          elementId: c.id,
          elementType: 'circuito',
          severity: 'warning',
          message: `AEA exige sección mínima de 2.5 mm² para circuitos de uso especial (TUE/IUE/ACU).`
        })
      }

      // 2. Coordinación In vs Iz (Criterio de Sobrecarga: In <= Iz)
      // Corriente admisible Iz aproximada en cobre PVC 30°C (método B1 caño en pared)
      let iz = 999
      if (c.seccion === 1.5) iz = 15
      else if (c.seccion === 2.5) iz = 21
      else if (c.seccion === 4.0) iz = 28
      else if (c.seccion === 6.0) iz = 36
      else if (c.seccion === 10.0) iz = 50

      if (c.corrienteNominal && c.corrienteNominal > iz) {
        alerts.push({
          elementId: c.id,
          elementType: 'circuito',
          severity: 'error',
          message: `Coordinación In vs Iz fallida: La termomagnética (${c.corrienteNominal}A) excede la capacidad del conductor (${iz}A para ${c.seccion}mm²). Peligro de sobrecalentamiento.`
        })
      }

      // 3. Protección Diferencial Obligatoria (TUG, TUE, IUE, ACU deben estar bajo DR)
      const isProtected = diferenciales.some(d => d.circuitosIds?.includes(c.id))
      if (!isProtected && ['TUG', 'TUE', 'ACU', 'IUG'].includes(c.tipo)) {
        alerts.push({
          elementId: c.id,
          elementType: 'circuito',
          severity: 'error',
          message: `Circuito sin protección diferencial. La norma exige disyuntor diferencial <= 30mA para tomacorrientes e iluminación general.`
        })
      }
    })

    // Validaciones de Diferenciales
    diferenciales.forEach(d => {
      // Sensibilidad inapropiada para tomacorrientes (debe ser <= 30mA)
      const protectsOutlets = circuitos.some(c => d.circuitosIds?.includes(c.id) && ['TUG', 'TUE', 'ACU'].includes(c.tipo))
      if (protectsOutlets && d.sensibilidadMA > 30) {
        alerts.push({
          elementId: d.id,
          elementType: 'diferencial',
          severity: 'error',
          message: `Fallo de seguridad humana: El disyuntor diferencial protege tomacorrientes pero tiene sensibilidad de ${d.sensibilidadMA}mA (máximo admisible: 30mA).`
        })
      }

      // In de diferencial menor que termomagnética aguas abajo
      const protectedTMs = circuitos.filter(c => d.circuitosIds?.includes(c.id))
      protectedTMs.forEach(c => {
        if (c.corrienteNominal && d.inominalA < c.corrienteNominal) {
          alerts.push({
            elementId: d.id,
            elementType: 'diferencial',
            severity: 'warning',
            message: `Sobrecarga en DR: La corriente nominal del disyuntor (${d.inominalA}A) es inferior al breaker del circuito ${c.nombre} (${c.corrienteNominal}A).`
          })
        }
      })
    })

    // Validaciones de Tableros
    tableros.forEach(t => {
      const tCircuits = circuitos.filter(c => c.tableroId === t.id)
      if (tCircuits.length > 12 && (!t.tipo || t.tipo === 'auxiliar')) {
        alerts.push({
          elementId: t.id,
          elementType: 'tablero',
          severity: 'warning',
          message: `El tablero "${t.nombre}" cuenta con más de 12 circuitos. Se recomienda clasificarlo como principal o seccional.`
        })
      }
    })

    return alerts
  }, [activeProject])

  const activeTableroValidations = useMemo(() => {
    if (!activeTablero) return []
    const circuitos = (activeProject?.circuitos || []).filter(c => c.tableroId === activeTablero.id)
    const diferenciales = (activeProject?.diferenciales || []).filter(d => d.tableroId === activeTablero.id)
    
    const elementIds = [
      activeTablero.id,
      ...circuitos.map(c => c.id),
      ...diferenciales.map(d => d.id)
    ]

    return validations.filter(v => elementIds.includes(v.elementId))
  }, [validations, activeTablero, activeProject])

  // ========================================================
  // ACCIONES DEL EDITOR (ABM / EXPORT)
  // ========================================================

  const handleUpdateProject = (fn: (p: Project) => Project) => {
    if (!activeProject) return
    updateProject(activeProject.id, fn)
  }

  // Exportar SVG
  const handleExportSVG = () => {
    const svgEl = document.querySelector('.tool-unifilar svg')
    if (!svgEl) return
    
    // Clonar para no alterar el original
    const svgClone = svgEl.cloneNode(true) as SVGElement
    
    // Agregar estilo de tipografía e inyectar el background oscuro
    const styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style')
    styleEl.textContent = `
      svg { background-color: #0f172a; font-family: 'Inter', 'Segoe UI', sans-serif; }
      text { user-select: none; }
    `
    svgClone.insertBefore(styleEl, svgClone.firstChild)
    
    const serializer = new XMLSerializer()
    const source = serializer.serializeToString(svgClone)
    
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `Diagrama_Unifilar_${activeProject?.meta?.nombre || 'Proyecto'}_${activeTablero?.nombre || 'Tablero'}.svg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Crear nuevo tablero
  const handleCreateTablero = () => {
    if (!newTableroForm.nombre.trim()) return
    const id = generateId()
    
    handleUpdateProject(p => ({
      ...p,
      tableros: [...(p.tableros || []), {
        id,
        nombre: newTableroForm.nombre.trim(),
        tipo: newTableroForm.tipo,
        ubicacion: newTableroForm.ubicacion.trim() || undefined,
        factorSimultaneidad: 1.0,
        diferencialesIds: [],
        interruptorCabecera: { tipo: 'seccionador' },
        alimentadorDesdeTableroId: 'red_distribuidora'
      }],
      updatedAt: Date.now()
    }))

    setActiveTableroId(id)
    setIsCreatingTablero(false)
    setNewTableroForm({ nombre: '', tipo: 'seccional', ubicacion: '' })
  }

  // Agregar disyuntor al tablero activo
  const handleAddDiferencial = () => {
    if (!activeTablero) return
    const id = generateId()
    const nuevoDR: Diferencial = {
      id,
      tableroId: activeTablero.id,
      sensibilidadMA: 30,
      tipo: 'AC',
      inominalA: 25,
      polos: 2,
      circuitosIds: [],
      descripcion: `DR Auxiliar`
    }

    handleUpdateProject(p => ({
      ...p,
      diferenciales: [...(p.diferenciales || []), nuevoDR],
      tableros: (p.tableros || []).map(t => {
        if (t.id === activeTablero.id) {
          return { ...t, diferencialesIds: [...(t.diferencialesIds || []), id] }
        }
        return t
      }),
      updatedAt: Date.now()
    }))

    setSelectedElement({ type: 'diferencial', id })
  }

  // Agregar circuito al tablero activo
  const handleAddCircuito = () => {
    if (!activeTablero) return
    const activeCircs = (activeProject?.circuitos || []).filter(c => c.tableroId === activeTablero.id)
    const nextIndex = activeCircs.length + 1
    const id = generateId()
    
    const nuevoCirc: Circuito = {
      id,
      nombre: `C${nextIndex}`,
      tipo: 'TUG',
      tableroId: activeTablero.id,
      seccion: 2.5,
      material: 'cobre',
      aislacion: 'PVC',
      cantConductores: 2,
      polos: 2,
      corrienteNominal: 16,
      curvaDisparo: 'C',
      conducto: 'Caño de PVC',
      tipoConducto: 'cano_rigido',
      longitudDeclarada: 10,
      descripcion: `Tomas de Uso General ${nextIndex}`
    }

    handleUpdateProject(p => ({
      ...p,
      circuitos: [...(p.circuitos || []), nuevoCirc],
      updatedAt: Date.now()
    }))

    setSelectedElement({ type: 'circuito', id })
  }

  // Eliminar elemento de forma segura
  const handleDeleteElement = (type: 'diferencial' | 'circuito' | 'tablero', targetId: string) => {
    handleUpdateProject(p => {
      let tableros = p.tableros || []
      let diferenciales = p.diferenciales || []
      let circuitos = p.circuitos || []

      if (type === 'tablero') {
        tableros = tableros.filter(t => t.id !== targetId)
        // Huérfanos quedan sin tablero
        circuitos = circuitos.map(c => c.tableroId === targetId ? { ...c, tableroId: '' } : c)
        diferenciales = diferenciales.filter(d => d.tableroId !== targetId)
        // Tableros alimentados por este tablero vuelven a la red
        tableros = tableros.map(t => t.alimentadorDesdeTableroId === targetId ? { ...t, alimentadorDesdeTableroId: 'red_distribuidora' } : t)
        if (activeTableroId === targetId) {
          setActiveTableroId(tableros[0]?.id || null)
        }
      } else if (type === 'diferencial') {
        diferenciales = diferenciales.filter(d => d.id !== targetId)
        tableros = tableros.map(t => ({
          ...t,
          diferencialesIds: (t.diferencialesIds || []).filter(did => did !== targetId)
        }))
        // Hijos de este diferencial pasan al embarrado principal
        circuitos = circuitos.map(c => c.parentId === targetId ? { ...c, parentId: undefined } : c)
        diferenciales = diferenciales.map(d => d.parentId === targetId ? { ...d, parentId: undefined } : d)
      } else if (type === 'circuito') {
        circuitos = circuitos.filter(c => c.id !== targetId)
        diferenciales = diferenciales.map(d => ({
          ...d,
          circuitosIds: (d.circuitosIds || []).filter(cid => cid !== targetId)
        }))
        // Hijos de este circuito pasan al embarrado principal
        circuitos = circuitos.map(c => c.parentId === targetId ? { ...c, parentId: undefined } : c)
        diferenciales = diferenciales.map(d => d.parentId === targetId ? { ...d, parentId: undefined } : d)
      }

      return {
        ...p,
        tableros,
        diferenciales,
        circuitos,
        updatedAt: Date.now()
      }
    })

    setSelectedElement(null)
  }

  return (
    <div className="app tool-unifilar" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#090d16', fontFamily: 'Inter, sans-serif' }}>
      <AppHeader
        screen="editor"
        activeProject={activeProject}
        canUndo={canUndo}
        onGoHome={() => navigate('/proyectos')}
        onUndo={undoAmbiente}
        onShowExport={() => ui.modals.setShowExport(true)}
      />

      <main className="main-content" style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
        
        {/* ========================================================
            PANEL DE TRABAJO (LIENZO + OPERACIONES)
           ======================================================== */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, borderRight: '1px solid #1e293b' }}>
          
          {/* Header de operaciones */}
          <div style={{
            padding: '12px 20px',
            background: '#0f172a',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>🔌</span>
              <h2 style={{ fontSize: '14px', fontWeight: 'bold', color: '#f8fafc', margin: 0 }}>
                Esquema Unifilar
              </h2>
              <span style={{ color: '#475569' }}>/</span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>AEA 90364</span>
            </div>

            {/* Selector de Tableros */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {activeProject?.tableros?.map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    setActiveTableroId(t.id)
                    setSelectedElement(null)
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: '1px solid',
                    borderColor: activeTableroId === t.id ? '#0284c7' : '#1e293b',
                    background: activeTableroId === t.id ? 'rgba(2, 132, 199, 0.15)' : '#1e293b',
                    color: activeTableroId === t.id ? '#38bdf8' : '#94a3b8',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  ⚡ {t.nombre}
                </button>
              ))}

              <button
                onClick={() => setIsCreatingTablero(true)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: '1px dashed #475569',
                  background: 'transparent',
                  color: '#94a3b8',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
              >
                ＋ Nuevo Tablero
              </button>
            </div>

            {/* Acciones principales */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={handleExportSVG}
                disabled={!activeTablero}
                style={{ height: '32px', borderColor: '#334155', color: '#e2e8f0', background: '#1e293b' }}
              >
                📥 Exportar SVG
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleAddDiferencial}
                disabled={!activeTablero}
                style={{ height: '32px', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.05)' }}
              >
                ＋ Disyuntor (DR)
              </button>
              <button
                className="btn btn-acc btn-sm"
                onClick={handleAddCircuito}
                disabled={!activeTablero}
                style={{ height: '32px' }}
              >
                ＋ Circuito (TM)
              </button>
            </div>
          </div>

          {/* Lienzo SVG */}
          <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
            <UnifilarCanvas
              project={activeProject!}
              activeTablero={activeTablero}
              selectedElement={selectedElement}
              onSelectElement={setSelectedElement}
              validations={validations}
            />
          </div>

          {/* ========================================================
              PANEL INFERIOR DE VALIDACIONES NORMATIVAS AEA
             ======================================================== */}
          <div style={{
            height: '180px',
            background: '#0f172a',
            borderTop: '1px solid #1e293b',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '8px 20px',
              background: '#090d16',
              borderBottom: '1px solid #1e293b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px' }}>🛡️</span>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Validación Normativa AEA 90364 ({activeTableroValidations.length} Alertas en {activeTablero?.nombre || 'tablero'})
                </span>
              </div>
              <span style={{
                fontSize: '10px',
                padding: '2px 8px',
                borderRadius: '12px',
                background: activeTableroValidations.some(v => v.severity === 'error') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                color: activeTableroValidations.some(v => v.severity === 'error') ? '#ef4444' : '#10b981',
                fontWeight: 'bold'
              }}>
                {activeTableroValidations.some(v => v.severity === 'error') ? '⚠️ Requiere revisión' : '✓ Conforme a norma'}
              </span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 20px' }}>
              {activeTableroValidations.length === 0 ? (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '12px', gap: '6px' }}>
                  <span>🎉 No se detectaron fallos o advertencias según la norma de la AEA en este tablero.</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {activeTableroValidations.map((v, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '6px',
                        background: v.severity === 'error' ? 'rgba(239, 68, 68, 0.04)' : 'rgba(245, 158, 11, 0.04)',
                        borderLeft: `4px solid ${v.severity === 'error' ? '#ef4444' : '#f59e0b'}`,
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'flex-start',
                        fontSize: '12px',
                        color: '#e2e8f0',
                        lineHeight: '1.4'
                      }}
                    >
                      <span style={{ fontSize: '14px' }}>
                        {v.severity === 'error' ? '❌' : '⚠️'}
                      </span>
                      <div>
                        <strong style={{ color: v.severity === 'error' ? '#ef4444' : '#f59e0b', marginRight: '6px' }}>
                          {v.severity === 'error' ? 'Error Crítico:' : 'Advertencia:'}
                        </strong>
                        {v.message}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================
            PANEL LATERAL: INSPECTOR / EDITOR DE NODOS
           ======================================================== */}
        <div style={{ width: '320px', background: '#090d16', height: '100%' }}>
          <UnifilarSidebar
            project={activeProject!}
            selectedElement={selectedElement}
            onUpdateProject={handleUpdateProject}
            onClose={() => setSelectedElement(null)}
            onDeleteElement={handleDeleteElement}
            onEditCircuit={(id) => setEditingCircuitId(id)}
          />
        </div>
      </main>

      {/* ========================================================
          MODAL DE CREAR TABLERO
         ======================================================== */}
      {isCreatingTablero && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            width: '400px',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold', color: '#f8fafc' }}>
              ⚡ Nuevo Tablero Eléctrico
            </h3>

            <label style={labelStyle}>Nombre del Tablero</label>
            <input
              placeholder="Ej: TS1, TS Quincho"
              value={newTableroForm.nombre}
              onChange={e => setNewTableroForm(f => ({ ...f, nombre: e.target.value }))}
              style={inputStyle}
            />

            <label style={labelStyle}>Tipo</label>
            <select
              value={newTableroForm.tipo}
              onChange={e => setNewTableroForm(f => ({ ...f, tipo: e.target.value as Tablero['tipo'] }))}
              style={selectStyle}
            >
              <option value="seccional">Seccional (Recomendado estándar)</option>
              <option value="general">Principal / General</option>
              <option value="auxiliar">Auxiliar / de Control</option>
            </select>

            <label style={labelStyle}>Ubicación Física (Opcional)</label>
            <input
              placeholder="Ej: Lavadero, Hall Principal"
              value={newTableroForm.ubicacion}
              onChange={e => setNewTableroForm(f => ({ ...f, ubicacion: e.target.value }))}
              style={inputStyle}
            />

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setIsCreatingTablero(false)}
              >
                Cancelar
              </button>
              <button
                className="btn btn-acc btn-sm"
                onClick={handleCreateTablero}
                disabled={!newTableroForm.nombre.trim()}
              >
                Guardar Tablero
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL DE EDICIÓN GLOBAL DE CIRCUITO
         ======================================================== */}
      {editingCircuitId && activeProject && (
        <FormularioCircuito
          tableros={activeProject.tableros || []}
          circuitoEdit={activeProject.circuitos?.find(c => c.id === editingCircuitId) || null}
          onSave={(data) => {
            handleUpdateProject(p => ({
              ...p,
              circuitos: (p.circuitos || []).map(c => 
                c.id === editingCircuitId ? { ...c, ...data } : c
              ),
              updatedAt: Date.now()
            }))
            setEditingCircuitId(null)
          }}
          onCancel={() => setEditingCircuitId(null)}
        />
      )}
    </div>
  )
}
