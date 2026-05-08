// ═══════════════════════════════════════════════════════════════════════════
// MODULE: components/ExportDialog.jsx
// En React: src/components/ExportDialog.tsx
// ═══════════════════════════════════════════════════════════════════════════
import React from "react";
import { SIMBOLOS_INFO, type Project } from "../types";
import { RENDERER } from "../lib/renderer";

interface ExportDialogProps {
  project: Project;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export function ExportDialog({ project, onClose, onToast }: ExportDialogProps) {
  const [inclRefs, setInclRefs] = React.useState(true);

  const downloadBlob = (content: string, name: string, type: string) => {
    const url=URL.createObjectURL(new Blob([content],{type}));
    Object.assign(document.createElement('a'),{href:url,download:name}).click();
    URL.revokeObjectURL(url);
  };

  const exportSVG = () => {
    for (const amb of (project.ambientes||[])) {
      const svg = RENDERER.render(amb, project.meta, inclRefs);
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
        const info=SIMBOLOS_INFO[el.tipo]||{label:el.tipo};
        if (!el.datos?.length) rows.push([project.meta.nombre,amb.nombre,info.label,el.referencia||'','','']);
        else for (const d of el.datos) rows.push([project.meta.nombre,amb.nombre,info.label,el.referencia||'',d.clave,d.valor]);
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
          <button className="btn btn-ghost" onClick={exportCSV}>↓ CSV</button>
          <button className="btn btn-ghost" onClick={exportJSON}>↓ JSON (backup)</button>
        </div>
        <div className="dialog-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}