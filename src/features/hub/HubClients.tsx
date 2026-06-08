import { useState, useMemo } from 'react'
import { useClients } from '../../core/ClientContext'
import { loadProjects } from '../../lib/storage'
import { Modal } from '../../ui/Modal'
import './HubProjects.css'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  marginBottom: 10,
  borderRadius: 'var(--r)',
  border: '1px solid var(--border)',
  background: 'var(--bg2)',
  color: 'var(--text)',
  fontFamily: 'var(--sans)',
  fontSize: 14,
  outline: 'none'
}

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

type ModalMode = 'create' | 'edit' | 'detail' | null

const emptyForm = {
  razonSocial: '',
  dniCuit: '',
  telefono: '',
  email: '',
  domicilio: '',
  contacto: ''
}

export function HubClients() {
  const { clients, isLoadingClients, addClient, editClient, deleteClient } = useClients()

  const [search, setSearch] = useState('')
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const allProjects = useMemo(() => loadProjects(), [clients.length])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return clients
    return clients.filter(c =>
      c.razonSocial.toLowerCase().includes(q) ||
      (c.dniCuit || '').toLowerCase().includes(q)
    )
  }, [clients, search])

  const selectedClient = selectedId ? clients.find(c => c.id === selectedId) : null
  const clientProjects = selectedId
    ? allProjects.filter((p: any) => p.clienteId === selectedId)
    : []

  const openCreate = () => {
    setForm({ ...emptyForm })
    setSelectedId(null)
    setModalMode('create')
  }

  const openEdit = (c: typeof clients[0]) => {
    setForm({
      razonSocial: c.razonSocial,
      dniCuit: c.dniCuit || '',
      telefono: c.telefono || '',
      email: c.email || '',
      domicilio: c.domicilio || '',
      contacto: c.contacto || ''
    })
    setSelectedId(c.id)
    setModalMode('edit')
  }

  const openDetail = (c: typeof clients[0]) => {
    setSelectedId(c.id)
    setModalMode('detail')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.razonSocial.trim() || isSubmitting) return

    // Validar duplicados (comparación case-insensitive)
    const nombreNorm = form.razonSocial.trim().toLowerCase()
    const duplicate = clients.find(c =>
      c.id !== selectedId &&
      c.razonSocial.trim().toLowerCase() === nombreNorm
    )
    if (duplicate) {
      const ok = window.confirm(
        `Ya existe un cliente con el nombre "${duplicate.razonSocial}".\n\u00bfDeseas crear uno nuevo igualmente?`
      )
      if (!ok) return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        razonSocial: form.razonSocial.trim(),
        dniCuit: form.dniCuit.trim() || undefined,
        telefono: form.telefono.trim() || undefined,
        email: form.email.trim() || undefined,
        domicilio: form.domicilio.trim() || undefined,
        contacto: form.contacto.trim() || undefined,
        createdAt: Date.now()
      }

      if (modalMode === 'create') {
        await addClient(payload)
      } else if (modalMode === 'edit' && selectedId) {
        await editClient(selectedId, payload)
      }

      setForm({ ...emptyForm })
      setModalMode(null)
      setSelectedId(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (c: typeof clients[0]) => {
    const projects = allProjects.filter((p: any) => p.clienteId === c.id)
    if (projects.length > 0) {
      alert(`No se puede eliminar: el cliente tiene ${projects.length} proyecto(s) asociado(s).`)
      return
    }
    if (!window.confirm(`¿Eliminar cliente "${c.razonSocial}"?`)) return
    await deleteClient(c.id)
  }

  return (
    <div className="screen-projects">
      <div className="screen-header">
        <span className="screen-title">Mis Clientes</span>
        <div className="header-actions">
          <button className="btn btn-acc btn-sm" onClick={openCreate}>
            + Nuevo Cliente
          </button>
        </div>
      </div>

      {/* Búsqueda */}
      <div style={{ padding: '0 20px 12px' }}>
        <input
          placeholder="Buscar por nombre o CUIT/DNI..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            ...inputStyle,
            marginBottom: 0,
            background: 'var(--bg)'
          }}
        />
      </div>

      {isLoadingClients && (
        <div style={{ padding: 24, color: 'var(--text3)', fontFamily: 'var(--sans)' }}>
          Cargando clientes...
        </div>
      )}

      <div className="project-list">
        {filtered.length === 0 && !isLoadingClients && (
          <div className="empty">
            {search ? 'Sin coincidencias.' : 'Sin clientes registrados.'}<br />
            {search ? 'Probá con otro término.' : 'Agregá uno nuevo para comenzar.'}
          </div>
        )}

        {filtered.map(c => (
          <div key={c.id} className="project-item" style={{ cursor: 'default' }}>
            <div style={{ flex: 1 }} onClick={() => openDetail(c)}>
              <div className="project-name">{c.razonSocial}</div>
              <div className="project-meta">
                {c.dniCuit || 'Sin CUIT/DNI'}
                {c.telefono ? ` · ${c.telefono}` : ''}
                {c.email ? ` · ${c.email}` : ''}
              </div>
              {c.domicilio && (
                <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2, fontFamily: 'var(--sans)' }}>
                  {c.domicilio}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)} title="Editar">
                ✏️
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c)} title="Eliminar">
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Crear / Editar */}
      {(modalMode === 'create' || modalMode === 'edit') && (
        <Modal
          isOpen={true}
          onClose={() => { setModalMode(null); setSelectedId(null) }}
          title={modalMode === 'create' ? 'Nuevo Cliente' : 'Editar Cliente'}
          footer={
            <>
              <button type="button" className="btn btn-ghost" onClick={() => { setModalMode(null); setSelectedId(null) }}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-acc" form="cliente-form" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Guardar'}
              </button>
            </>
          }
        >
          <form id="cliente-form" onSubmit={handleSubmit}>
            <input
              placeholder="Razón social / Nombre *"
              value={form.razonSocial}
              onChange={e => setForm(f => ({ ...f, razonSocial: e.target.value }))}
              required
              style={inputStyle}
            />
            <input
              placeholder="DNI / CUIT"
              value={form.dniCuit}
              onChange={e => setForm(f => ({ ...f, dniCuit: e.target.value }))}
              style={inputStyle}
            />
            <input
              placeholder="Teléfono"
              value={form.telefono}
              onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
              style={inputStyle}
            />
            <input
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              style={inputStyle}
            />
            <input
              placeholder="Domicilio"
              value={form.domicilio}
              onChange={e => setForm(f => ({ ...f, domicilio: e.target.value }))}
              style={inputStyle}
            />
            <input
              placeholder="Contacto (persona física si es empresa)"
              value={form.contacto}
              onChange={e => setForm(f => ({ ...f, contacto: e.target.value }))}
              style={inputStyle}
            />
          </form>
        </Modal>
      )}

      {/* Modal Detalle */}
      {modalMode === 'detail' && selectedClient && (
        <Modal
          isOpen={true}
          onClose={() => { setModalMode(null); setSelectedId(null) }}
          title={selectedClient.razonSocial}
          footer={
            <button className="btn btn-ghost" onClick={() => { setModalMode(null); setSelectedId(null) }}>
              Cerrar
            </button>
          }
        >
          <div style={{ fontFamily: 'var(--sans)', fontSize: 14, lineHeight: 1.6 }}>
            <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
              {selectedClient.dniCuit && <div><strong>CUIT/DNI:</strong> {selectedClient.dniCuit}</div>}
              {selectedClient.telefono && <div><strong>Teléfono:</strong> {selectedClient.telefono}</div>}
              {selectedClient.email && <div><strong>Email:</strong> {selectedClient.email}</div>}
              {selectedClient.domicilio && <div><strong>Domicilio:</strong> {selectedClient.domicilio}</div>}
              {selectedClient.contacto && <div><strong>Contacto:</strong> {selectedClient.contacto}</div>}
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              <strong style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text3)' }}>
                Proyectos asociados ({clientProjects.length})
              </strong>
              {clientProjects.length === 0 && (
                <p style={{ color: 'var(--text3)', marginTop: 8 }}>Sin proyectos.</p>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                {clientProjects.map((p: any) => {
                  const estado = p.estado || 'relevamiento'
                  return (
                    <div
                      key={p.id}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 'var(--r)',
                        background: 'var(--bg2)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span>{p.meta?.nombre || p.nombre || 'Proyecto sin nombre'}</span>
                      <span style={{
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
                      }}>
                        {ESTADO_LABELS[estado] || estado}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
