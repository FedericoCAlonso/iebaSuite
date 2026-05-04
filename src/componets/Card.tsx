// ═══════════════════════════════════════════════════════════════════════════
// MODULE: components/Card.jsx
// Tarjeta colapsable del feed.
// En React: src/components/Card.tsx
// ═══════════════════════════════════════════════════════════════════════════
import React from 'react';

export function Card({ idx, idxColor='var(--acc)', title, badge, onRemove, children, defaultOpen=true }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="card">
      <div className={`card-hdr ${open?'open':''}`} onClick={()=>setOpen(o=>!o)}>
        <span className="card-idx" style={{color:idxColor}}>{idx}</span>
        <span className="card-title-main">{title}</span>
        {badge && <span className="card-badge">{badge}</span>}
        {onRemove && (
          <button className="btn btn-danger btn-xs btn-icon"
            onClick={e=>{e.stopPropagation();onRemove();}} title="Eliminar">✕</button>
        )}
        <span className={`card-chevron ${open?'open':''}`}>▶</span>
      </div>
      {open && <div className="card-body">{children}</div>}
    </div>
  );
}