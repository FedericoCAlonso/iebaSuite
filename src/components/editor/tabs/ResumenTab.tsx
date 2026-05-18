import { Card } from '../../Card';
import { F } from '../../Field';
import type { Project, Ambiente } from '../../../types/index';

interface ResumenTabProps {
  project: Project;
  activeAmbiente: Ambiente;
}

interface StatCardProps {
  icon: string;
  value: number | string;
  label: string;
  accent?: boolean;
}

function StatCard({ icon, value, label, accent }: StatCardProps) {
  return (
    <div
      className="card"
      style={{
        padding: '14px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        borderLeft: accent ? '3px solid var(--acc)' : undefined,
      }}
    >
      <span style={{ fontSize: 24 }}>{icon}</span>
      <div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 700, color: 'var(--text-h)' }}>
          {value}
        </div>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {label}
        </div>
      </div>
    </div>
  );
}

export function ResumenTab({ project, activeAmbiente }: ResumenTabProps) {
  // Métricas globales del proyecto
  const totalHojas = project.ambientes?.length ?? 0;
  const totalElecs = project.ambientes?.reduce((sum: number, a: Ambiente) => sum + (a.elementos?.length ?? 0), 0) ?? 0;
  const totalAberturas = project.ambientes?.reduce((sum: number, a: Ambiente) => sum + (a.aberturas?.length ?? 0), 0) ?? 0;
  const totalCircuitos = project.circuitos?.length ?? 0;
  const totalConexiones = project.conexiones?.length ?? 0;

  // Métricas de la hoja activa
  const tramosCount = activeAmbiente.tramos?.length ?? 0;
  const segCount = activeAmbiente.tramos?.reduce((sum: number, t: import('../../../types/index').Tramo) => sum + (t.paredes?.length ?? 0), 0) ?? 0;
  const elecCount = activeAmbiente.elementos?.length ?? 0;
  const abertCount = activeAmbiente.aberturas?.length ?? 0;

  const estadoLabels: Record<Project['estado'], string> = {
    relevamiento: 'Relevamiento',
    presupuesto: 'Presupuesto',
    en_ejecucion: 'En ejecución',
    ejecutado: 'Ejecutado',
    certificado: 'Certificado',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="info-helper">
        Vista resumen del proyecto y la hoja activa.
      </div>

      {/* Proyecto */}
      <Card
        idx="📊"
        title={project.nombre}
        badge={estadoLabels[project.estado]}
        defaultOpen
      >
        <div className="field-row">
          <F label="Hojas">
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-h)' }}>{totalHojas}</div>
          </F>
          <F label="Circuitos">
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-h)' }}>{totalCircuitos}</div>
          </F>
          <F label="Conexiones">
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-h)' }}>{totalConexiones}</div>
          </F>
        </div>
      </Card>

      {/* Stats globales */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 8,
        }}
      >
        <StatCard icon="⚡" value={totalElecs} label="Bocas totales" accent />
        <StatCard icon="🚪" value={totalAberturas} label="Aberturas totales" />
      </div>

      {/* Hoja activa */}
      <Card
        idx="🏠"
        title={activeAmbiente.nombre}
        badge={activeAmbiente.tipoAmbiente && activeAmbiente.tipoAmbiente !== 'interior'
          ? activeAmbiente.tipoAmbiente === 'exterior' ? 'Exterior' : 'Semi'
          : 'Interior'}
        defaultOpen
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 8,
          }}
        >
          <StatCard icon="🧱" value={tramosCount} label="Tramos" />
          <StatCard icon="━" value={segCount} label="Segmentos" />
          <StatCard icon="⚡" value={elecCount} label="Bocas" accent />
          <StatCard icon="🚪" value={abertCount} label="Aberturas" />
        </div>
      </Card>
    </div>
  );
}
