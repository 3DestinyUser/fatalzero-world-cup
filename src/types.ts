export type DimensionId =
  | 'culture'
  | 'prevent'
  | 'intelligence'
  | 'training'
  | 'knowledge'
  | 'advisor'
  | 'immersive'
  | 'operational'
  | 'regional'

export type MissionState = 'locked' | 'available' | 'active' | 'completed' | 'sustained' | 'not-applicable'
export type RoleId =
  | 'operator-lashing'
  | 'operator-sts'
  | 'operator-yard-equipment'
  | 'operator-tractor'
  | 'operator-gate'
  | 'operator-reefer'
  | 'operator-maintenance'
  | 'operator-hazmat'
  | 'supervisor'
  | 'contractor'
  | 'hsse-local'
  | 'hsse-regional'
  | 'client-internal'
export type PPEId = 'helmet' | 'glasses' | 'gloves' | 'boots' | 'vest' | 'hearing' | 'loto'
export type SimulatorEngine = 'web-safety' | 'unity-webgl' | 'unity-stream'
export type SimulatorEventType =
  | 'session.started'
  | 'hazard.detected'
  | 'control.confirmed'
  | 'decision.safe'
  | 'safe_failure'
  | 'stop_work.activated'
  | 'simulation.completed'

export interface Hazard { id: string; label: string }
export interface Decision { id: string; label: string; safe: boolean; feedback: string }

export interface CollaborationPlan {
  title: string
  description: string
  impact: string
}

export interface RoleProfile {
  id: RoleId
  name: string
  shortName: string
  demoUser: string
  initials: string
  level: 'operator' | 'supervisor' | 'contractor' | 'leader' | 'client'
  decisionFocus: string
  terminal: string
  campaign: string
  mandatoryModules: string[]
  conditionalModules: string[]
  optionalModules: string[]
  visibleDimensions: DimensionId[]
  informationalDimensions: DimensionId[]
}

export interface ContentSource {
  id: string
  title: string
  document: string
  version: string
  locator?: string
  status: 'apm-approved' | 'visual-control' | 'local-validation'
  application: string
}

export interface TrainingModule {
  id: string
  name: string
  level: 'basic' | 'intermediate' | 'advanced' | 'critical'
  keyControls: string[]
  sources: ContentSource[]
  validationStatus: 'source-backed' | 'mixed' | 'local-validation'
}

export interface PPEItem {
  id: PPEId
  name: string
  power: string
  description: string
}

export interface SimulationStep {
  id: string
  prompt: string
  safeAction: string
  unsafeAction: string
  successFeedback: string
  failureFeedback: string
}

export interface SimulationConfig {
  id: string
  title: string
  preferredEngine: SimulatorEngine
  fallbackEngine: 'web-safety'
  unityBuildKey?: string
  scenario: string
  steps: SimulationStep[]
}

export interface SimulatorSessionContext {
  protocolVersion: 1
  sessionId: string
  missionId: string
  missionTitle: string
  roleId: RoleId
  roleName: string
  terminal: string
  requiredPpe: PPEId[]
  criticalControls: string[]
  primaryDimensions: DimensionId[]
  supportingDimensions: DimensionId[]
}

export interface SimulatorEvent {
  protocolVersion: 1
  source: SimulatorEngine
  type: SimulatorEventType
  sessionId: string
  missionId: string
  timestamp: string
  payload?: Record<string, string | number | boolean | string[]>
}

export interface Challenge {
  id: string
  title: string
  subtitle: string
  missionId: string
  type: 'team' | 'peer'
  reward: number
  participants: number
  target: string
  badge: string
}

export interface Mission {
  id: string
  order: number
  title: string
  shortTitle: string
  subtitle: string
  duration: string
  image: string
  fieldScanImage?: string
  mapPosition: { x: number; y: number }
  briefing: string
  objective: string
  hazards: Hazard[]
  requiredHazards: string[]
  decisions: Decision[]
  evidence: string[]
  dimensions: DimensionId[]
  primaryDimensions: DimensionId[]
  supportingDimensions: DimensionId[]
  applicableRoles: RoleId[]
  collaboration: CollaborationPlan
  requiredPpe: PPEId[]
  criticalControls: string[]
  simulation?: SimulationConfig
  sources?: ContentSource[]
  certificate: string
  reward: number
}

export interface GameProgress {
  completed: string[]
  sustained: string[]
  points: number
  reports: number
  collaborations: number
  sharedMissions: string[]
  acceptedChallenges: string[]
  completedChallenges: string[]
  unlockedBadges: string[]
  scans: number
  certificates: number
  simulationsCompleted: number
  safeFailures: number
}

declare global {
  interface Window {
    render_game_to_text?: () => string
    advanceTime?: (milliseconds: number) => void
    FatalZeroSimulatorBridge?: {
      protocolVersion: 1
      getMissionContext: () => SimulatorSessionContext
      receiveEvent: (event: SimulatorEvent | string) => void
    }
  }
}
