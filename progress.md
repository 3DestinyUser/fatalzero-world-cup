Original prompt: Crear FATALZERO como un juego educativo integral para PC, mobile y AR, usando el mapa 3D de APM Terminals Buenos Aires. El operario debe escanear su entorno con asistencia de IA, completar misiones encadenadas, desbloquear niveles, desafiar y colaborar con companeros, obtener reconocimientos y comprender como cada accion fortalece las 9 dimensiones HSSE y el World Cup.

## Estado recibido

- SPA React + TypeScript + Vite existente.
- Mapa 3D GLB de APM Terminals Buenos Aires y alternativa 2D.
- Ocho misiones de Trinca y Destrinca con fallo seguro, Stop Work, evidencia, certificado y debrief 9D.
- Ruta por rol del Operario de Trinca y Destrinca.
- Persistencia local y vista World Cup.

## Iteracion actual

- [x] Escaner de campo AR con camara real y fallback demostrativo.
- [x] Confirmacion humana de sugerencias de IA y seleccion de EPP/controles.
- [x] Desafios cooperativos y ranking por contribucion segura.
- [x] Cadena visible de accion, evidencia, certificado, zona y World Cup.
- [x] Estado legible por automatizacion y controles de pantalla completa.
- [x] Validacion desktop/mobile y recorrido completo con Playwright.

## Implementado

- Nueva fase Field Scan entre briefing y confirmacion de riesgos.
- Camara trasera cuando el navegador la permite; fallback visual para desktop o permisos denegados.
- Asistencia IA explicitamente simulada: sugiere tres hallazgos y nunca autoriza la tarea.
- Kit EPP y controles criticos especificos para cada una de las ocho misiones.
- Desafios por persona/equipo, insignias y rankings por contribucion segura.
- Bonificacion cooperativa al completar una mision aceptada como desafio.
- Cadena visible: escanear, intervenir, demostrar, desbloquear, multiplicar y avanzar.
- `window.render_game_to_text`, `window.advanceTime` y pantalla completa del mapa con tecla F.
- `npm run lint` y `npm run build` correctos. Queda una advertencia no bloqueante por el tamano del chunk 3D.

## Validacion final

- Recorrido limpio probado: desafio -> briefing -> Field Scan -> confirmacion -> decision -> evidencia -> certificado -> impacto 9D.
- La decision insegura mantiene deshabilitada la evidencia y muestra un fallo seguro explicativo.
- El desafio completado suma bonificacion, colaboracion e insignia sin duplicar el certificado de una mision repetida.
- El mapa 3D renderiza el modelo GLB y hotspots; pantalla completa disponible con `F` y salida con `Escape`.
- Ranking probado en alcance personas, equipos y terminales; todos sus datos se identifican como ilustrativos.
- Vistas verificadas en `1440x900` y `390x844`, sin desborde horizontal.
- Consola sin errores. Solo permanece la advertencia deprecada de `THREE.Clock` originada por la dependencia 3D.

## Guardrails

- La velocidad no suma en tareas criticas.
- La IA del prototipo solo sugiere; no autoriza ni certifica.
- El certificado digital no reemplaza habilitaciones, permisos ni validacion HSSE local.
- Reportar, detener, ayudar y compartir deben generar progreso positivo.

## Arquitectura hibrida FATALZERO + Unity

- [x] FATALZERO permanece como plataforma central de rol, misiones, 9D, evidencia, certificado y World Cup.
- [x] Se agrego una fase de simulacion solo para misiones complejas aplicables.
- [x] Se agrego un contrato tipado FATALZERO <-> Unity WebGL con version, sesion y mision verificadas.
- [x] Se agrego catalogo de builds Unity con activacion independiente por escenario.
- [x] Se mantiene un simulador web de respaldo cuando la build Unity no esta disponible.
- [x] Manos fuera del peligro, liberacion brusca y cargas suspendidas quedaron preparadas para Unity.
- [x] Se agregaron safe failures sin recompensa por velocidad.
- [x] Se agrego el handoff con archivos `.jslib` y `.cs` para el primer vertical slice.

### Proximo hito Unity

- [x] Exportar `lashing-hands-v1` como WebGL con Unity 6.0.
- [x] Copiar la build a `public/unity/builds/lashing-hands-v1/`.
- [x] Habilitarla en `public/unity/catalog.json`.
- Validar mision -> Unity -> evidencia -> supervisor -> certificado -> impacto 9D.

### Primer simulador Unity real

- [x] Proyecto reproducible en `unity/FatalZeroSimulators`.
- [x] Escena 3D procedural de plataforma de lashing con tensor, barra, contenedores y tres hotspots.
- [x] Tres controles: verificar tension, manos fuera del ojal y cuerpo fuera de trayectoria.
- [x] Fallo seguro explicativo sin recompensa por velocidad.
- [x] Stop Work disponible como accion positiva.
- [x] Evento final con `humanValidationRequired: true`.
- [x] Puente WebGL compilado dentro del framework Unity.
- [x] Canvas adaptado al iframe desktop/mobile.
- [x] Build Unity exitoso y build React de produccion exitoso.

### Segundo simulador Unity real

- [x] Escena `LashingLineOfFire` para la mision `Liberacion brusca`.
- [x] Tres controles propios: energia acumulada, trayectoria delimitada y liberacion lateral coordinada.
- [x] Zona de peligro roja y posicion segura verde visibles en la escena 3D.
- [x] Fallo seguro, reintento y Stop Work reutilizados desde el runtime comun.
- [x] Build `lashing-line-of-fire-v1` exportada y habilitada en el catalogo.
- [x] Mision 4 conectada al mismo flujo FATALZERO de evidencia, validacion, certificado y 9D.
- [x] Validador automatico para todas las builds Unity habilitadas.

### Validacion de la arquitectura hibrida

- [x] `npm run build` correcto.
- [x] `npm run lint` correcto.
- [x] Mapa 3D visible y no vacio en el cliente Playwright del juego.
- [x] Mision `Manos fuera del peligro` probada de extremo a extremo.
- [x] Decision insegura produce `safe_failure` y no permite avanzar.
- [x] Reintento conserva el control actual y permite completar tres decisiones seguras.
- [x] El resultado vuelve a FATALZERO con `humanValidationRequired: true`.
- [x] Evidencia, validacion, certificado y debrief 9D permanecen en la plataforma central.
- [x] Vista desktop `1440x900` y mobile `390x844` revisadas sin desborde horizontal.
- [x] Consola sin errores; solo advertencia conocida de `THREE.Clock` de la dependencia 3D.
