# 📐 Croquizador PWA

**Croquizador** es una herramienta profesional para el relevamiento arquitectónico y diseño de instalaciones eléctricas. Diseñada como una Progressive Web App (PWA), permite a los técnicos trabajar en campo de forma ágil y precisa.

## ✨ Características Principales

- **Levantamiento Arquitectónico**: Dibujo de ambientes mediante rumbos y longitudes con cálculo automático de polígonos y muros.
- **Instalación Eléctrica**: Catálogo de símbolos eléctricos normalizados (AEA) con anclaje inteligente a muros.
- **Smart Fusion (Master Plan)**: Algoritmo de unión recursiva que fusiona múltiples hojas de relevamiento en un único plano maestro, deduplicando muros compartidos y aberturas vinculadas.
- **Netlist Inter-Ambiente**: Conexión de bocas eléctricas a través de diferentes habitaciones.
- **Renderizado de Alta Fidelidad**: Motor SVG estratificado que garantiza planos nítidos y profesionales.
- **Modo Offline**: Funcionamiento completo sin conexión a internet gracias a Service Workers.

## 🚀 Tecnologías

- **Core**: React 18 + TypeScript.
- **Build Tool**: Vite.
- **Geometría**: Motor propio basado en trigonometría vectorial.
- **Render**: SVG nativo manipulado por capas.
- **Estilos**: CSS Modules (Vanilla CSS).
- **PWA**: Vite PWA Plugin.

## 🛠️ Instalación y Uso

1.  **Clonar el repositorio**
2.  **Instalar dependencias**: `npm install`
3.  **Iniciar desarrollo**: `npm run dev`
4.  **Generar versión de producción**: `npm run build`

## 📂 Estructura del Proyecto

- `/src/lib/geometry.ts`: Motor de cálculos geométricos y transformaciones.
- `/src/lib/renderer.ts`: Motor de renderizado SVG estratificado.
- `/src/hooks/useEditorState.ts`: Lógica de negocio y estado del editor.
- `/src/components/MasterView.tsx`: Orquestador de la fusión de planos.

## 📄 Licencia

Propiedad de **ieBA — Ingeniería Eléctrica**. Todos los derechos reservados.
