# VI3W+ · FATALZERO World Cup

## Tesis visual

VI3W+ funciona como el relator 3D de una competencia segura: una esfera blanca, azul y roja que flota sobre el comando portuario oscuro y utiliza el verde FATALZERO únicamente para progreso verificado.

## Plan de contenido

1. Contexto actual: mapa, misión y fase, desafío, dimensión o World Cup.
2. Tu día: señales, reportes, escaneos, certificados y aprendizajes compartidos.
3. Desafíos: invitaciones reales del juego con estado disponible, activo o logrado.
4. Logros: hitos persistentes derivados del progreso del jugador.

## Tesis de interacción

- El atlas cambia de animación al revisar una sección, detectar un fallo seguro o desbloquear un logro.
- El comunicador se expande desde la mascota sin interrumpir el juego.
- Cada transición del juego produce un resumen breve y actualiza la línea de tiempo del día.

## Integración

El componente expone `window.VI3W`:

```js
window.VI3W.notify({
  title: "Nueva señal",
  message: "La cuadrilla reportó una condición cambiante.",
  section: "Operational Control",
  priority: "high"
})

window.VI3W.setContext({
  id: "live-terminal",
  section: "Terminal Buenos Aires",
  title: "Operación en tiempo real",
  summary: "Una misión activa y un riesgo preventivo pendiente.",
  challenge: "Confirmar el control antes del próximo movimiento."
})

window.VI3W.celebrate({
  id: "team-control",
  title: "Control colectivo",
  message: "La cuadrilla verificó y compartió la barrera."
})
```

También acepta `window.dispatchEvent(new CustomEvent("vi3w:event", { detail }))`.
