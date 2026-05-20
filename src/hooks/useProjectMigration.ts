// ═══════════════════════════════════════════════════════════════════════════
// HOOK: useProjectMigration
// Migración one-shot de datos legacy (coordenadas px → m).
// Se ejecuta en cada render de useProjects pero solo modifica estado
// cuando detecta datos sin migrar. Retorna siempre la lista migrada.
// ═══════════════════════════════════════════════════════════════════════════
import type { Project } from '../types/index';

/**
 * Migra coordenadas de ElementoElectrico de píxeles a metros si detecta
 * valores fuera del rango esperado (> 40m o > 100m absolutos).
 * Esta migración se ejecutó masivamente en versiones <2.0 del modelo de datos.
 */
export function migrateProjects(projects: Project[]): Project[] {
  const migrated = projects.map(p => {
    if (!p.meta || !p.ambientes) return p;

    const newAmbientes = p.ambientes.map(amb => {
      if (!amb.elementos) return amb;

      const needsMigration = amb.elementos.some(
        el => (el.paredPos || 0) > 40 || Math.abs(el.x) > 100
      );
      if (!needsMigration) return amb;

      const esc = p.meta.escala || 50;
      const elementos = amb.elementos.map(el => ({
        ...el,
        x:       el.x       * esc / 1000,
        y:       el.y       * esc / 1000,
        paredPos: el.paredPos ? el.paredPos * esc / 1000 : null,
      }));
      const textos = amb.textos?.map(t => ({
        ...t,
        x: t.x * esc / 1000,
        y: t.y * esc / 1000,
      }));
      return { ...amb, elementos, textos };
    });

    const changed = newAmbientes.some((a, i) => a !== p.ambientes[i]);
    return changed ? { ...p, ambientes: newAmbientes } : p;
  });

  const anyChanged = migrated.some((p, i) => p !== projects[i]);
  return anyChanged ? migrated : projects;
}
