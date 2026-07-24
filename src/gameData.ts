import type { Challenge, DimensionId, Mission, PPEItem, RoleProfile } from './types'

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

export const activeRole: RoleProfile = {
  id: 'operator-lashing',
  name: 'Operario de Trinca y Destrinca',
  terminal: 'APM Terminals Buenos Aires',
  campaign: 'Trinca y Destrinca Segura',
  mandatoryModules: [
    'Inspeccion de pasarela', 'Transportes', 'Cargas suspendidas',
    'Combate de incendios', 'Trinca y destrinca', 'Trabajo en jaula',
  ],
  conditionalModules: ['Trabajos en altura', 'Energia almacenada', 'Contratistas'],
  visibleDimensions: ['culture', 'prevent', 'training', 'immersive', 'operational'],
  informationalDimensions: ['knowledge', 'advisor', 'intelligence', 'regional'],
}

export const ppeCatalog: PPEItem[] = [
  { id: 'helmet', name: 'Casco', power: 'Protege tu mente', description: 'Proteccion superior e inspeccion previa al ingreso.' },
  { id: 'glasses', name: 'Gafas', power: 'Vision segura', description: 'Proteccion frente a particulas y liberaciones.' },
  { id: 'gloves', name: 'Guantes', power: 'Manos seguras', description: 'Proteccion adecuada sin entrar en puntos de atrapamiento.' },
  { id: 'boots', name: 'Calzado', power: 'Deja huellas', description: 'Adherencia y ruta segura sobre superficies portuarias.' },
  { id: 'vest', name: 'Chaleco', power: 'Hazte visible', description: 'Visibilidad frente a equipos y otras cuadrillas.' },
  { id: 'hearing', name: 'Proteccion auditiva', power: 'Escucha el control', description: 'Reduce exposicion sin perder la comunicacion critica.' },
  { id: 'loto', name: 'LOTO', power: 'Asegura y desbloquea', description: 'Aisla energia, verifica cero energia y habilita trabajo seguro.' },
]

export const challenges: Challenge[] = [
  {
    id: 'team-safe-access', title: 'Cuadrilla lista para subir', subtitle: 'Desafio semanal · Trinca B', missionId: 'access',
    type: 'team', reward: 140, participants: 7, target: 'Completar acceso seguro, reportar un hallazgo y compartir el checklist.', badge: 'Equipo que anticipa',
  },
  {
    id: 'peer-hands', title: 'Manos fuera del peligro', subtitle: 'Desafio amistoso · Carlos vs. Lucia', missionId: 'hands',
    type: 'peer', reward: 120, participants: 2, target: 'Demostrar todos los controles sin una decision critica peligrosa.', badge: 'Guardian de manos',
  },
  {
    id: 'team-line-fire', title: 'Cero personas en linea de fuego', subtitle: 'Mision de terminal · Buenos Aires', missionId: 'release',
    type: 'team', reward: 180, participants: 18, target: 'Marcar la trayectoria, activar Stop Work y dejar evidencia reutilizable.', badge: 'Control de energia',
  },
]

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
  value: Omit<Mission, 'hazards' | 'requiredHazards' | 'decisions' | 'evidence' | 'dimensions' | 'primaryDimensions' | 'supportingDimensions' | 'collaboration'> & {
    risks: [string, string, string, string]
    safe: string
    unsafe: [string, string]
    evidence: [string, string, string]
    primaryDimensions: DimensionId[]
    supportingDimensions: DimensionId[]
    collaboration: Mission['collaboration']
  },
): Mission => ({
  ...value,
  dimensions: [...new Set([...value.primaryDimensions, ...value.supportingDimensions])],
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
    requiredPpe: ['helmet', 'boots', 'vest'], criticalControls: ['Pasarela inspeccionada', 'Condiciones climaticas verificadas', 'Ingreso coordinado con la cuadrilla'],
    primaryDimensions: ['culture', 'prevent', 'training', 'operational'], supportingDimensions: ['knowledge', 'advisor', 'regional'],
    applicableRoles: ['operator-lashing', 'supervisor', 'hsse-local'], collaboration: { title: 'Comparte el checklist de acceso', description: 'Tu confirmacion de pasarela puede ayudar a la siguiente cuadrilla antes de subir al buque.', impact: 'El aprendizaje queda disponible para otros turnos.' }, certificate: 'Safe Vessel Access', reward: 180,
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
    requiredPpe: ['helmet', 'gloves', 'boots'], criticalControls: ['Evaluacion de fatiga', 'Tecnica de levantamiento controlada', 'Apoyo de la cuadrilla cuando corresponde'],
    primaryDimensions: ['culture', 'prevent', 'training', 'immersive'], supportingDimensions: ['knowledge', 'advisor', 'operational'],
    applicableRoles: ['operator-lashing', 'supervisor'], collaboration: { title: 'Comparte una tecnica de postura', description: 'Ayuda a otra persona a levantar la barra usando piernas, control y apoyo de la cuadrilla.', impact: 'Una buena tecnica se convierte en habito colectivo.' }, certificate: 'Lashing Ergonomics', reward: 200,
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
    requiredPpe: ['helmet', 'glasses', 'gloves', 'boots'], criticalControls: ['Dedos fuera del ojal y pasador', 'Tension controlada antes de intervenir', 'Posicion corporal fuera de la trayectoria'],
    simulation: {
      id: 'hands-in-control', title: 'Secuencia segura del tensor', preferredEngine: 'unity-webgl', fallbackEngine: 'web-safety',
      unityBuildKey: 'lashing-hands-v1', scenario: 'Tensor de rosca bajo tension · plataforma de lashing',
      steps: [
        { id: 'inspect', prompt: 'Antes de tocar el tensor, ¿como preparas la intervencion?', safeAction: 'Verificar tension, pasador y estabilidad', unsafeAction: 'Comenzar mientras otro operario sostiene la barra', successFeedback: 'La condicion fue verificada antes de exponer las manos.', failureFeedback: 'La coordinacion informal no controla la energia ni el movimiento repentino.' },
        { id: 'hands', prompt: '¿Donde posicionas las manos durante el giro?', safeAction: 'Sobre el cuerpo exterior del tensor', unsafeAction: 'Dentro del ojal para guiar el pasador', successFeedback: 'Los dedos permanecen fuera del punto de atrapamiento.', failureFeedback: 'Un movimiento repentino puede aplastar o cizallar los dedos.' },
        { id: 'body', prompt: '¿Como completas la maniobra?', safeAction: 'Cuerpo fuera de trayectoria y comunicacion cerrada', unsafeAction: 'Frente al tensor para observar de cerca', successFeedback: 'La postura final mantiene cuerpo y manos fuera de la linea de fuego.', failureFeedback: 'La observacion cercana coloca rostro y torso dentro de la trayectoria.' },
      ],
    },
    primaryDimensions: ['culture', 'prevent', 'training', 'immersive'], supportingDimensions: ['knowledge', 'advisor', 'operational'],
    applicableRoles: ['operator-lashing', 'supervisor', 'hsse-local'], collaboration: { title: 'Comparte el punto de atrapamiento', description: 'Registra donde deben mantenerse las manos fuera del tensor para que el equipo aprenda antes de intervenir.', impact: 'El hallazgo alimenta Knowledge y previene la repeticion.' }, certificate: 'Hands in Control', reward: 240,
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
    requiredPpe: ['helmet', 'glasses', 'gloves', 'boots'], criticalControls: ['Energia acumulada evaluada', 'Linea de fuego delimitada', 'Liberacion coordinada y controlada'],
    simulation: {
      id: 'line-of-fire-control', title: 'Liberacion controlada de energia', preferredEngine: 'unity-webgl', fallbackEngine: 'web-safety',
      unityBuildKey: 'lashing-line-of-fire-v1', scenario: 'Barra superior tensionada · liberacion con deformacion del buque',
      steps: [
        { id: 'energy', prompt: '¿Que confirmas antes de liberar la barra?', safeAction: 'Evaluar tension y energia acumulada', unsafeAction: 'Confiar en que la barra esta estable', successFeedback: 'La energia potencial fue reconocida antes de liberar.', failureFeedback: 'La apariencia no demuestra que el sistema este libre de energia.' },
        { id: 'trajectory', prompt: '¿Como controlas la posible liberacion?', safeAction: 'Marcar trayectoria y retirar personas', unsafeAction: 'Advertir verbalmente sin delimitar', successFeedback: 'La linea de fuego queda visible y sin personas expuestas.', failureFeedback: 'Una advertencia aislada no impide el ingreso a la trayectoria.' },
        { id: 'release', prompt: '¿Como ejecutas la liberacion?', safeAction: 'Posicion lateral, secuencia acordada y Stop Work disponible', unsafeAction: 'Frente al mecanismo para ganar precision', successFeedback: 'La liberacion se ejecuta fuera de trayectoria y bajo una secuencia compartida.', failureFeedback: 'La precision no compensa una posicion dentro de la linea de fuego.' },
      ],
    },
    primaryDimensions: ['culture', 'prevent', 'training', 'immersive'], supportingDimensions: ['intelligence', 'advisor', 'knowledge', 'operational', 'regional'],
    applicableRoles: ['operator-lashing', 'supervisor', 'hsse-local'], collaboration: { title: 'Comparte la trayectoria segura', description: 'Marca la linea de fuego y deja una referencia para que otra cuadrilla pueda posicionarse mejor.', impact: 'Una decision local puede convertirse en una barrera regional.' }, certificate: 'Line of Fire Control', reward: 260,
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
    requiredPpe: ['helmet', 'glasses', 'gloves'], criticalControls: ['EPP inspeccionado y ajustado', 'Zona de proyeccion identificada', 'Ingreso posterior a la verificacion'],
    primaryDimensions: ['culture', 'prevent', 'training', 'operational'], supportingDimensions: ['knowledge', 'advisor'],
    applicableRoles: ['operator-lashing', 'supervisor'], collaboration: { title: 'Comparte una verificacion de EPP', description: 'Ayuda a tu equipo a revisar gafas, casco y barbijo antes de entrar en la zona.', impact: 'La proteccion correcta se vuelve una practica visible.' }, certificate: 'Eye & Face Protection', reward: 160,
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
    requiredPpe: ['helmet', 'vest', 'boots'], criticalControls: ['Zona de exclusion activa', 'Ruta alternativa definida', 'Comunicacion con operacion confirmada'],
    simulation: {
      id: 'suspended-load-awareness', title: 'Cruce seguro durante operacion STS', preferredEngine: 'unity-webgl', fallbackEngine: 'web-safety',
      unityBuildKey: 'suspended-load-v1', scenario: 'Spreader activo · radio de balanceo y punto ciego',
      steps: [
        { id: 'zone', prompt: '¿Que haces al detectar una carga suspendida?', safeAction: 'Detenerse fuera de la zona de exclusion', unsafeAction: 'Calcular el tiempo y cruzar rapido', successFeedback: 'La persona permanece fuera del radio de exposicion.', failureFeedback: 'La velocidad nunca controla el movimiento de una carga suspendida.' },
        { id: 'route', prompt: '¿Como continuas hacia el puesto?', safeAction: 'Seleccionar una ruta segregada alternativa', unsafeAction: 'Pasar por debajo cuando la carga se detiene', successFeedback: 'La ruta evita la carga y sus movimientos posibles.', failureFeedback: 'Una carga detenida continua suspendida y puede moverse inesperadamente.' },
        { id: 'communication', prompt: '¿Que confirmacion cierra el control?', safeAction: 'Comunicacion con operacion y zona liberada', unsafeAction: 'Confiar en contacto visual con el operador', successFeedback: 'La coordinacion operacional confirma que el paso es seguro.', failureFeedback: 'El contacto visual no elimina puntos ciegos ni reemplaza la comunicacion.' },
      ],
    },
    primaryDimensions: ['culture', 'prevent', 'training', 'operational'], supportingDimensions: ['intelligence', 'advisor', 'regional', 'knowledge'],
    applicableRoles: ['operator-lashing', 'supervisor', 'hsse-local'], collaboration: { title: 'Comparte una ruta fuera de la carga', description: 'Comparte la ruta alternativa y la comunicacion confirmada con tu equipo.', impact: 'La segregacion se refuerza con conocimiento compartido.' }, certificate: 'Suspended Load Awareness', reward: 280,
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
    requiredPpe: ['helmet', 'vest', 'hearing'], criticalControls: ['Comunicacion cerrada', 'Roles y secuencia confirmados', 'Stop Work disponible para toda la cuadrilla'],
    primaryDimensions: ['culture', 'prevent', 'training', 'operational'], supportingDimensions: ['knowledge', 'advisor', 'regional'],
    applicableRoles: ['operator-lashing', 'supervisor', 'hsse-local'], collaboration: { title: 'Comparte el briefing de cuadrilla', description: 'Deja una secuencia de senales y roles para que el siguiente turno comience alineado.', impact: 'Colaborar se convierte en control operativo.' }, certificate: 'Crew Safety Collaboration', reward: 240,
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
    requiredPpe: ['helmet', 'glasses', 'boots', 'vest'], criticalControls: ['Condiciones reevaluadas', 'Iluminacion y adherencia suficientes', 'Reinicio autorizado despues de recuperar controles'],
    primaryDimensions: ['culture', 'prevent', 'training', 'operational'], supportingDimensions: ['intelligence', 'advisor', 'knowledge', 'regional'],
    applicableRoles: ['operator-lashing', 'supervisor', 'hsse-local'], collaboration: { title: 'Comparte el cambio detectado', description: 'Registra la condicion cambiante y ayuda a otros a reevaluar antes de continuar.', impact: 'La adaptacion local alimenta la capacidad de anticipacion.' }, certificate: 'Dynamic Risk Control', reward: 300,
  }),
]

export const initialProgress = {
  completed: [], sustained: [], points: 2450, reports: 3, collaborations: 8, sharedMissions: [],
  acceptedChallenges: [], completedChallenges: [], unlockedBadges: [], scans: 0, certificates: 0,
  simulationsCompleted: 0, safeFailures: 0,
}
