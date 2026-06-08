# ieBA Suite — Arquitectura del Sistema

> **Versión:** 2.x (modelo relacional)  
> **Última actualización:** junio 2026  
> **Stack:** React 18 + TypeScript + Vite + Firebase (Firestore, Auth, Storage)

---

## 1. Visión General

**ieBA Suite** es una aplicación web Progressive Web App (PWA) para profesionales electricistas. Permite:

- **Relevar** instalaciones eléctricas dibujando planos a escala (croquis)
- **Proyectar** circuitos, tableros y conexiones en diagrama unifilar
- **Registrar mediciones** eléctricas reglamentarias (PAT, diferencial, aislación, etc.)
- **Gestionar proyectos y clientes** con sincronización en la nube
- **Generar** documentación técnica (SRT 900, exportaciones)

La app funciona **offline-first**: todo se persiste en `localStorage` y se sincroniza con Firebase cuando hay conectividad.

---

## 2. Stack Tecnológico

| Capa | Tecnología | Propósito |
|------|-----------|-----------|
| UI Framework | React 18 | Componentes y estado reactivo |
| Lenguaje | TypeScript 5 | Tipado estático |
| Bundler | Vite 8 | Build, HMR, PWA |
| PWA | vite-plugin-pwa | Service Worker, precaché |
| Base de datos | Cloud Firestore | Persistencia remota |
| Autenticación | Firebase Auth | Login (Google, email) |
| Archivos | Firebase Storage | Fotos de medición, PDFs |
| Estado global | React Context | Proyectos, clientes, perfil, símbolos |
| Routing | React Router 6 | Navegación SPA |
| CSS | Vanilla CSS | Sin preprocesadores ni frameworks |

---

## 3. Mapa de Carpetas

```
src/
├── app/                    # Configuración del router y providers raíz
│
├── core/                   # Contextos React globales (estado de sesión)
│   ├── AuthContext.tsx      # Usuario autenticado
│   ├── ClientContext.tsx    # Lista de clientes del profesional
│   ├── ProfileContext.tsx   # Perfil del electricista (matrícula, instrumentos)
│   ├── ProjectContext.tsx   # Proyecto activo + ambiente activo (dentro del editor)
│   └── SymbolsContext.tsx   # Librería de símbolos eléctricos
│
├── features/               # Módulos funcionales de la app
│   ├── auth/               # Pantallas de login / registro
│   ├── hub/                # Dashboard: proyectos, clientes, inicio
│   ├── measurements/       # Módulo de mediciones eléctricas
│   ├── profile/            # Pantalla de perfil del profesional
│   ├── relevador/          # Editor de croquis + vista previa del plano
│   └── symbols/            # Gestión de símbolos personalizados
│
├── firebase/               # Capa de acceso a datos (Firebase SDK)
│   ├── config.ts           # Inicialización de Firebase
│   ├── clientService.ts    # CRUD de clientes
│   ├── measurementService.ts # CRUD de mediciones
│   ├── profileService.ts   # CRUD de perfil
│   ├── projectService.ts   # CRUD de proyectos
│   ├── symbolService.ts    # CRUD de símbolos custom
│   └── utils.ts            # assertDb(), deepCleanUndefined()
│
├── hooks/                  # Custom hooks reutilizables
│   ├── useProjects.ts      # Orquestador principal de proyectos
│   ├── useCloudSync.ts     # Sincronización Firebase (pull/push con debounce)
│   ├── useMeasurements.ts  # Estado de mediciones + sync
│   ├── useZoomPan.ts       # Zoom y pan del canvas (mouse + touch)
│   ├── useProjectMigration.ts # Migración one-shot de datos legacy
│   └── useAmbienteHistory.ts  # Stack de deshacer (Ctrl+Z) por ambiente
│
├── lib/                    # Librerías puras (sin React)
│   ├── geometry.ts         # Cálculos geométricos del croquis
│   ├── renderer/           # Motor SVG: dibuja ambientes, paredes, símbolos
│   ├── storage.ts          # LocalStorage + factories de entidades
│   ├── symbols.ts          # Librería de símbolos eléctricos
│   ├── layout.ts           # Configuración del carátula (title block)
│   └── exporters.ts        # Generación de PDFs y reportes
│
├── types/                  # Definiciones TypeScript del dominio
│   ├── index.ts            # Barrel de re-exports
│   ├── project.ts          # Project, Ambiente, Pared, Circuito, etc.
│   ├── measurements.ts     # Measurement y sus variantes por módulo
│   ├── user.ts             # AppUser, Electricista, Cliente
│   ├── domainModels.ts     # Modelo eléctrico detallado (catálogo)
│   └── unifilar.ts         # Diagrama unifilar
│
├── ui/                     # Componentes primitivos reutilizables
│   ├── Card.tsx            # Tarjeta genérica
│   ├── Field.tsx           # Grupo label + input
│   ├── Modal.tsx           # Diálogo modal
│   └── NumInput.tsx        # Input numérico con validación
│
└── components/             # Componentes de dominio (más específicos)
    ├── AppHeader.tsx        # Barra superior del editor
    ├── ExportDialog.tsx     # Diálogo de exportación
    ├── SymbolDialog.tsx     # Selector de símbolo para insertar
    ├── SymbolManagerDialog.tsx # Gestión de símbolos custom
    └── shared/             # Componentes compartidos entre features
```

---

## 4. Flujo de Datos

```
Firebase Auth ──► AuthContext
                      │
                      ▼
              [usuario autenticado]
                      │
         ┌────────────┼────────────┐
         ▼            ▼            ▼
  ClientContext  ProfileContext  SymbolsContext
  (clientes)     (perfil)       (lib símbolos)
         │
         ▼
  useProjects ──► useCloudSync ──► Firestore
       │                               │
       │  (pull al iniciar sesión)     │
       │  (push con debounce 2s)       │
       │                               │
       ▼                               │
  localStorage ◄─────────────────────┘
  (fuente de verdad local)
       │
       ▼
  ProjectContext ──► features/relevador
                 └──► features/measurements
                 └──► features/hub
```

### Principio clave: Local-First

1. **Lectura:** siempre desde memoria/`localStorage` → respuesta instantánea
2. **Escritura:** primero en local → UI actualizada inmediatamente
3. **Sync:** push a Firestore con debounce de 2 segundos
4. **Resolución de conflictos:** gana el `updatedAt` más reciente

---

## 5. Modelo de Datos

### Jerarquía principal

```
Electricista (usuario)
└── Proyecto (Project)
    ├── Ambiente[] (habitaciones/espacios)
    │   ├── Pared[] (lados del perímetro)
    │   ├── Abertura[] (puertas, ventanas)
    │   └── ElementoElectrico[] (bocas, tableros, etc.)
    ├── Circuito[] (circuitos eléctricos)
    ├── Tablero[] (tableros eléctricos)
    └── Conexion[] (netlist: elementos conectados)

Cliente
└── proyectosIds[] → Proyecto[]

Measurement (medición)
├── projectId → Proyecto
├── elementoId? → ElementoElectrico
├── circuitoId? → Circuito
└── diferencialId? → Diferencial
```

### Estados de un Proyecto

```
relevamiento → presupuesto → en_ejecucion → ejecutado → certificado
```

Los módulos de medición (`/mediciones`, SRT 900) solo se habilitan en estado `ejecutado` o `certificado`.

### Versiones del modelo (migración)

| Versión | Cambio | Mecanismo de migración |
|---------|--------|----------------------|
| < 2.0 | Coordenadas en píxeles | `useProjectMigration.ts` — automático al cargar |
| 1.x | `tramos[]` anidados | `migrateAmbiente()` en `storage.ts` — flatten a `paredes[]` |
| 2.x | Modelo relacional + `clienteId`, `electricistaId` | Campos opcionales con valores por defecto |

---

## 6. Sistema de Símbolos

Los símbolos eléctricos son objetos `DefinicionSimbolo` con:
- `svgContent`: string SVG que se inyecta al renderizar el plano
- `escalaBase`: factor de escala relativo al metro real
- `anclaje`: punto de origen del símbolo
- `uso`: `'planta'` (croquis) o `'unifilar'` (diagrama)
- `medicionAsociada?`: vincula el símbolo a un módulo de medición

La librería se carga desde `src/symbols.json` (bundle) y se fusiona con símbolos custom del usuario (guardados en Firestore + `localStorage`).

---

## 7. Sincronización Firebase

### Pull (al iniciar sesión)
```
listProjectsRemote(uid)
  → Firestore query: projects WHERE ownerId == uid
  → merge con lista local (gana el updatedAt mayor)
  → marca lastSyncedAt para cada proyecto
```

### Push (al modificar un proyecto)
```
proyecto modificado (setProjects)
  → useCloudSync detecta updatedAt > lastSyncedAt
  → setTimeout 2000ms (debounce)
  → saveProjectRemote({ ...proyecto, electricistaId: uid, ownerId: uid })
  → actualiza lastSyncedAt
```

> **Nota:** Se guardan ambos campos `electricistaId` y `ownerId` para compatibilidad con ambas estrategias de query (el modelo nuevo usa `electricistaId`, el query usa `ownerId`).

---

## 8. Módulo de Mediciones

### Tipos de módulo (`ModuleType`)

| Tipo | Descripción | Norma |
|------|------------|-------|
| `puesta_tierra` | Resistencia de la puesta a tierra | IRAM 2281 |
| `diferencial` | Tiempo y corriente de disparo del DR | IRAM 2404 |
| `continuidad_masas` | Continuidad del conductor PE | IEC 60364 |
| `resistencia_lazo` | Impedancia del lazo de falla | IEC 61557 |
| `corriente_cortocircuito` | Icc prospectiva | IEC 60909 |
| `resistencia_aislacion` | Aislación con megóhmetro | IEC 60364-6 |
| `calidad_potencia` | THD, FP, potencias | IEC 61000 |

### Estrategia de persistencia
- **Escritura:** primero en `localStorage`, luego `addMeasurementRemote()` a Firestore
- **Lectura:** desde `localStorage` al montar; `refresh()` explícito carga desde Firestore
- **Key de storage:** `ieba_measurements_v1_${projectId}`

---

## 9. PWA y Offline

La app está configurada como PWA con `vite-plugin-pwa` en modo `generateSW`:
- **Precaché:** todos los assets del build (JS, CSS, HTML, symbols.json)
- **Runtime cache:** no configurado (Firestore usa su propio mecanismo offline)
- **Service Worker:** se actualiza automáticamente en cada deploy

Para usar completamente offline, el usuario debe haber abierto la app al menos una vez con conectividad (para que el SW precachée los assets y Firestore sincronice los datos).

---

## 10. Deuda Técnica y Cosas a Mejorar

### 🔴 Alta prioridad

#### 1. [SOLUCIONADO] Bundle demasiado grande (Anteriormente 840 KB)
El bundle JS superaba el límite de 500 KB, provocando advertencias en la compilación.
- **Solución:** Se implementó code-splitting usando `lazy` y `Suspense` en [HubRouter.tsx](file:///c:/Users/federico/Desktop/IEBA/iebaSuite/src/app/HubRouter.tsx) para cargar de forma diferida las pantallas principales.
- También se configuró `rolldownOptions.output.codeSplitting` en [vite.config.ts](file:///c:/Users/federico/Desktop/IEBA/iebaSuite/vite.config.ts) para agrupar y separar las dependencias de node_modules en chunks de proveedores independientes: `vendor-react` (~231 KB) y `vendor-firebase` (~376 KB).
- **Resultado:** El chunk inicial de entrada (`main.js`) ahora es de solo **~83 KB** y la pantalla más pesada (`RelevadorTool`) es de **~91 KB**, eliminando todas las advertencias del compilador y agilizando la carga de la aplicación.

#### 2. [SOLUCIONADO] Sin tests automatizados
Anteriormente, el proyecto no contaba con un entorno de tests.
- **Solución:** Se integró Vitest en el proyecto y se crearon suites de pruebas automatizadas para la lógica crítica:
  - [utils.test.ts](file:///c:/Users/federico/Desktop/IEBA/iebaSuite/src/firebase/utils.test.ts): Pruebas de limpieza recursiva de payloads (`deepCleanUndefined()`).
  - [useProjectMigration.test.ts](file:///c:/Users/federico/Desktop/IEBA/iebaSuite/src/hooks/useProjectMigration.test.ts): Pruebas para la migración de coordenadas legacy de píxeles a metros (`migrateProjects()`).
  - [geometry.test.ts](file:///c:/Users/federico/Desktop/IEBA/iebaSuite/src/lib/geometry.test.ts): Suite completa de 15 pruebas cubriendo álgebra vectorial, detección de cierre de pared, snaps y alineamiento geométrico de ambientes (`calcularTransformacionEnlace()`).
- Los tests se ejecutan mediante `npm run test`.

#### 3. [SOLUCIONADO] Estrategia de conflictos simplista en la nube
Anteriormente, la resolución de conflictos dependía de un `updatedAt mayor gana` ciego, lo que podía producir pérdida de datos si el mismo proyecto se editaba desde dos dispositivos offline simultáneamente.
- **Solución:** Se implementó un control de concurrencia optimista en [useCloudSync.ts](file:///c:/Users/federico/Desktop/IEBA/iebaSuite/src/hooks/useCloudSync.ts).
- Se utiliza un registro persistente `ieba_last_synced_v1` en `localStorage` que almacena el último timestamp de sincronización exitosa por proyecto.
- **Pull inicial (`syncPull`)**: Compara si el local y el remoto cambiaron desde la última fecha de sincronización común. Si ambos se modificaron, se dispara un conflicto.
- **Push debounced (`syncPush`)**: Antes de sobrescribir en la nube, se consulta la base de datos remota (`loadProjectRemote`). Si la versión en la nube es más nueva que la última sincronizada localmente, se interrumpe el push automático y se dispara un conflicto.
- **Resolución**: Se diseñó el modal [`SyncConflictModal.tsx`](file:///c:/Users/federico/Desktop/IEBA/iebaSuite/src/components/shared/SyncConflictModal.tsx) que bloquea la interfaz en el Dashboard y en el Editor, permitiendo al usuario decidir explícitamente entre "Usar versión de la nube" (reemplazar local) o "Usar versión local" (forzar sobrescritura en la nube).

### 🟡 Prioridad media

#### 4. `useProjects` hace demasiado
El hook orquesta proyectos, ambientes, historial de undo, sincronización y migración. Es difícil testear en aislamiento.
- **Solución:** Separar `useAmbientes` (operaciones de ambiente) de `useProjects` (operaciones de proyecto)

#### 5. [SOLUCIONADO] Modelo híbrido legacy/nuevo en `Project`
La interfaz `Project` tenía campos del modelo plano (legacy) y del modelo relacional V2 mezclados (con anidación en `meta` y duplicación de `ownerId`).
- **Solución:** Se aplanó la interfaz `Project` eliminando el objeto `meta` y promoviendo `escala`, `grosor_pared_default` y `alturaDefault` directamente a la raíz de la entidad. Se unificaron las referencias a `ownerId` migrándolas a `electricistaId`.
- **Adaptador automático:** Se implementó `migrateProjectToV2` en [useProjectMigration.ts](file:///c:/Users/federico/Desktop/IEBA/iebaSuite/src/hooks/useProjectMigration.ts) que procesa y normaliza los esquemas local y remoto al vuelo en cada carga, con soporte para preservación de identidad.
- **Refactorización**: Se actualizaron más de 20 archivos de UI, visualizadores y renderizadores de dibujo para soportar las nuevas propiedades planas de primer nivel.

#### 6. `localStorage` como fuente de verdad sin expiración
Los datos en `localStorage` nunca se limpian. Si el usuario tiene cientos de proyectos con muchos ambientes y elementos, puede acercarse al límite de ~5-10 MB del browser.
- **Solución:** Limitar qué se guarda en localStorage (solo lista de proyectos sin geometría detallada) y cargar la geometría de Firestore al abrir un proyecto

#### 7. Falta sistema de errores global
Los errores de Firestore se capturan en cada servicio por separado con `console.error`. El usuario no ve feedback cuando algo falla.
- **Solución:** Agregar un `ErrorBoundary` global + toast de error desde el `ClientContext` y `useCloudSync`

#### 8. `domainModels.ts` no se usa en el flujo principal
El modelo de catálogo eléctrico detallado (`Instalacion`, `ElementoCatalogo`, etc.) está definido pero no se usa en el editor ni en las mediciones. Es documentación del futuro modelo.
- **Decisión pendiente:** ¿Se integra este modelo o se elimina para reducir el bundle?

### 🟢 Mejoras menores

#### 9. `createProject()` en storage.ts vs `createProjectRemote()` en projectService.ts
Hay dos factories para crear proyectos con firmas diferentes. Esto confunde sobre cuál usar.
- **Solución:** Dejar solo `createProjectRemote()` y deprecar la de `storage.ts`

#### 10. El `fetchSymbolsFile` deprecated sigue exportado
La función ya no hace fetch (fue simplificada), pero sigue siendo pública. Puede confundir a quien lea el código.
- **Solución:** Marcarla `@internal` o directamente eliminarla en la próxima versión

#### 11. CSS sin design tokens completos
Los colores como `#8b5cf6`, `#f59e0b`, etc. aparecen hardcodeados en varios componentes en lugar de usar las variables CSS.
- **Solución:** Centralizar todos los colores en `style.css` como `--color-estado-relevamiento`, etc.

#### 12. Sin validación de formularios robusta
Los formularios usan `required` HTML y validaciones manuales con `if (!campo.trim())`. No hay esquema de validación (Zod, Yup) ni mensajes de error por campo.
- **Solución:** Integrar `react-hook-form` + `zod` para formularios críticos (cliente, medición)

---

## 11. Guía de Onboarding para Nuevos Desarrolladores

### Requisitos previos
- Node.js 20+
- Cuenta Firebase con proyecto configurado
- Archivo `.env.development` con las variables (ver `.env.example`)

### Primeros pasos
```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build

# Preview de producción local
npm run preview
```

### Variables de entorno necesarias
```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

### ¿Dónde empezar a leer el código?
1. `src/types/project.ts` — entender el modelo de datos
2. `src/hooks/useProjects.ts` — entender el estado principal
3. `src/features/hub/HubProjects.tsx` — entrada de usuario más simple
4. `src/features/relevador/RelevadorTool.tsx` — feature más compleja

### Reglas del proyecto
- Todo estado **se escribe primero localmente**, luego se sincroniza con Firebase
- Los componentes **no llaman a Firebase directamente** — usan los contextos o hooks
- Los servicios Firebase (`src/firebase/`) son **funciones puras** sin estado propio
- Los **contextos** (`src/core/`) son los únicos que exponen mutaciones al resto de la UI
