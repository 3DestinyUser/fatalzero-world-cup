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
