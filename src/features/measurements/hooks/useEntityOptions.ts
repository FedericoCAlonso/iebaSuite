// ═══════════════════════════════════════════════════════════════════════════
// MODULE: features/measurements/hooks/useEntityOptions.ts
// Genera listas de entidades del proyecto para vincular mediciones.
// Transforma las colecciones del proyecto activo en opciones de selector
// (id + label + group) listas para usar en formularios.
// ═══════════════════════════════════════════════════════════════════════════

import { useMemo } from 'react';
import { useCurrentProject } from '../../../core/ProjectContext';
import type { ModuleType, ElementoElectrico } from '../../../types/index';

/**
 * Representación plana de una entidad del proyecto usada en selectores.
 */
export interface EntityOption {
  /** ID único de la entidad en el proyecto. */
  id: string;
  /** Texto descriptivo mostrado al usuario en el selector. */
  label: string;
  /** Agrupación opcional (ej: nombre del ambiente, ID del tablero). */
  group?: string;
}

/**
 * Colección completa de opciones de entidades disponibles para vincular
 * a una medición, agrupadas por tipo de entidad.
 */
export interface EntityOptions {
  /** Elementos eléctricos de todos los ambientes del proyecto. */
  elementos: EntityOption[];
  /** Circuitos definidos en el proyecto. */
  circuitos: EntityOption[];
  /** Diferenciales definidos en el proyecto. */
  diferenciales: EntityOption[];
  /** Tableros eléctricos del proyecto. */
  tableros: EntityOption[];
  /** Ambientes del proyecto. */
  ambientes: EntityOption[];
}

/**
 * Construye la etiqueta legible de un `ElementoElectrico` combinando
 * su tipo y referencia. Si alguno está vacío, se omite.
 * @param el Elemento eléctrico a describir.
 * @returns Cadena con tipo y referencia separados por espacio.
 */
function buildElementoLabel(el: ElementoElectrico): string {
  const parts = [el.tipo, el.referencia].filter(Boolean);
  return parts.join(' ');
}

/**
 * Hook que deriva, a partir del proyecto activo, todas las listas de
 * entidades disponibles para vincular a una medición eléctrica.
 *
 * Utiliza `useMemo` para recalcular las listas solo cuando cambia el proyecto.
 *
 * @returns Objeto con las cinco listas de opciones, o `null` si no hay
 *   proyecto activo en el contexto.
 */
export function useEntityOptions(): EntityOptions | null {
  const { activeProject } = useCurrentProject();

  return useMemo(() => {
    if (!activeProject) return null;

    const ambientes = activeProject.ambientes || [];

    // Recolectar todos los elementos eléctricos de todos los ambientes,
    // etiquetando cada uno con el nombre de su ambiente como group.
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

    // Circuitos con su tablero como group (primeros 6 chars del tableroId)
    const circuitoOpts: EntityOption[] = (activeProject.circuitos || []).map(c => ({
      id: c.id,
      label: `${c.nombre} (${c.tipo})`,
      group: c.tableroId ? `Tablero ${c.tableroId.slice(0, 6)}` : undefined,
    }));

    // Diferenciales con sensibilidad, corriente nominal y polos en la etiqueta
    const diferencialOpts: EntityOption[] = (activeProject.diferenciales || []).map(d => ({
      id: d.id,
      label: `${d.tipo} ${d.sensibilidadMA}mA ${d.inominalA}A — ${d.polos}P`,
      group: d.tableroId ? `Tablero ${d.tableroId.slice(0, 6)}` : undefined,
    }));

    // Tableros con su ubicación como group
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

// ─── HELPERS DE FILTRADO ───

/**
 * Filtra una lista de opciones de elementos por tipo usando una expresión regular.
 * Si no se proporciona filtro, retorna la lista completa.
 * @param opts Lista de opciones de elementos a filtrar.
 * @param filter Expresión regular aplicada sobre la etiqueta de cada opción.
 * @returns Sublista de opciones cuyos labels coinciden con el filtro.
 */
export function filterElementosByTipo(opts: EntityOption[], filter?: RegExp): EntityOption[] {
  if (!filter) return opts;
  return opts.filter(o => filter.test(o.label));
}

/**
 * Helper de conveniencia para obtener la lista de entidades correspondiente
 * al tipo de módulo activo. Actualmente devuelve `null` y debe ser resuelto
 * externamente combinando `useEntityOptions` con `MEDICION_CONFIG[type].entityKind`.
 *
 * @param _type Tipo de módulo de medición (no utilizado internamente).
 * @returns Siempre `null`; usar `MEDICION_CONFIG` para la lógica de selección.
 */
export function getEntityKindForType(_type: ModuleType): EntityOptions[keyof EntityOptions] | null {
  // Este helper se usa con useEntityOptions para traer la lista correcta
  return null;
}
