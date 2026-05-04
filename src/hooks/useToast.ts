// ═══════════════════════════════════════════════════════════════════════════
// MODULE: hooks.js
// Custom hooks de React.
// En React: src/hooks/useProjects.ts, useToast.ts, etc.
// ═══════════════════════════════════════════════════════════════════════════
// useToast
import React from 'react';  

export function useToast() {
  const [toast, setToast] = React.useState(null);
  const show = (msg) => { setToast(msg); setTimeout(()=>setToast(null),2500); };
  return { toast, show };
}
