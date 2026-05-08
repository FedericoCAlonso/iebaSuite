/**
 * ═══════════════════════════════════════════════════════════════════════════
 * HOOK: useZoomPan
 * 
 * Gestiona la lógica de manipulación espacial (Zoom y Pan) para el Preview.
 * Soporta Mouse (Wheel, Drag) y Touch (Pinch-to-zoom, Pan).
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';

// Definimos la interfaz del estado del Pan para mayor claridad
interface Vector2 {
  x: number;
  y: number;
}

export function useZoomPan(containerRef: React.RefObject<HTMLElement | null>) {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<Vector2>({ x: 0, y: 0 });
  
  // Refs para tracking de estado sin disparar re-renders
  const dragging = useRef<boolean>(false);
  const lastPos = useRef<Vector2>({ x: 0, y: 0 });
  const lastDist = useRef<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // --- Mouse Events ---

    const onWheel = (e: WheelEvent) => {
      // Prevenimos el scroll de la página al usar la rueda sobre el plano
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.12 : 0.89;
      setZoom(z => Math.max(0.1, Math.min(10, z * factor)));
    };

    const onMouseDown = (e: MouseEvent) => {
      // Activamos pan con botón central o Alt + Click izquierdo
      if (e.button === 1 || e.altKey) {
        dragging.current = true;
        lastPos.current = { x: e.clientX, y: e.clientY };
        el.style.cursor = 'grabbing';
        e.preventDefault();
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      
      setPan(p => ({ x: p.x + dx, y: p.y + dy }));
      lastPos.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      dragging.current = false;
      if (el) el.style.cursor = 'crosshair';
    };

    // --- Touch Events (Mobile) ---

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        // Pinch-to-zoom: calculamos distancia inicial entre dedos
        lastDist.current = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      } else if (e.touches.length === 1) {
        // Pan táctil con un dedo
        dragging.current = true;
        lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && lastDist.current !== null) {
        const d = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        // Aplicamos el ratio de cambio de distancia al zoom
        setZoom(z => Math.max(0.1, Math.min(10, z * (d / (lastDist.current as number)))));
        lastDist.current = d;
      } else if (e.touches.length === 1 && dragging.current) {
        const dx = e.touches[0].clientX - lastPos.current.x;
        const dy = e.touches[0].clientY - lastPos.current.y;
        
        setPan(p => ({ x: p.x + dx, y: p.y + dy }));
        lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchEnd = () => {
      dragging.current = false;
      lastDist.current = null;
    };

    // --- Suscripción de Eventos ---
    
    // Wheel debe ser no-pasivo para poder usar preventDefault()
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd);

    // --- Cleanup ---
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [containerRef]); // Se reinicia si cambia la referencia del contenedor

  // --- Funciones de Control Expuestas ---

  const resetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const zoomIn = useCallback(() => setZoom(z => Math.min(10, z * 1.25)), []);
  
  const zoomOut = useCallback(() => setZoom(z => Math.max(0.1, z * 0.8)), []);

  return { zoom, pan, resetZoom, zoomIn, zoomOut };
}