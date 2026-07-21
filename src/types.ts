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

export type MissionState = 'locked' | 'available' | 'active' | 'completed' | 'sustained'

export interface Hazard { id: string; label: string }
export interface Decision { id: string; label: string; safe: boolean; feedback: string }

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
  certificate: string
  reward: number
}

export interface GameProgress {
  completed: string[]
  sustained: string[]
  points: number
  reports: number
  collaborations: number
  certificates: number
}
