interface Props {
  nombre: string
  icono: string
  descripcion: string
}

export function DummyTool({ nombre, icono, descripcion }: Props) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 12, padding: 48, textAlign: 'center',
      minHeight: '60vh', color: '#555'
    }}>
      <span style={{ fontSize: 48 }}>{icono}</span>
      <h2 style={{ margin: 0, fontSize: 20, color: '#1a1a1a' }}>{nombre}</h2>
      <p style={{ margin: 0, fontSize: 14, maxWidth: 280 }}>{descripcion}</p>
      <span style={{
        marginTop: 8, fontSize: 12, background: '#f0f0ee',
        padding: '4px 12px', borderRadius: 6, color: '#888'
      }}>
        En desarrollo
      </span>
    </div>
  )
}
