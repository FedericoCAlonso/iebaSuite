// ═══════════════════════════════════════════════════════════════════════════
// MODULE: features/measurements/components/ExportButton.tsx
// Botón de exportación CSV de mediciones.
// Genera un archivo CSV descargable con los datos del tipo activo o todos.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useRef, useEffect } from 'react';
import type { Measurement, ModuleType } from '../../../types/index';
import { MEDICION_CONFIG, RESULTADO_LABELS, CARD_FIELD_EXTRACTORS } from '../constants';

interface ExportButtonProps {
  measurements: Measurement[];
  activeType: ModuleType;
  projectName: string;
}

/**
 * Genera el contenido CSV para un array de mediciones.
 * Incluye encabezados y escapa comas/comillas en los valores.
 */
function generateCSV(measurements: Measurement[]): string {
  if (measurements.length === 0) return '';

  const escape = (val: unknown): string => {
    const s = String(val ?? '');
    // Si contiene coma, comilla o salto de línea, envolver en comillas dobles
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };

  const rows: string[][] = [];

  // Encabezados fijos
  const headers = [
    'Tipo', 'Resultado', 'Ubicación', 'Fecha',
    'Operador', 'Instrumento ID', 'Error medición', 'Observaciones',
    'Entidad ID', 'Campos específicos'
  ];
  rows.push(headers);

  measurements.forEach(m => {
    const cfg = MEDICION_CONFIG[m.moduleType];
    const extractors = CARD_FIELD_EXTRACTORS[m.moduleType];
    const specificFields = extractors
      .map(f => `${f.label}: ${f.get(m) ?? ''}`)
      .join(' | ');

    const entityId = m.elementoId || m.circuitoId || m.diferencialId || m.tableroId || '';
    const fecha = new Date(m.timestamp).toLocaleString('es-AR');

    rows.push([
      cfg.label,
      RESULTADO_LABELS[m.resultado],
      m.ubicacion || '',
      fecha,
      m.operador || '',
      m.instrumentoId || '',
      m.errorMedicion || '',
      m.observaciones || '',
      entityId,
      specificFields,
    ].map(escape));
  });

  return rows.map(r => r.join(',')).join('\r\n');
}

/**
 * Descarga un string como archivo en el navegador.
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob(['\uFEFF' + content], { type: mimeType + ';charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const ExportButton: React.FC<ExportButtonProps> = ({ measurements, activeType, projectName }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar el menú al hacer click fuera
  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  const safeName = projectName.replace(/[^a-z0-9_-]/gi, '_').substring(0, 30);
  const dateStr = new Date().toISOString().slice(0, 10);

  const handleExportActive = () => {
    const filtered = measurements.filter(m => m.moduleType === activeType);
    const cfg = MEDICION_CONFIG[activeType];
    const csv = generateCSV(filtered);
    if (!csv) { alert('No hay mediciones de este tipo para exportar.'); return; }
    downloadFile(csv, `mediciones_${cfg.label.replace(/ /g, '_')}_${safeName}_${dateStr}.csv`, 'text/csv');
    setOpen(false);
  };

  const handleExportAll = () => {
    const csv = generateCSV(measurements);
    if (!csv) { alert('No hay mediciones para exportar.'); return; }
    downloadFile(csv, `mediciones_todas_${safeName}_${dateStr}.csv`, 'text/csv');
    setOpen(false);
  };

  return (
    <div className="export-btn-wrapper" ref={menuRef}>
      <button
        className="btn btn-ghost btn-sm export-btn-trigger"
        onClick={() => setOpen(v => !v)}
        title="Exportar mediciones"
        type="button"
      >
        ↓ Exportar
      </button>
      {open && (
        <div className="export-dropdown">
          <button className="export-dropdown-item" onClick={handleExportActive} type="button">
            <span className="export-item-icon">📋</span>
            <span>
              <strong>Tipo activo como CSV</strong>
              <small>{MEDICION_CONFIG[activeType].label} ({measurements.filter(m => m.moduleType === activeType).length} registros)</small>
            </span>
          </button>
          <button className="export-dropdown-item" onClick={handleExportAll} type="button">
            <span className="export-item-icon">📊</span>
            <span>
              <strong>Todas las mediciones</strong>
              <small>{measurements.length} registros totales</small>
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
