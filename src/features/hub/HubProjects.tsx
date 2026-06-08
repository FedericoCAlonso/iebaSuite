import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjects } from '../../hooks/useProjects'
import { useSymbols } from '../../core/SymbolsContext'
import { useClients } from '../../core/ClientContext'
import { useProjectsScreen } from '../../hooks/useProjectsScreen'
import { ProjectHeader } from '../../components/projects/ProjectHeader'
import { ProjectConfigDialog } from '../../components/shared/ProjectConfigDialog'
import { SymbolManagerDialog } from '../../components/SymbolManagerDialog'
import { Modal } from '../../ui/Modal'
import { SyncConflictModal } from '../../components/shared/SyncConflictModal'
import './HubProjects.css'

const ESTADO_LABELS: Record<string, string> = {
  relevamiento: 'Relevamiento',
  presupuesto: 'Presupuesto',
  en_ejecucion: 'En ejecución',
  ejecutado: 'Ejecutado',
  certificado: 'Certificado'
}

const ESTADO_COLORS: Record<string, string> = {
  relevamiento: '#8b5cf6',
  presupuesto: '#f59e0b',
  en_ejecucion: '#3b82f6',
  ejecutado: '#10b981',
  certificado: '#06b6d4'
}

export function HubProjects() {
  const navigate = useNavigate()
  const { symbolsLib, setSymbolsLib } = useSymbols()
  const { clients } = useClients()
  const projectState = useProjects()
  const {
    projects,
    activeProjectId,
    createProject,
    deleteProject,
    addProject,
    updateProject,
    conflict
  } = projectState

  const [configProjectId, setConfigProjectId] = useState<string | null>(null)
  const [isSymbolManagerOpen, setIsSymbolManagerOpen] = useState(false)
  const [showClienteModal, setShowClienteModal] = useState(false)
  const [selectedClienteId, setSelectedClienteId] = useState('')

  const {
    fileRef,
    handleImportClick,
    handleFileChange
  } = useProjectsScreen(addProject)

  const clientMap = new Map(clients.map(c => [c.id, c.razonSocial]))

  const handleSelect = (id: string) => {
    navigate(`/proyecto/${id}/relevador`)
  }

  const handleCreate = () => {
    setSelectedClienteId('')
    setShowClienteModal(true)
  }

  const handleConfirmCreate = () => {
    const newProject = createProject(selectedClienteId)
    setShowClienteModal(false)
    navigate(`/proyecto/${newProject.id}/relevador`)
  }

  const projectToConfig = projects.find((p: any) => p.id === configProjectId)

  return (
    <div className="screen-projects">
      <ProjectHeader
        onImport={handleImportClick}
        onCreate={handleCreate}
        fileRef={fileRef}
        onFileChange={handleFileChange}
      />

      <div className="project-list">
        {projects.length === 0 && (
          <div className="empty">
            Sin proyectos guardados.<br />
            Comenzá creando uno nuevo o importando un backup.
          </div>
        )}

        {projects.map((p: any) => {
          const isActive = p.id === activeProjectId
          const estado = p.estado || 'relevamiento'
          const clienteNombre = clientMap.get(p.clienteId ?? '') || 'Sin cliente'

          return (
            <div
              key={p.id}
              className={`project-item ${isActive ? 'active' : ''}`}
              onClick={() => handleSelect(p.id)}
            >
              <div style={{ flex: 1 }}>
                <div className="project-name">
                  {p.meta?.nombre || p.nombre || 'Proyecto sin nombre'}
                </div>
                <div className="project-meta" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span>Escala 1:{p.meta?.escala || 50}</span>
                  <span>·</span>
                  <span>{p.ambientes?.length || 0} hoja(s)</span>
                  <span>·</span>
                  <select
                    value={estado}
                    onClick={e => e.stopPropagation()}
                    onChange={e => {
                      const newEstado = e.target.value as typeof p.estado
                      updateProject(p.id, (proj: any) => ({ ...proj, estado: newEstado, updatedAt: Date.now() }))
                    }}
                    style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      background: `${ESTADO_COLORS[estado]}20`,
                      color: ESTADO_COLORS[estado],
                      border: `1px solid ${ESTADO_COLORS[estado]}40`,
                      fontFamily: 'var(--sans)',
                      cursor: 'pointer'
                    }}
                  >
                    {Object.entries(ESTADO_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                  <span style={{ color: 'var(--text3)', fontSize: 12 }}>
                    Cliente: <strong style={{ color: 'var(--text)' }}>{clienteNombre}</strong>
                  </span>
                </div>
                <div className="project-ambientes-tags">
                  {p.ambientes?.map((a: any) => a.nombre).join(' · ') || ''}
                </div>
                {p.inmueble?.direccion && (
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2, fontFamily: 'var(--sans)' }}>
                    📍 {p.inmueble.direccion}
                    {p.inmueble.partido ? `, ${p.inmueble.partido}` : ''}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-ghost btn-sm"
                  title="Configurar proyecto"
                  onClick={(e) => {
                    e.stopPropagation()
                    setConfigProjectId(p.id)
                  }}
                >
                  ⚙️
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  title="Eliminar proyecto"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (window.confirm(`¿Eliminar "${p.meta?.nombre || p.nombre}"?`)) {
                      deleteProject(p.id)
                    }
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {projectToConfig && (
        <ProjectConfigDialog
          project={projectToConfig}
          onUpdate={updateProject}
          onClose={() => setConfigProjectId(null)}
        />
      )}

      {isSymbolManagerOpen && (
        <SymbolManagerDialog
          symbolsLib={symbolsLib}
          onUpdate={setSymbolsLib}
          onClose={() => setIsSymbolManagerOpen(false)}
        />
      )}

      <Modal
        isOpen={showClienteModal}
        onClose={() => setShowClienteModal(false)}
        title="Nuevo proyecto"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowClienteModal(false)}>
              Cancelar
            </button>
            <button
              className="btn btn-acc"
              onClick={handleConfirmCreate}
            >
              Crear proyecto
            </button>
          </>
        }
      >
        <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--text3)', marginBottom: 12 }}>
          Podés asignar el cliente ahora o configurarlo más tarde.
        </p>
        <select
          value={selectedClienteId}
          onChange={e => setSelectedClienteId(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 'var(--r)',
            border: '1px solid var(--border)',
            background: 'var(--bg2)',
            color: 'var(--text)',
            fontFamily: 'var(--sans)',
            fontSize: 14
          }}
        >
          <option value="">Sin cliente (asignar después)</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.razonSocial}{c.dniCuit ? ` — ${c.dniCuit}` : ''}</option>
          ))}
        </select>
      </Modal>
      <SyncConflictModal conflict={conflict} />
    </div>
  )
}
