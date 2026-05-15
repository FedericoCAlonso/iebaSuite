import { useState, useEffect } from 'react'
import { Modal } from './Modal'
import type { Circuito, Tablero, TipoCircuito } from '../../types/index'

interface FormularioCircuitoProps {
  tableros: Tablero[]
  circuitoEdit?: Circuito | null
  onSave: (data: Omit<Circuito, 'id'>) => void
  onCancel: () => void
}

const TIPOS_CIRCUITO: TipoCircuito[] = ['IUG', 'IUE', 'TUG', 'TUE', 'ACU', 'MBT', 'MBTF', 'TEC', 'OTRO']

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

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--sans)',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--text3)',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  marginBottom: 4
}

export function FormularioCircuito({ tableros, circuitoEdit, onSave, onCancel }: FormularioCircuitoProps) {
  const [form, setForm] = useState({
    nombre: '',
    tipo: 'TUG' as TipoCircuito,
    tableroId: tableros[0]?.id || '',
    seccion: 2.5,
    corrienteNominal: 16,
    sensibilidadDR: 0,
    proteccion: '',
    descripcion: ''
  })

  useEffect(() => {
    if (circuitoEdit) {
      setForm({
        nombre: circuitoEdit.nombre,
        tipo: circuitoEdit.tipo,
        tableroId: circuitoEdit.tableroId,
        seccion: circuitoEdit.seccion,
        corrienteNominal: circuitoEdit.corrienteNominal || 16,
        sensibilidadDR: circuitoEdit.sensibilidadDR || 0,
        proteccion: circuitoEdit.proteccion || '',
        descripcion: circuitoEdit.descripcion || ''
      })
    }
  }, [circuitoEdit])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form)
  }

  const puedeGuardar = form.nombre.trim() && form.tableroId

  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      title={circuitoEdit ? 'Editar Circuito' : 'Nuevo Circuito'}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-acc"
            form="circuito-form"
            disabled={!puedeGuardar}
          >
            Guardar
          </button>
        </>
      }
    >
      <form id="circuito-form" onSubmit={handleSubmit}>
        <label style={labelStyle}>Nombre</label>
        <input
          placeholder="Ej: TS1.C1"
          value={form.nombre}
          onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
          required
          style={inputStyle}
        />

        <label style={labelStyle}>Tipo</label>
        <select
          value={form.tipo}
          onChange={e => setForm(f => ({ ...f, tipo: e.target.value as TipoCircuito }))}
          style={inputStyle}
        >
          {TIPOS_CIRCUITO.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <label style={labelStyle}>Tablero</label>
        <select
          value={form.tableroId}
          onChange={e => setForm(f => ({ ...f, tableroId: e.target.value }))}
          required
          style={inputStyle}
        >
          {tableros.length === 0 && (
            <option value="" disabled>Sin tableros — creá uno primero</option>
          )}
          {tableros.map(t => (
            <option key={t.id} value={t.id}>{t.nombre} ({t.tipo})</option>
          ))}
        </select>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Sección (mm²)</label>
            <input
              type="number"
              step="0.5"
              value={form.seccion}
              onChange={e => setForm(f => ({ ...f, seccion: parseFloat(e.target.value) || 0 }))}
              required
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>In (A)</label>
            <input
              type="number"
              value={form.corrienteNominal}
              onChange={e => setForm(f => ({ ...f, corrienteNominal: parseInt(e.target.value) || 0 }))}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Diferencial (mA)</label>
            <input
              type="number"
              value={form.sensibilidadDR}
              onChange={e => setForm(f => ({ ...f, sensibilidadDR: parseInt(e.target.value) || 0 }))}
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Protección</label>
            <input
              placeholder="Ej: 16A TM"
              value={form.proteccion}
              onChange={e => setForm(f => ({ ...f, proteccion: e.target.value }))}
              style={inputStyle}
            />
          </div>
        </div>

        <label style={labelStyle}>Descripción</label>
        <input
          placeholder="Observaciones del circuito"
          value={form.descripcion}
          onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
          style={inputStyle}
        />
      </form>
    </Modal>
  )
}
