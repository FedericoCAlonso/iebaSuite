# Vinculación de Mediciones a Símbolos Eléctricos y Fechas

El usuario solicitó que los símbolos eléctricos en el relevador (ej. jabalina) puedan mostrar y registrar su historial de mediciones (ej. anuales de puesta a tierra). Además solicitó que todas las mediciones registren fecha y hora precisas, y sugirió categorizar los símbolos eléctricos.

## Proposed Changes

### 1. Categorización de Símbolos (`src/features/symbols/`)
Actualmente los símbolos se identifican por expresiones regulares en su nombre/tipo. Se propone formalizar esto agregando una propiedad opcional `medicionAsociada?: ModuleType` a los símbolos en la librería.
- Por ejemplo, el símbolo `jabalina` tendrá `medicionAsociada: 'puesta_tierra'`.
- El símbolo `diferencial` tendrá `medicionAsociada: 'diferencial'`.

### 2. Historial de Mediciones en el Relevador (`src/features/relevador/`)
- En `ElectricalCard.tsx` (la tarjeta de propiedades de cada boca/elemento), leeremos el `globalMeasurements`.
- Si el elemento tiene un `medicionAsociada` (o si simplemente buscamos si tiene mediciones vinculadas por `elementoId`), mostraremos una nueva sección **"Historial de Mediciones"** debajo de las características técnicas libres (los "datos").
- Esta sección listará las mediciones existentes con su fecha, hora y resultado principal.
- Incluirá un botón "Nueva Medición" que, al hacer clic, redirija o abra un pequeño modal conectando con el módulo de mediciones, pre-cargando la entidad.

### 3. Fecha y Hora en Mediciones (`src/features/measurements/`)
- En `MeasurementBase` (y en `CommonFields.tsx`), el campo `fecha` cambiará a ser manipulable en la UI.
- Se agregará un campo `<input type="datetime-local">` para que el usuario pueda establecer la fecha y hora exacta en la que se realizó la medición física (diferente a la de carga en el sistema).
- Se mostrará el historial cronológicamente en las tarjetas de símbolos.

## Open Questions
> [!IMPORTANT]
> **Navegación vs Modal:** Cuando estés en el Relevador editando la jabalina y aprietes "Nueva medición", ¿preferís que el sistema te lleve a la pantalla completa del módulo de "Mediciones", o preferís que se abra el formulario ahí mismo arriba del plano como una ventana emergente (modal) para no perder el contexto visual?

## Verification Plan
### Pruebas manuales
- Cargar un símbolo de jabalina en el plano.
- Agregar características libres (datos).
- Agregarle una nueva medición desde sus propiedades.
- Verificar que la medición exija fecha y hora (datetime-local).
- Validar que al cambiar la fecha, el historial se ordene correctamente y mantenga su valor anualmente.
