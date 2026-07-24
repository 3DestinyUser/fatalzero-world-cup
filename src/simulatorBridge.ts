import type {
  Mission,
  RoleProfile,
  SimulatorEngine,
  SimulatorEvent,
  SimulatorEventType,
  SimulatorSessionContext,
} from './types'

export const SIMULATOR_PROTOCOL_VERSION = 1 as const
export const UNITY_MESSAGE_SOURCE = 'fatalzero-unity'

export function createSimulatorContext(
  mission: Mission,
  role: RoleProfile,
  sessionId: string,
): SimulatorSessionContext {
  return {
    protocolVersion: SIMULATOR_PROTOCOL_VERSION,
    sessionId,
    missionId: mission.id,
    missionTitle: mission.title,
    roleId: role.id,
    roleName: role.name,
    terminal: role.terminal,
    requiredPpe: mission.requiredPpe,
    criticalControls: mission.criticalControls,
    primaryDimensions: mission.primaryDimensions,
    supportingDimensions: mission.supportingDimensions,
  }
}

export function createSimulatorEvent(
  context: SimulatorSessionContext,
  source: SimulatorEngine,
  type: SimulatorEventType,
  payload?: SimulatorEvent['payload'],
): SimulatorEvent {
  return {
    protocolVersion: SIMULATOR_PROTOCOL_VERSION,
    source,
    type,
    sessionId: context.sessionId,
    missionId: context.missionId,
    timestamp: new Date().toISOString(),
    payload,
  }
}

export function parseSimulatorEvent(
  value: SimulatorEvent | string,
  context: SimulatorSessionContext,
): SimulatorEvent | null {
  try {
    const event = typeof value === 'string' ? JSON.parse(value) as SimulatorEvent : value
    if (
      event.protocolVersion !== SIMULATOR_PROTOCOL_VERSION
      || event.sessionId !== context.sessionId
      || event.missionId !== context.missionId
      || typeof event.type !== 'string'
    ) return null
    return event
  } catch {
    return null
  }
}

