import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjects } from '../hooks/useProjects'
import { useSymbols } from './SymbolsContext'
import { useClients } from './ClientContext'
import { useProjectsScreen } from '../hooks/useProjectsScreen'
import { ProjectHeader } from '../components/projects/ProjectHeader'
import { ProjectConfigDialog } from '../components/shared/ProjectConfigDialog'
import { SymbolManagerDialog } from '../components/SymbolManagerDialog'
import { Modal } from '../components/shared/Modal'
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
    updateProject
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
    if (clients.length === 0) {
      alert('Primero debés registrar al menos un cliente.')
      return
    }
    setSelectedClienteId(clients[0]?.id || '')
    setShowClienteModal(true)
  }

  const handleConfirmCreate = () => {
    if (!selectedClienteId) return
    const newProject = createProject(selectedClienteId)
    setShowClienteModal(false)
    navigate(`/proyecto/${newProject.id}/relevador`)
  }

  const projectToConfig = projects.find(p => p.id === configProjectId)

  return (
    <div className="screen-projects">
      <ProjectHeader
        onManageSymbols={() => setIsSymbolManagerOpen(true)}
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

        {projects.map(p => {
          const isActive = p.id === activeProjectId
          const estado = p.estado || 'relevamiento'
          const clienteNombre = clientMap.get(p.clienteId) || 'Sin cliente'

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
                  <span
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
                      border: `1px solid ${ESTADO_COLORS[estado]}40`
                    }}
                  >
                    {ESTADO_LABELS[estado] || estado}
                  </span>
                  <span style={{ color: 'var(--text3)', fontSize: 12 }}>
                    Cliente: <strong style={{ color: 'var(--text)' }}>{clienteNombre}</strong>
                  </span>
                </div>
                <div className="project-ambientes-tags">
                  {p.ambientes?.map(a => a.nombre).join(' · ') || ''}
                </div>
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
        title="Asignar cliente al nuevo proyecto"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowClienteModal(false)}>
              Cancelar
            </button>
            <button
              className="btn btn-acc"
              onClick={handleConfirmCreate}
              disabled={!selectedClienteId}
            >
              Crear proyecto
            </button>
          </>
        }
      >
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
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.razonSocial} — {c.dniCuit}</option>
          ))}
        </select>
      </Modal>
    </div>
  )
}
