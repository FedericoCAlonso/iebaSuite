// ═══════════════════════════════════════════════════════════════════════════
// MODULE: components/ExportDialog.jsx
// En React: src/components/ExportDialog.tsx
// ═══════════════════════════════════════════════════════════════════════════
import React from "react";
import { type Project, type Conexion } from "../types";
import type { DefinicionSimbolo } from "../lib/symbols";
import { RENDERER } from "../lib/renderer";

interface ExportDialogProps {
  project: Project;
  symbolsLib: DefinicionSimbolo[];
  onClose: () => void;
  onToast: (msg: string) => void;
}

export function ExportDialog({ project, symbolsLib, onClose, onToast }: ExportDialogProps) {
  const [inclRefs, setInclRefs] = React.useState(true);

  const downloadBlob = (content: string, name: string, type: string) => {
    const url=URL.createObjectURL(new Blob([content],{type}));
    Object.assign(document.createElement('a'),{href:url,download:name}).click();
    URL.revokeObjectURL(url);
  };

  const exportSVG = () => {
    for (const amb of (project.ambientes||[])) {
      const svg = RENDERER.render(amb, project.meta, symbolsLib, inclRefs);
      downloadBlob(svg, `${project.meta.nombre||'planta'}_${amb.nombre||'amb'}.svg`, 'image/svg+xml');
    }
    onToast(`${project.ambientes?.length||1} SVG exportados`);
  };

  const exportYAML = () => {
    for (const amb of (project.ambientes||[])) {
      let yaml=`proyecto:\n  nombre: "${project.meta.nombre}"\n  escala: "${project.meta.escala}"\n  grosor_pared_default: ${project.meta.grosor_pared_default||0.15}\n  mostrar_cotas: ${amb.mostrar_cotas!==false}\n  sentido: ${amb.sentido||'horario'}\n\nambiente:\n  nombre: "${amb.nombre}"\n  paredes:\n`;
      for (const w of (amb.paredes||[])) {
        yaml+=`    - largo: ${w.largo||0}\n`;
        if (w.angulo) yaml+=`      angulo: ${w.angulo}\n`;
        if (w.grosor) yaml+=`      grosor: ${w.grosor}\n`;
        if (w.esquina_saliente) yaml+=`      esquina_saliente:\n        ancho: ${w.esquina_saliente.ancho}\n`;
        if (w.irregularidades?.length) { yaml+=`      irregularidades:\n`; for (const i of w.irregularidades) yaml+=`        - posicion: ${i.posicion}\n          ancho: ${i.ancho}\n          profundidad: ${i.profundidad}\n`; }
      }
      if (amb.aberturas?.length) {
        yaml+=`\n  aberturas:\n`;
        for (const ab of amb.aberturas) { yaml+=`    - pared: ${ab.pared}\n      tipo: ${ab.tipo}\n      posicion: ${ab.posicion}\n      ancho: ${ab.ancho}\n`; if (ab.tipo==='puerta') yaml+=`      hojas: ${ab.hojas||1}\n      lado: ${ab.lado||'interior'}\n      sentido: ${ab.sentido||'derecha'}\n`; }
      }
      downloadBlob(yaml, `${project.meta.nombre}_${amb.nombre}.yaml`, 'text/yaml');
    }
    onToast('YAML exportados');
  };

  const exportCSV = () => {
    const rows=[['Proyecto','Ambiente','Tipo','Referencia','Clave','Valor']];
    for (const amb of (project.ambientes||[])) {
      for (const el of (amb.elementos||[])) {
        const symDef = symbolsLib.find(s => s.id === el.tipo);
        const label = symDef ? symDef.label : el.tipo;
        if (!el.datos?.length) rows.push([project.meta.nombre,amb.nombre,label,el.referencia||'','','']);
        else for (const d of el.datos) rows.push([project.meta.nombre,amb.nombre,label,el.referencia||'',d.clave,d.valor]);
      }
    }
    const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    downloadBlob(csv, `${project.meta.nombre}_electrico.csv`, 'text/csv');
    onToast('CSV exportado');
  };

  const exportJSON = () => {
    downloadBlob(JSON.stringify(project,null,2), `${project.meta.nombre}.json`, 'application/json');
    onToast('JSON guardado');
  };

  const exportNetlistCSV = () => {
    const rows = [['Circuito', 'Desde (Ambiente)', 'Desde (Ref)', 'Hacia (Ambiente)', 'Hacia (Ref)', 'Canalización', 'Conductores']];
    (project.conexiones || []).forEach((c: Conexion) => {
      const getAmb = (id: string) => project.ambientes.find(a => a.id === id);
      const ambF = getAmb(c.from.ambienteId);
      const ambT = getAmb(c.to.ambienteId);
      const refF = ambF?.elementos.find(e => e.id === c.from.elementoId)?.referencia || 'S/R';
      const refT = ambT?.elementos.find(e => e.id === c.to.elementoId)?.referencia || 'S/R';
      
      rows.push([
        c.circuitoId || '-',
        ambF?.nombre || '-',
        refF,
        ambT?.nombre || '-',
        refT,
        c.conducto || '-',
        c.cables?.map(cb => cb.seccion).join(' + ') || '-'
      ]);
    });
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    downloadBlob(csv, `${project.meta.nombre}_netlist.csv`, 'text/csv');
    onToast('CSV de Netlist exportado');
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="dialog" onClick={e=>e.stopPropagation()}>
        <div className="dialog-title">Exportar proyecto</div>
        <div>
          <div className="sec-hdr">SVG — un archivo por ambiente</div>
          <label style={{display:'flex',alignItems:'center',gap:8,marginTop:8,cursor:'pointer',fontSize:12}}>
            <input type="checkbox" checked={inclRefs} onChange={e=>setInclRefs(e.target.checked)}/>
            Incluir referencias y datos eléctricos
          </label>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',paddingTop:4}}>
          <button className="btn btn-acc" onClick={exportSVG}>↓ SVG ({project.ambientes?.length||1} arch.)</button>
          <button className="btn btn-ghost" onClick={exportYAML}>↓ YAML</button>
          <button className="btn btn-ghost" onClick={exportCSV}>↓ CSV (Símbolos)</button>
          <button className="btn btn-ghost" onClick={exportNetlistCSV}>↓ CSV (Netlist)</button>
          <button className="btn btn-ghost" onClick={exportJSON}>↓ JSON (backup)</button>
        </div>
        <div className="dialog-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}