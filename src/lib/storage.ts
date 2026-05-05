// ═══════════════════════════════════════════════════════════════════════════
// MODULE: storage.js
// Persistencia en localStorage.
// En React: src/lib/storage.ts
// ═══════════════════════════════════════════════════════════════════════════
import type { Ambiente, Project, Pared } from '../types';

export const STORAGE = (() => {
  const KEY = 'ieba_croquis_v2';

  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)||'[]'); } catch { return []; } };
  const save = (projects: any) => localStorage.setItem(KEY, JSON.stringify(projects));

  const newAmbiente = (nombre='Ambiente'): Ambiente => ({
    id: Date.now().toString()+Math.random().toString(36).slice(2),
    nombre,
    sentido: 'horario',
    mostrar_cotas: true,
    paredes: [{ id:'w1', largo:0, angulo:90, grosor:0, irregularidades:[], esquina_saliente:null }],
    aberturas: [],
    elementos: [],
  });

  const newProject = (): Project => ({
    id: Date.now().toString(),
    meta: { nombre:'Nuevo proyecto', escala:50, grosor_pared_default:0.15 },
    ambientes: [newAmbiente('Ambiente 1')],
    updatedAt: Date.now(),
  });

  const newPared = (): Pared => ({
    id: Date.now().toString()+Math.random().toString(36).slice(2),
    largo:0, angulo:90, grosor:0, irregularidades:[], esquina_saliente:null,
  });

  const newAbertura = () => ({
    id: Date.now().toString()+Math.random().toString(36).slice(2),
    pared:0, tipo:'puerta', posicion:0.5, ancho:0.9, hojas:1, lado:'interior', sentido:'derecha',
  });

  const newElemento = (tipo, x=100, y=100) => ({
    id: Date.now().toString()+Math.random().toString(36).slice(2),
    tipo, referencia:'', x, y,
    paredIdx: null, paredPos: null,
    datos:[], mostrarDato:false,
  });

  return { load, save, newProject, newAmbiente, newPared, newAbertura, newElemento };
})();