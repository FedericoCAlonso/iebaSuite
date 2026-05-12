# Documentación Técnica — Croquizador PWA

## 📋 Introducción
Este documento detalla el funcionamiento interno, la arquitectura y los algoritmos clave utilizados en el Croquizador PWA.

---

## 🏗️ Arquitectura de la Aplicación

### Patrón de Diseño
La aplicación sigue un enfoque de **Desarrollo Basado en Features** con una clara separación entre la lógica de presentación (React) y la lógica de negocio (Motores independientes).

### Componentes de Estado
- **`useEditorState.ts`**: Centraliza la gestión de muros, aberturas, elementos eléctricos y circuitos. Utiliza `useMemo` para cálculos geométricos pesados, asegurando que el renderizado sea fluido.
- **`Storage`**: Persistencia transparente en LocalStorage con un sistema de fábricas (`createAmbiente`, `createProject`, etc.) para asegurar la integridad de los datos.

---

## 📐 Motor de Geometría (`geometry.ts`)

El núcleo del sistema es un motor vectorial que maneja:
1.  **Cálculo de Polígonos**: Transforma una secuencia de segmentos en polígonos cerrados o abiertos con grosor.
2.  **Miter Joints**: Calcula las intersecciones de las líneas paralelas (interior/exterior) para que las esquinas se unan en un punto exacto (inglete), sin importar el ángulo entre paredes.
3.  **Sistema de Coordenadas**: Maneja la conversión entre metros (unidad de medida del relevamiento) y píxeles (unidad de dibujo).

---

## 🎨 Motor de Renderizado (`renderer.ts`)

Utiliza una técnica de **Renderizado Estratificado** para producir planos profesionales:
- **Capa 0 (Fondo)**: Cuadrícula técnica.
- **Capa 1 (Suelos)**: Fills de ambientes enlazados.
- **Capa 2 (Muros)**: Dibujo de paredes filtrando segmentos compartidos.
- **Capa 3 (Aberturas)**: Inserción de puertas y ventanas con limpieza de trazos de muro.
- **Capa 4 (Bocas)**: Símbolos eléctricos AEA orientados automáticamente.
- **Capa 5 (Netlist)**: Conexiones lógicas inter-ambiente.

---

## 🗺️ Smart Fusion & Clusters

### Algoritmo de Ensamble
El sistema de "Plano Maestro" funciona mediante un algoritmo de **Clusters**:
1.  Se detectan conexiones (vínculos) a través de aberturas (Puerta A -> Puerta B).
2.  Se realiza un recorrido BFS para calcular la posición global de cada habitación.
3.  Si la Puerta A está en `(x1, y1)` con rotación `r1`, y la Puerta B está en `(x2, y2)` con rotación `r2`, se calcula la matriz de transformación para que la Puerta B coincida exactamente con la A en el espacio global.

### Deduplicación de Muros
Para evitar el solapamiento visual y el engrosamiento artificial de las paredes:
- Al renderizar el maestro, si un segmento de pared tiene un vínculo "esclavo", el motor **omite el dibujo de sus líneas**, dejando que el segmento "maestro" represente físicamente la pared compartida.

---

## 🛠️ Guía de Desarrollo

### Agregar un nuevo símbolo
Para añadir un símbolo eléctrico:
1.  Definirlo en `symbols.ts` con su path SVG y parámetros de anclaje.
2.  El sistema lo incluirá automáticamente en la galería y en el motor de renderizado.

### Requisitos de Build
- Node.js 18+
- TypeScript 5+
- Vite 5+

---
*ieBA Ingeniería Eléctrica — 2024*
