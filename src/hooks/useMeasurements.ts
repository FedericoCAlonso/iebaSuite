/**
 * Hook de mediciones eléctricas.
 * Gestiona el estado local de mediciones con sincronización opcional a Firebase.
 * La persistencia local usa `localStorage` como caché offline; Firebase es la
 * fuente de verdad cuando el usuario está autenticado.
 */
import { useState, useCallback } from 'react';
import { useAuth } from '../core/AuthContext';
import {
  saveMeasurementRemote,
  addMeasurementRemote,
  listMeasurementsByProject,
  deleteMeasurementRemote,
} from '../firebase/measurementService';
import type { Measurement, MeasurementBase } from '../types/index';

/** Prefijo de clave de localStorage para mediciones por proyecto */
const STORAGE_KEY = 'ieba_measurements_v1';

// ─── METADATOS POR TIPO DE MEDICIÓN ───

/**
 * Mapa de etiquetas, íconos y campos de cada tipo de módulo de medición.
 * Usado para renderizar dinámicamente formularios y tarjetas resumen.
 *
 * @deprecated Preferir `MEDICION_CONFIG` de `features/measurements/constants.ts`,
 * que incluye además `entityKind` y `elementoFilter`.
 */
export const MEDICION_LABELS: Record<Measurement['moduleType'], { label: string; icon: string; unidadDefault: string; campos: string[] }> = {
  puesta_tierra: {
    label: 'Puesta a tierra',
    icon: '⚡',
    unidadDefault: 'Ω',
    campos: ['Resistencia (Ω)', 'Método', 'Distancia jabalina (m)', 'Humedad suelo (%)'],
  },
  diferencial: {
    label: 'Diferencial',
    icon: '⏱',
    unidadDefault: 'ms',
    campos: ['Tiempo disparo (ms)', 'Corriente disparo (mA)', 'Sensibilidad (mA)', 'Tensión prueba (V)'],
  },
  continuidad_masas: {
    label: 'Continuidad de masas',
    icon: '🔗',
    unidadDefault: 'Ω',
    campos: ['Resistencia (Ω)', 'Corriente prueba (A)', 'Referencia (Ω)'],
  },
  resistencia_lazo: {
    label: 'Resistencia de lazo',
    icon: '➰',
    unidadDefault: 'Ω',
    campos: ['Impedancia (Ω)', 'Corriente prospectiva (A)', 'Tensión red (V)'],
  },
  corriente_cortocircuito: {
    label: 'Corriente de cortocircuito',
    icon: '💥',
    unidadDefault: 'A',
    campos: ['Icc (A)', 'Impedancia Z1 (Ω)', 'Impedancia Zref (Ω)', 'Método'],
  },
  resistencia_aislacion: {
    label: 'Resistencia de aislación',
    icon: '🛡️',
    unidadDefault: 'MΩ',
    campos: ['Resistencia (MΩ)', 'Tensión prueba (V)', 'Temp. ambiente (°C)', 'Humedad relativa (%)'],
  },

  calidad_potencia: {
    label: 'Calidad de potencia',
    icon: '📊',
    unidadDefault: '%',
    campos: ['THD V (%)', 'THD I (%)', 'Factor de potencia', 'Tensión (V)', 'Corriente (A)'],
  },
};

// ─── PERSISTENCIA LOCAL ───

/**
 * Carga las mediciones de un proyecto desde localStorage.
 * @param projectId ID del proyecto cuyas mediciones se leen.
 * @returns Lista de mediciones o arreglo vacío si no existen o hay error.
 */
function loadLocal(projectId: string): Measurement[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${projectId}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

/**
 * Persiste la lista de mediciones de un proyecto en localStorage.
 * @param projectId ID del proyecto.
 * @param list Lista de mediciones a guardar.
 */
function saveLocal(projectId: string, list: Measurement[]) {
  try {
    localStorage.setItem(`${STORAGE_KEY}_${projectId}`, JSON.stringify(list));
  } catch { /* ignore */ }
}

// ─── HOOK PRINCIPAL ───

/**
 * Hook de gestión de mediciones eléctricas para un proyecto específico.
 *
 * Maneja el estado de:
 * - `measurements`: lista de mediciones activas del proyecto.
 * - `isLoading`: bandera de carga durante el fetch remoto.
 * - `error`: mensaje del último error de sincronización, o `null`.
 *
 * Efectos secundarios:
 * - Lee el caché local en el montaje inicial.
 * - Al agregar/actualizar/eliminar, escribe en localStorage primero y luego
 *   replica en Firebase si el usuario está autenticado.
 *
 * @param projectId ID del proyecto al que pertenecen las mediciones.
 * @returns Estado y operaciones CRUD de mediciones.
 */
export function useMeasurements(projectId: string) {
  const { user } = useAuth();
  const [measurements, setMeasurements] = useState<Measurement[]>(() => loadLocal(projectId));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Descarga las mediciones del proyecto desde Firebase y actualiza el caché local.
   * Solo ejecuta si el usuario está autenticado y `projectId` está definido.
   */
  const refresh = useCallback(async () => {
    if (!user || !projectId) return;
    setIsLoading(true);
    setError(null);
    try {
      const remote = await listMeasurementsByProject(projectId);
      setMeasurements(remote);
      saveLocal(projectId, remote);
    } catch (e: any) {
      setError(e.message || 'Error cargando mediciones');
    } finally {
      setIsLoading(false);
    }
  }, [user, projectId]);

  /**
   * Agrega una nueva medición al estado local y la sincroniza con Firebase.
   * El ID y el timestamp se generan automáticamente.
   * @param m Datos de la medición sin `id` ni `timestamp`.
   * @returns La medición completa con ID y timestamp asignados.
   */
  const addMeasurement = useCallback(
    async (m: Omit<MeasurementBase, 'id' | 'timestamp'> & Partial<Measurement>) => {
      const timestamp = Date.now();
      const id = `${projectId}_${m.moduleType}_${timestamp}`;
      const full = { ...m, id, timestamp, projectId } as Measurement;

      setMeasurements(prev => {
        const next = [full, ...prev];
        saveLocal(projectId, next);
        return next;
      });

      if (user) {
        try {
          await addMeasurementRemote(full);
        } catch (e: any) {
          setError(e.message || 'Error sync medición');
        }
      }
      return full;
    },
    [user, projectId]
  );

  /**
   * Actualiza parcialmente una medición existente por su ID.
   * Aplica el cambio localmente primero y luego sincroniza con Firebase.
   * @param id ID de la medición a actualizar.
   * @param updates Campos a sobreescribir.
   */
  const updateMeasurement = useCallback(
    async (id: string, updates: Partial<Measurement>) => {
      setMeasurements(prev => {
        const next = prev.map(p => (p.id === id ? { ...p, ...updates } as Measurement : p));
        saveLocal(projectId, next);
        return next;
      });

      if (user) {
        try {
          const existing = measurements.find(p => p.id === id);
          if (existing) await saveMeasurementRemote({ ...existing, ...updates } as Measurement);
        } catch (e: any) {
          setError(e.message || 'Error sync medición');
        }
      }
    },
    [user, projectId, measurements]
  );

  /**
   * Elimina una medición por su ID del estado local y de Firebase.
   * @param id ID de la medición a eliminar.
   */
  const deleteMeasurement = useCallback(
    async (id: string) => {
      setMeasurements(prev => {
        const next = prev.filter(p => p.id !== id);
        saveLocal(projectId, next);
        return next;
      });

      if (user) {
        try {
          await deleteMeasurementRemote(id);
        } catch (e: any) {
          setError(e.message || 'Error sync medición');
        }
      }
    },
    [user, projectId]
  );

  return {
    measurements,
    isLoading,
    error,
    refresh,
    addMeasurement,
    updateMeasurement,
    deleteMeasurement,
  };
}


