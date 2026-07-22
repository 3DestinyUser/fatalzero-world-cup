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
export type RoleId = 'operator-lashing' | 'supervisor' | 'hsse-local' | 'hsse-regional'
export type PPEId = 'helmet' | 'glasses' | 'gloves' | 'boots' | 'vest' | 'hearing' | 'loto'

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
  terminal: string
  campaign: string
  mandatoryModules: string[]
  conditionalModules: string[]
  visibleDimensions: DimensionId[]
  informationalDimensions: DimensionId[]
}

export interface PPEItem {
  id: PPEId
  name: string
  power: string
  description: string
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
}

declare global {
  interface Window {
    render_game_to_text?: () => string
    advanceTime?: (milliseconds: number) => void
  }
}
