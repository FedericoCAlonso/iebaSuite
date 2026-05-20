// ═══════════════════════════════════════════════════════════════════════════
// HOOK: useAmbienteHistory
// Gestión del stack de deshacer (undo) para el ambiente activo.
// Se reinicia automáticamente cuando cambia el ambiente activo.
// ═══════════════════════════════════════════════════════════════════════════
import { useState, useCallback, useEffect } from 'react';
import type { Ambiente } from '../types/index';

/** Tamaño máximo del historial de deshacer */
const MAX_HISTORY = 20;

export function useAmbienteHistory(activeAmbienteId: string | null) {
  const [history, setHistory] = useState<Ambiente[]>([]);

  // Reiniciar historial cuando cambia el ambiente activo
  useEffect(() => {
    setHistory([]);
  }, [activeAmbienteId]);

  /**
   * Registra el estado anterior del ambiente ANTES de una modificación.
   * Debe llamarse desde updateAmbiente.
   */
  const pushHistory = useCallback((prev: Ambiente) => {
    setHistory(h => [...h, prev].slice(-MAX_HISTORY));
  }, []);

  /**
   * Extrae el último estado del historial para restaurarlo.
   * Retorna null si el historial está vacío.
   */
  const popHistory = useCallback((): Ambiente | null => {
    let popped: Ambiente | null = null;
    setHistory(h => {
      if (h.length === 0) return h;
      popped = h[h.length - 1];
      return h.slice(0, -1);
    });
    return popped;
  }, []);

  return {
    history,
    pushHistory,
    popHistory,
    canUndo: history.length > 0,
  };
}
