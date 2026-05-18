// Hook de mediciones eléctricas — estado local con sync opcional a Firebase
import { useState, useCallback } from 'react';
import { useAuth } from '../core/AuthContext';
import {
  saveMeasurementRemote,
  addMeasurementRemote,
  listMeasurementsByProject,
  deleteMeasurementRemote,
} from '../firebase/measurementService';
import type { Measurement, MeasurementBase } from '../types/index';

const STORAGE_KEY = 'ieba_measurements_v1';

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
  termografia: {
    label: 'Termografía',
    icon: '🌡️',
    unidadDefault: '°C',
    campos: ['Temperatura (°C)', 'ΔT ambiente (°C)', 'Emisividad'],
  },
  calidad_potencia: {
    label: 'Calidad de potencia',
    icon: '📊',
    unidadDefault: '%',
    campos: ['THD V (%)', 'THD I (%)', 'Factor de potencia', 'Tensión (V)', 'Corriente (A)'],
  },
  srt_boca: {
    label: 'SRT boca a boca',
    icon: '🔌',
    unidadDefault: '-',
    campos: ['Resultado', 'Observaciones'],
  },
};

function loadLocal(projectId: string): Measurement[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${projectId}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveLocal(projectId: string, list: Measurement[]) {
  try {
    localStorage.setItem(`${STORAGE_KEY}_${projectId}`, JSON.stringify(list));
  } catch { /* ignore */ }
}

export function useMeasurements(projectId: string) {
  const { user } = useAuth();
  const [measurements, setMeasurements] = useState<Measurement[]>(() => loadLocal(projectId));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

