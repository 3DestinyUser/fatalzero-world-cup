import type { DimensionId, Mission } from './types'

const asset = (name: string) => `${import.meta.env.BASE_URL}assets/${name}`

export const dimensions: Record<DimensionId, { number: number; name: string; value: string }> = {
  culture: { number: 1, name: 'Culture', value: 'Conductas y habitos seguros' },
  prevent: { number: 2, name: 'Prevent', value: 'Anticipacion y controles tempranos' },
  intelligence: { number: 3, name: 'Intelligence', value: 'Patrones y decisiones basadas en datos' },
  training: { number: 4, name: 'Training', value: 'Competencia demostrada' },
  knowledge: { number: 5, name: 'Knowledge', value: 'Lecciones que permanecen' },
  advisor: { number: 6, name: 'Advisor', value: 'Recomendaciones contextuales' },
  immersive: { number: 7, name: 'Immersive Learning', value: 'Practica que genera memoria' },
  operational: { number: 8, name: 'Operational Control', value: 'Evidencia y validacion' },
  regional: { number: 9, name: 'Regional Analytics', value: 'Aprendizaje que escala' },
}

export const gameRules = [
  'La velocidad nunca entrega puntos en tareas criticas.',
  'Reportar un riesgo suma. Ocultarlo nunca beneficia.',
  'Una decision peligrosa detiene la tarea y explica el control faltante.',
  'El EPP complementa, pero no reemplaza barreras ni procedimientos.',
  'Stop Work Authority es una accion positiva.',
  'Una trivia sola no certifica competencia.',
  'La evidencia requiere validacion humana.',
  'Cada rol recibe solamente misiones aplicables.',
  'Ayudar, ensenar y compartir tambien genera progreso.',
  'La victoria final es colectiva: ninguna terminal gana sola.',
]

const mission = (
  value: Omit<Mission, 'hazards' | 'requiredHazards' | 'decisions' | 'evidence'> & {
    risks: [string, string, string, string]
    safe: string
    unsafe: [string, string]
    evidence: [string, string, string]
  },
): Mission => ({
  ...value,
  hazards: value.risks.map((label, index) => ({ id: `risk-${index}`, label })),
  requiredHazards: ['risk-0', 'risk-1', 'risk-2'],
  decisions: [
    { id: 'safe', label: value.safe, safe: true, feedback: 'Decision segura. Eliminaste la exposicion antes de continuar.' },
    { id: 'unsafe-1', label: value.unsafe[0], safe: false, feedback: 'Fallo seguro: esa accion no controla el peligro. La tarea queda detenida.' },
    { id: 'unsafe-2', label: value.unsafe[1], safe: false, feedback: 'Fallo seguro: el EPP o la experiencia no reemplazan el control critico.' },
  ],
  evidence: value.evidence,
})

export const missions: Mission[] = [
  mission({
    id: 'access', order: 1, title: 'Acceso seguro al buque', shortTitle: 'Acceso seguro',
    subtitle: 'Pasarela, ingreso y condiciones del entorno', duration: '12 min', image: asset('lashing-5.png'),
    mapPosition: { x: 80, y: 71 },
    briefing: 'Antes de llegar a la plataforma de lashing, cada integrante debe confirmar que el acceso, el clima y la comunicacion permiten comenzar sin exposicion innecesaria.',
    objective: 'Reconocer las condiciones que habilitan o detienen el ingreso al buque.',
    risks: ['Pasarela sin inspeccion vigente', 'Movimiento del buque y superficie mojada', 'Comunicacion de ingreso no confirmada', 'Color de los contenedores'],
    safe: 'Detener el ingreso, informar y verificar controles',
    unsafe: ['Ingresar despacio para no retrasar la operacion', 'Seguir al companero que ya ingreso'],
    evidence: ['Checklist de pasarela', 'Confirmacion de clima', 'Autorizacion de ingreso'],
    dimensions: ['culture', 'prevent', 'training', 'operational'], certificate: 'Safe Vessel Access', reward: 180,
  }),
  mission({
    id: 'steel', order: 2, title: 'El peso del acero', shortTitle: 'Peso del acero',
    subtitle: 'Postura, fatiga y manipulacion de barras', duration: '15 min', image: asset('lashing-4.png'),
    mapPosition: { x: 61, y: 59 },
    briefing: 'Una barra de trinca puede medir 2,5 metros y pesar cerca de 14 kg. La fatiga acumulada cambia la postura y aumenta la probabilidad de lesion.',
    objective: 'Elegir una tecnica de levantamiento controlada y reconocer cuando pedir ayuda.',
    risks: ['Espalda flexionada y carga alejada', 'Fatiga muscular acumulada', 'Ruta de traslado obstruida', 'Color del calzado'],
    safe: 'Alinear el cuerpo, usar piernas y pedir apoyo si hace falta',
    unsafe: ['Levantar rapido para reducir el tiempo bajo carga', 'Flexionar la espalda para acercarse a la barra'],
    evidence: ['Autoevaluacion de fatiga', 'Demostracion de postura', 'Ruta despejada'],
    dimensions: ['culture', 'prevent', 'training', 'immersive'], certificate: 'Lashing Ergonomics', reward: 200,
  }),
  mission({
    id: 'hands', order: 3, title: 'Manos fuera del peligro', shortTitle: 'Manos seguras',
    subtitle: 'Tensores, pasadores y atrapamientos', duration: '18 min', image: asset('lashing-3.png'),
    mapPosition: { x: 43, y: 46 },
    briefing: 'Un movimiento repentino del tensor puede aplastar o cizallar los dedos. La posicion de las manos es un control critico.',
    objective: 'Mantener dedos fuera del ojal, pasador y trayectoria de componentes tensionados.',
    risks: ['Punto de atrapamiento en el ojal', 'Movimiento repentino por tension', 'Agarre dentro de la trayectoria', 'Oxido superficial sin dano visible'],
    safe: 'Manos sobre el cuerpo exterior y dedos fuera del ojal',
    unsafe: ['Usar un dedo para alinear el pasador', 'Confiar en que el guante evita el atrapamiento'],
    evidence: ['Puntos de pellizco identificados', 'Tecnica demostrada', 'Validacion de supervisor'],
    dimensions: ['prevent', 'training', 'knowledge', 'immersive', 'operational'], certificate: 'Hands in Control', reward: 240,
  }),
  mission({
    id: 'release', order: 4, title: 'Liberacion brusca', shortTitle: 'Linea de fuego',
    subtitle: 'Energia acumulada y trayectoria', duration: '18 min', image: asset('lashing-2.png'),
    mapPosition: { x: 31, y: 61 },
    briefing: 'La deformacion del buque puede acumular tension. Al liberar una barra superior, el elemento puede salir despedido y alcanzar rostro o cuerpo.',
    objective: 'Reconocer la trayectoria potencial y posicionarse fuera de la linea de fuego.',
    risks: ['Trayectoria potencial de la barra', 'Tension acumulada no evaluada', 'Cuerpo frente al punto de liberacion', 'Ruido normal del puerto'],
    safe: 'Detener, verificar tension y reposicionarse fuera de trayectoria',
    unsafe: ['Acercar el rostro para observar el mecanismo', 'Continuar porque casco y gafas brindan proteccion'],
    evidence: ['Trayectoria marcada', 'Posicion segura seleccionada', 'Briefing de liberacion'],
    dimensions: ['culture', 'prevent', 'intelligence', 'advisor', 'immersive'], certificate: 'Line of Fire Control', reward: 260,
  }),
  mission({
    id: 'eyes', order: 5, title: 'Proteccion ocular', shortTitle: 'Proteccion ocular',
    subtitle: 'Gafas, casco y ajuste correcto', duration: '12 min', image: asset('lashing-2.png'),
    mapPosition: { x: 51, y: 31 },
    briefing: 'Particulas, corrosion y liberaciones bruscas pueden impactar ojos y rostro. El ajuste correcto permite que la proteccion cumpla su funcion.',
    objective: 'Verificar proteccion ocular y casco antes de entrar en la zona de tarea.',
    risks: ['Particulas y proyecciones', 'Gafas o barbijo mal ajustados', 'Casco sin ajuste estable', 'Chaleco limpio'],
    safe: 'Ajustar y verificar todo el EPP antes de ingresar',
    unsafe: ['Ingresar y ajustar las gafas si aparece polvo', 'Apartar la mirada durante la liberacion'],
    evidence: ['Inspeccion visual de EPP', 'Ajuste confirmado', 'Registro previo al ingreso'],
    dimensions: ['culture', 'prevent', 'training', 'operational'], certificate: 'Eye & Face Protection', reward: 160,
  }),
  mission({
    id: 'suspended', order: 6, title: 'Cargas suspendidas', shortTitle: 'Carga suspendida',
    subtitle: 'STS, spreaders y zonas de exclusion', duration: '20 min', image: asset('lashing-1.png'),
    mapPosition: { x: 70, y: 34 },
    briefing: 'La operacion de trinca convive con gruas STS y spreaders. Una zona de exclusion evita que una persona quede debajo o junto a una carga.',
    objective: 'Interpretar el movimiento de la carga y respetar zonas de exclusion.',
    risks: ['Persona debajo de carga suspendida', 'Radio de balanceo no considerado', 'Punto ciego del operador', 'Nombre del buque'],
    safe: 'Permanecer fuera, confirmar exclusion y comunicacion',
    unsafe: ['Cruzar rapido antes de que llegue el spreader', 'Confiar en que el operador avisara si existe peligro'],
    evidence: ['Zona de exclusion identificada', 'Ruta alternativa', 'Comunicacion confirmada'],
    dimensions: ['prevent', 'intelligence', 'training', 'operational', 'regional'], certificate: 'Suspended Load Awareness', reward: 280,
  }),
  mission({
    id: 'crew', order: 7, title: 'Coordinacion de cuadrilla', shortTitle: 'Coordinacion',
    subtitle: 'Senales, comunicacion y Stop Work', duration: '16 min', image: asset('lashing-5.png'),
    mapPosition: { x: 22, y: 42 },
    briefing: 'La tarea depende de una secuencia compartida. Si una persona no comprende una senal, detener y alinear al equipo protege a todos.',
    objective: 'Usar comunicacion cerrada y Stop Work frente a una condicion no controlada.',
    risks: ['Senal ambigua o no confirmada', 'Secuencia distinta entre companeros', 'Presion por continuar', 'Uniformes de diferente marca'],
    safe: 'Activar Stop Work, reunir al equipo y reconfirmar',
    unsafe: ['Interpretar la senal y continuar con cuidado', 'Continuar porque el lider parece seguro'],
    evidence: ['Stop Work registrado', 'Briefing de cuadrilla', 'Confirmacion de roles'],
    dimensions: ['culture', 'knowledge', 'advisor', 'operational', 'regional'], certificate: 'Crew Safety Collaboration', reward: 240,
  }),
  mission({
    id: 'conditions', order: 8, title: 'Condiciones cambiantes', shortTitle: 'Condiciones',
    subtitle: 'Lluvia, noche, oleaje y secuencia', duration: '20 min', image: asset('lashing-5.png'),
    mapPosition: { x: 86, y: 47 },
    briefing: 'Una tarea que comenzo segura puede dejar de serlo. El clima, la visibilidad y el movimiento del buque deben reevaluarse durante la operacion.',
    objective: 'Detectar cambios, reevaluar controles y decidir si la tarea puede continuar.',
    risks: ['Superficie mojada y perdida de adherencia', 'Iluminacion insuficiente', 'Movimiento fuera de tolerancia', 'Hora prevista de salida'],
    safe: 'Pausar, reevaluar y restablecer controles',
    unsafe: ['Terminar la ultima fila antes de detener', 'Reducir el ritmo sin informar al supervisor'],
    evidence: ['Cambio reportado', 'Evaluacion actualizada', 'Autorizacion de reinicio'],
    dimensions: ['culture', 'prevent', 'intelligence', 'advisor', 'operational', 'regional'], certificate: 'Dynamic Risk Control', reward: 300,
  }),
]

export const initialProgress = {
  completed: [], sustained: [], points: 2450, reports: 3, collaborations: 8, certificates: 0,
}
