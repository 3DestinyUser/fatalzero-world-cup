import type { ContentSource, TrainingModule } from './types'

export const sources = {
  policy: {
    id: 'apmt-hsse-policy-2024',
    title: 'APM Terminals HSSE Policy',
    document: 'apm-terminals-hsse-policy-2024.pdf',
    version: '2024',
    locator: 'p. 2',
    status: 'apm-approved',
    application: 'Responsabilidad personal, liderazgo y competencia para realizar el trabajo de forma segura.',
  },
  traffic: {
    id: 'hsse-req-016',
    title: 'Terminal Traffic Management',
    document: 'HSSE-REQ-016-Terminal-Traffic-Management-V2.5---Approved.pdf',
    version: 'V2.5',
    locator: '2.1-2.6',
    status: 'apm-approved',
    application: 'Segregacion, rutas, plan de trafico e induccion previa al ingreso.',
  },
  height: {
    id: 'hsse-req-017',
    title: 'Working at Height',
    document: 'HSSE-REQ-017-Working-at-Height-V2.7---Approved.pdf',
    version: 'V2.7',
    locator: '3.1-3.10',
    status: 'apm-approved',
    application: 'Evaluacion de riesgo, eliminacion de exposicion, permiso, rescate y competencia.',
  },
  contractors: {
    id: 'hsse-req-022',
    title: 'Contractors',
    document: 'HSSE-REQ-022-Control-of-Contractors-V2.6---Approved.pdf',
    version: 'V2.6',
    locator: '2.1-3.2',
    status: 'apm-approved',
    application: 'Alcance, responsable APMT, riesgos, permisos, competencia y controles acordados antes del trabajo.',
  },
  energy: {
    id: 'hsse-req-024',
    title: 'Stored Energy',
    document: 'HSSE-REQ-024-Stored-Energy-V2.6---Approved.pdf',
    version: 'V2.6',
    locator: '2.1-3.1',
    status: 'apm-approved',
    application: 'Identificacion de energia, aislamiento, LOTO y verificacion de aislamiento.',
  },
  lifting: {
    id: 'hsse-req-029',
    title: 'Suspended Loads and Lifting',
    document: 'HSSE-REQ-029-Suspended-Loads-and-Lifting-V2.4---Approved.pdf',
    version: 'V2.4',
    locator: '2.1-2.12',
    status: 'apm-approved',
    application: 'Zona demarcada, persona a cargo y prohibicion de caminar o conducir bajo carga.',
  },
  lashingVcp: {
    id: 'vcp-015',
    title: 'Working at Height during Lashing and Unlashing',
    document: 'Lashing Working at Height VCP-015-1.0 Final.pdf',
    version: 'VCP-015 1.0',
    status: 'visual-control',
    application: 'Uso de jaula o gondola, persona a cargo y restricciones durante lashing.',
  },
  liftingVcp: {
    id: 'vcp-027',
    title: 'Suspended Loads and Lifting',
    document: 'Suspended Loads and Lifting VCP-027-1.0 Final.pdf',
    version: 'VCP-027 1.0',
    status: 'visual-control',
    application: 'Controles visuales para planificacion, zona y ejecucion de izaje.',
  },
  local: {
    id: 'local-validation',
    title: 'Procedimiento local aplicable',
    document: 'Validacion requerida por APM Terminals Buenos Aires',
    version: 'Pendiente',
    status: 'local-validation',
    application: 'El prototipo no reemplaza el procedimiento, permiso ni validacion HSSE local.',
  },
} satisfies Record<string, ContentSource>

export const trainingModules: TrainingModule[] = [
  { id: 'gangway', name: 'Inspeccion de pasarela', level: 'intermediate', keyControls: ['Acceso inspeccionado', 'Condiciones del entorno', 'Ingreso coordinado'], sources: [sources.height, sources.lashingVcp, sources.local], validationStatus: 'mixed' },
  { id: 'transport', name: 'Transportes', level: 'basic', keyControls: ['Segregacion peaton-vehiculo', 'Rutas autorizadas', 'Plan de trafico'], sources: [sources.traffic], validationStatus: 'source-backed' },
  { id: 'height', name: 'Trabajos en altura', level: 'critical', keyControls: ['Eliminar o minimizar exposicion', 'Permiso', 'Rescate y competencia'], sources: [sources.height], validationStatus: 'source-backed' },
  { id: 'energy', name: 'Energia almacenada', level: 'critical', keyControls: ['Identificar fuentes', 'Aislar y bloquear', 'Verificar energia cero'], sources: [sources.energy], validationStatus: 'source-backed' },
  { id: 'suspended', name: 'Cargas suspendidas', level: 'critical', keyControls: ['Zona de exclusion', 'Persona a cargo', 'Nunca pasar bajo carga'], sources: [sources.lifting, sources.liftingVcp], validationStatus: 'source-backed' },
  { id: 'contractors', name: 'Contratistas', level: 'intermediate', keyControls: ['Alcance y responsable', 'Permiso y competencia', 'Controles verificados'], sources: [sources.contractors, sources.local], validationStatus: 'mixed' },
  { id: 'cage', name: 'Trabajo en jaula', level: 'critical', keyControls: ['Jaula o gondola adecuada', 'Persona a cargo', 'Plan y zona controlada'], sources: [sources.height, sources.lashingVcp], validationStatus: 'mixed' },
  { id: 'lashing', name: 'Trinca y destrinca', level: 'advanced', keyControls: ['Secuencia de trabajo', 'Linea de fuego', 'Comunicacion de cuadrilla'], sources: [sources.lashingVcp, sources.energy, sources.local], validationStatus: 'mixed' },
  { id: 'rtg', name: 'RTG', level: 'advanced', keyControls: ['Equipo y operador competentes', 'Puntos ciegos', 'Segregacion y checklist'], sources: [sources.traffic, sources.local], validationStatus: 'mixed' },
  { id: 'fire', name: 'Combate de incendios', level: 'intermediate', keyControls: ['Alarma y escalamiento', 'Via de escape', 'Respuesta inicial autorizada'], sources: [sources.policy, sources.local], validationStatus: 'local-validation' },
]

export const findTrainingModule = (name: string) => (
  trainingModules.find((module) => module.name.toLocaleLowerCase('es') === name.toLocaleLowerCase('es'))
)
