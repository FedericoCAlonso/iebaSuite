// ═══════════════════════════════════════════════════════════════════════════
// HOOK: useProjectMigration
// Migración de datos legados de proyectos al esquema V2 (relacional y plano).
// ═══════════════════════════════════════════════════════════════════════════
import type { Project } from '../types/index';

/**
 * Convierte un proyecto de cualquier versión anterior (V1 o híbrido) a la estructura limpia V2.
 * Esta función es pura e inofensiva sobre objetos que ya están en formato V2.
 *
 * Realiza las siguientes migraciones:
 * 1. Mueve las propiedades técnicas de `meta` (`escala`, `grosor_pared_default`, `alturaDefault`) a la raíz del proyecto.
 * 2. Mapea `ownerId` a `electricistaId` si el segundo no está definido, y elimina `ownerId`.
 * 3. Inicializa con valores predeterminados seguros los campos relacionales (`clienteId`, `inmueble`, `suministro`, `estado`).
 * 4. Inicializa todas las colecciones del proyecto (ambientes, circuitos, conexiones, tableros, etc.) como arrays vacíos en caso de ser nulos o indefinidos.
 * 5. Si es necesario, realiza la migración de coordenadas en píxeles a metros en todos los elementos y textos de los ambientes.
 *
 * @param p - El proyecto (posiblemente heredado) a migrar.
 * @returns El proyecto migrado bajo la interfaz estricta Project V2.
 */
export function migrateProjectToV2(p: any): Project {
  // 1. Detección rápida: si ya cuenta con escala y grosor en el root, no tiene meta,
  // y todos los arrays/campos requeridos están inicializados sin requerir migración de coordenadas:
  if (p.escala !== undefined && p.grosor_pared_default !== undefined && !p.meta) {
    const needsCoordMigration = p.ambientes?.some((amb: any) =>
      amb.elementos?.some((el: any) => (el.paredPos || 0) > 40 || Math.abs(el.x) > 100)
    );

    const hasAllFields =
      p.clienteId !== undefined &&
      p.electricistaId !== undefined &&
      p.estado !== undefined &&
      p.inmueble !== undefined &&
      p.suministro !== undefined &&
      p.ambientes !== undefined &&
      p.circuitos !== undefined &&
      p.conexiones !== undefined &&
      p.tableros !== undefined &&
      p.diferenciales !== undefined &&
      p.tramos !== undefined &&
      p.unifilDiagrams !== undefined &&
      p.hojasMaestras !== undefined;

    if (!needsCoordMigration && hasAllFields) {
      return p as Project;
    }
  }

  // 2. Realizar migración de estructura
  const migrated = { ...p };

  // Migrar metadatos del plano (meta -> root)
  if (migrated.meta) {
    migrated.nombre = migrated.meta.nombre || migrated.nombre;
    migrated.escala = migrated.meta.escala ?? 50;
    migrated.grosor_pared_default = migrated.meta.grosor_pared_default ?? 0.15;
    migrated.alturaDefault = migrated.meta.alturaDefault ?? 2.6;
    delete migrated.meta;
  } else {
    migrated.escala = migrated.escala ?? 50;
    migrated.grosor_pared_default = migrated.grosor_pared_default ?? 0.15;
    migrated.alturaDefault = migrated.alturaDefault ?? 2.6;
  }

  // Migrar propietario (ownerId -> electricistaId)
  if (migrated.ownerId && !migrated.electricistaId) {
    migrated.electricistaId = migrated.ownerId;
  }
  delete migrated.ownerId;
  if (!migrated.electricistaId) migrated.electricistaId = 'local';

  // Inicializar campos mínimos obligatorios de inmueble y suministro
  if (!migrated.inmueble) {
    migrated.inmueble = { direccion: '', partido: '', provincia: '', uso: 'residencial' };
  }
  if (!migrated.suministro) {
    migrated.suministro = { tension: 220, fases: 1 };
  }
  if (!migrated.estado) {
    migrated.estado = 'relevamiento';
  }
  if (!migrated.clienteId) {
    migrated.clienteId = '';
  }

  // Asegurar colecciones de entidades
  migrated.ambientes = migrated.ambientes ?? [];
  migrated.circuitos = migrated.circuitos ?? [];
  migrated.conexiones = migrated.conexiones ?? [];
  migrated.tableros = migrated.tableros ?? [];
  migrated.diferenciales = migrated.diferenciales ?? [];
  migrated.tramos = migrated.tramos ?? [];
  migrated.unifilDiagrams = migrated.unifilDiagrams ?? [];
  migrated.hojasMaestras = migrated.hojasMaestras ?? [];

  // Migrar coordenadas px -> m en los elementos si es necesario (legacy check de v2.0)
  migrated.ambientes = migrated.ambientes.map((amb: any) => {
    if (!amb.elementos) return amb;

    const needsMigration = amb.elementos.some(
      (el: any) => (el.paredPos || 0) > 40 || Math.abs(el.x) > 100
    );
    if (!needsMigration) return amb;

    const esc = migrated.escala;
    const elementos = amb.elementos.map((el: any) => ({
      ...el,
      x: el.x * esc / 1000,
      y: el.y * esc / 1000,
      paredPos: el.paredPos ? el.paredPos * esc / 1000 : null,
    }));
    const textos = amb.textos?.map((t: any) => ({
      ...t,
      x: t.x * esc / 1000,
      y: t.y * esc / 1000,
    }));
    return { ...amb, elementos, textos };
  });

  return migrated as Project;
}

/**
 * Migra una lista de proyectos de cualquier versión heredada a la estructura Project V2.
 *
 * La función es **pura**: retorna la misma referencia de array si ningún
 * proyecto requirió migración, lo que permite usarla directamente en un
 * `useEffect` con comparación por referencia en el hook `useProjects`.
 *
 * @param projects - Lista de proyectos a evaluar.
 * @returns La misma lista si no hubo cambios, o una nueva lista de proyectos totalmente migrados.
 */
export function migrateProjects(projects: Project[]): Project[] {
  const migrated = projects.map(p => migrateProjectToV2(p));

  const anyChanged = migrated.some((p, i) => p !== projects[i]);
  return anyChanged ? migrated : projects;
}
