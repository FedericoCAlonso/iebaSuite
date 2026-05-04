// ═══════════════════════════════════════════════════════════════════════════
// MODULE: components/NumInput.jsx
// Input numérico que maneja negativos sin bugs.
// En React: src/components/NumInput.tsx
// ═══════════════════════════════════════════════════════════════════════════
import React from 'react';

//export function NumInput({ value, onChange, step=1, placeholder='', style={} }) {
export function NumInput({ value, onChange,step=1, placeholder='', style={} }) {
  // Mantener string interno para evitar conflictos con signo negativo
  const [str, setStr] = React.useState(String(value??''));
  React.useEffect(() => { setStr(String(value??'')); }, [value]);

  const handleChange = (e) => {
    const raw = e.target.value;
    setStr(raw);
    // solo disparar onChange si es número válido
    if (raw===''||raw==='-'||raw==='.') return;
    const n = parseFloat(raw);
    if (!isNaN(n)) onChange(n);
  };
  const handleBlur = () => {
    // al salir, normalizar
    const n = parseFloat(str);
    if (isNaN(n)) { setStr(String(value??'')); return; }
    onChange(n);
    setStr(String(n));
  };

  return (
    <input
      type="text" inputMode="decimal"
      value={str}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      style={style}
    />
  );
}