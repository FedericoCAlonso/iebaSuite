// ═══════════════════════════════════════════════════════════════════════════
// MODULE: features/measurements/hooks/useEntityOptions.ts
// Genera listas de entidades del proyecto para vincular mediciones.
// ═══════════════════════════════════════════════════════════════════════════

import { useMemo } from 'react';
import { useCurrentProject } from '../../../core/ProjectContext';
import type { ModuleType, ElementoElectrico } from '../../../types/index';

export interface EntityOption {
  id: string;
  label: string;
  group?: string;
}

export interface EntityOptions {
  elementos: EntityOption[];
  circuitos: EntityOption[];
  diferenciales: EntityOption[];
  tableros: EntityOption[];
  ambientes: EntityOption[];
}

function buildElementoLabel(el: ElementoElectrico): string {
  const parts = [el.tipo, el.referencia].filter(Boolean);
  return parts.join(' ');
}

export function useEntityOptions(): EntityOptions | null {
  const { activeProject } = useCurrentProject();

  return useMemo(() => {
    if (!activeProject) return null;

    const ambientes = activeProject.ambientes || [];

    const elementoOpts: EntityOption[] = [];
    ambientes.forEach(amb => {
      (amb.elementos || []).forEach(el => {
        elementoOpts.push({
          id: el.id,
          label: `${buildElementoLabel(el)} — ${amb.nombre}`,
          group: amb.nombre,
        });
      });
    });

    const circuitoOpts: EntityOption[] = (activeProject.circuitos || []).map(c => ({
      id: c.id,
      label: `${c.nombre} (${c.tipo})`,
      group: c.tableroId ? `Tablero ${c.tableroId.slice(0, 6)}` : undefined,
    }));

    const diferencialOpts: EntityOption[] = (activeProject.diferenciales || []).map(d => ({
      id: d.id,
      label: `${d.tipo} ${d.sensibilidadMA}mA ${d.inominalA}A — ${d.polos}P`,
      group: d.tableroId ? `Tablero ${d.tableroId.slice(0, 6)}` : undefined,
    }));

    const tableroOpts: EntityOption[] = (activeProject.tableros || []).map(t => ({
      id: t.id,
      label: t.nombre || t.id.slice(0, 8),
      group: t.ubicacion,
    }));

    const ambienteOpts: EntityOption[] = ambientes.map(a => ({
      id: a.id,
      label: a.nombre || a.id.slice(0, 8),
    }));

    return {
      elementos: elementoOpts,
      circuitos: circuitoOpts,
      diferenciales: diferencialOpts,
      tableros: tableroOpts,
      ambientes: ambienteOpts,
    };
  }, [activeProject]);
}

export function filterElementosByTipo(opts: EntityOption[], filter?: RegExp): EntityOption[] {
  if (!filter) return opts;
  return opts.filter(o => filter.test(o.label));
}

export function getEntityKindForType(_type: ModuleType): EntityOptions[keyof EntityOptions] | null {
  // Este helper se usa con useEntityOptions para traer la lista correcta
  return null;
}
