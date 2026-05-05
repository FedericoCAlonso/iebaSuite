// ═══════════════════════════════════════════════════════════════════════════
// MODULE: hooks.js
// Custom hooks de React.
// En React: src/hooks/useProjects.ts, useToast.ts, etc.
// ═══════════════════════════════════════════════════════════════════════════
// useToast
import React from 'react';  

export function useToast() {
  const [toast, setToast] = React.useState<string | null>(null);
  const show = (msg: string) => { setToast(msg); setTimeout(()=>setToast(null),2500); };
  return { toast, show };
}
