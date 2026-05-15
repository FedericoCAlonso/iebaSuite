import { useState } from 'react'
import { useClients } from './ClientContext'
import { Modal } from '../components/shared/Modal'
import './HubProjects.css'

export function HubClients() {
  const { clients, isLoadingClients, addClient } = useClients()

  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState({
    razonSocial: '',
    dniCuit: '',
    telefono: '',
    email: '',
    domicilio: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.razonSocial.trim()) return

    await addClient({
      razonSocial: form.razonSocial.trim(),
      dniCuit: form.dniCuit.trim(),
      ...(form.telefono.trim() ? { telefono: form.telefono.trim() } : {}),
      ...(form.email.trim() ? { email: form.email.trim() } : {}),
      ...(form.domicilio.trim() ? { domicilio: form.domicilio.trim() } : {})
    })

    setForm({ razonSocial: '', dniCuit: '', telefono: '', email: '', domicilio: '' })
    setFormOpen(false)
  }

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

  return (
    <div className="screen-projects">
      <div className="screen-header">
        <span className="screen-title">Mis Clientes</span>
        <div className="header-actions">
          <button className="btn btn-acc btn-sm" onClick={() => setFormOpen(true)}>
            + Nuevo Cliente
          </button>
        </div>
      </div>

      {isLoadingClients && (
        <div style={{ padding: 24, color: 'var(--text3)', fontFamily: 'var(--sans)' }}>
          Cargando clientes...
        </div>
      )}

      <div className="project-list">
        {clients.length === 0 && !isLoadingClients && (
          <div className="empty">
            Sin clientes registrados.<br />
            Agregá uno nuevo para comenzar.
          </div>
        )}

        {clients.map(c => (
          <div key={c.id} className="project-item" style={{ cursor: 'default' }}>
            <div style={{ flex: 1 }}>
              <div className="project-name">{c.razonSocial}</div>
              <div className="project-meta">
                {c.dniCuit}
                {c.telefono ? ` · ${c.telefono}` : ''}
                {c.email ? ` · ${c.email}` : ''}
              </div>
              {c.domicilio && (
                <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2, fontFamily: 'var(--sans)' }}>
                  {c.domicilio}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title="Nuevo Cliente"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setFormOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-acc" form="cliente-form">
              Guardar
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
        </form>
      </Modal>
    </div>
  )
}
