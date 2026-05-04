// ═══════════════════════════════════════════════════════════════════════════
// MODULE: components/Field.jsx
// Wrapper de campo de formulario.
// En React: src/components/Field.tsx
// ═══════════════════════════════════════════════════════════════════════════

export function F({ label, children, row=false }) {
  return (
    <div className={row ? 'field-row' : 'field'}>
      {!row && <label>{label}</label>}
      {children}
    </div>
  );
}