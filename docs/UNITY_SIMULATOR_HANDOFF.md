# FATALZERO + Unity Simulator Handoff

## Decision

FATALZERO remains the central platform. Unity is an optional specialized engine for
missions that need complex spatial interaction, physics, equipment behavior or a
high-fidelity 3D scene.

```text
FATALZERO
  role + eligibility + mission + 9D + progress
            |
            v
Unity WebGL specialized simulation
            |
            v
FATALZERO
  decision + evidence + human validation + certificate + World Cup
```

## Ownership Boundary

### FATALZERO owns

- Identity, role and terminal.
- Mission eligibility and role visibility.
- Required PPE and critical controls.
- Mission state and red -> amber -> green progression.
- Evidence and human validation.
- Certificates, points, collaboration and World Cup progression.
- 9D contribution and regional learning.
- Persistence and analytics.

### Unity owns

- The 3D scene and its interactions.
- Physics and equipment behavior.
- Spatial decisions, hazards and controlled consequences.
- Safe failures inside the simulation.
- A bounded session result returned as protocol events.

Unity must never issue a real or prototype certificate, authorize work, change the
player role, or award World Cup points.

## Current Integration

- Host component: `src/SimulatorExperience.tsx`
- Typed protocol: `src/simulatorBridge.ts`
- Domain types: `src/types.ts`
- Unity build catalog: `public/unity/catalog.json`
- Unity build destination: `public/unity/builds/<build-key>/`
- Web fallback: always available when a Unity build is missing, disabled or fails
  to load.

The first specialized scenarios are:

1. Hands in Control: `lashing-hands-v1`
2. Line of Fire: `lashing-line-of-fire-v1`
3. Suspended Load: `suspended-load-v1`

## Launch Context

Unity first announces that its runtime listener is ready:

```json
{
  "source": "fatalzero-unity",
  "type": "runtime.ready"
}
```

FATALZERO then sends this message to the Unity iframe:

```json
{
  "source": "fatalzero-platform",
  "type": "mission.context",
  "context": {
    "protocolVersion": 1,
    "sessionId": "hands-...",
    "missionId": "hands",
    "missionTitle": "Manos fuera del peligro",
    "roleId": "operator-lashing",
    "roleName": "Operario de Trinca y Destrinca",
    "terminal": "Buenos Aires",
    "requiredPpe": ["helmet", "glasses", "gloves", "boots", "vest"],
    "criticalControls": ["..."],
    "primaryDimensions": ["culture", "prevent", "training", "immersive"],
    "supportingDimensions": ["knowledge", "advisor", "intelligence", "operational", "regional"]
  }
}
```

## Events Returned By Unity

Unity posts a message to its parent:

```json
{
  "source": "fatalzero-unity",
  "event": {
    "protocolVersion": 1,
    "source": "unity-webgl",
    "type": "control.confirmed",
    "sessionId": "hands-...",
    "missionId": "hands",
    "timestamp": "2026-07-23T12:00:00.000Z",
    "payload": {
      "stepId": "hands-position",
      "control": "Mantener dedos fuera del ojal y el pasador"
    }
  }
}
```

Allowed event types:

- `session.started`
- `hazard.detected`
- `control.confirmed`
- `decision.safe`
- `safe_failure`
- `stop_work.activated`
- `simulation.completed`

FATALZERO rejects events with a different protocol version, mission or session.

## Install A Unity WebGL Build

1. Export the scene as WebGL.
2. Place the complete export at:
   `public/unity/builds/<build-key>/index.html`
3. Ensure the Unity page assigns the created instance to
   `window.unityInstance`.
4. Add `FatalZeroBridge.jslib` and `FatalZeroBridge.cs` to the Unity project.
5. Match the build key in `public/unity/catalog.json`.
6. Set `"enabled": true`.
7. Test the complete route:
   mission -> Unity -> decision -> evidence -> certificate -> 9D.

Do not delete the web fallback. It is the continuity layer for unsupported
devices, blocked WebGL, incomplete downloads and early prototype scenes.

## Safety Acceptance Criteria

- Speed never awards points in a critical task.
- Unsafe actions produce a safe failure and explanatory feedback.
- Stop Work is a positive action.
- PPE never replaces engineering controls, barriers or procedures.
- A simulation result is not evidence by itself.
- Human validation remains outside Unity.
- A digital certificate does not replace a work permit or operational
  authorization.
- Each Unity build receives only the mission and role data it needs.

## First Vertical Slice

Use `lashing-hands-v1` as the first production Unity scene.

Current status: built and enabled. The reproducible Unity project lives in
`unity/FatalZeroSimulators`, and the generated WebGL player lives in
`public/unity/builds/lashing-hands-v1`.

The project currently targets Unity `6000.5.4f1` installed through Unity Hub in
its default Windows location. The uGUI dependency uses the built-in package
directly because Unity Package Manager cannot atomically copy that package while
the project is inside a OneDrive-synchronized folder. If Unity is installed in a
different location, update the `com.unity.ugui` file path in
`unity/FatalZeroSimulators/Packages/manifest.json`.

Minimum content:

- One lashing platform.
- One turnbuckle and lashing bar.
- Three decision moments.
- A visible pinch point.
- One safe failure.
- Stop Work.
- Completion event with confirmed controls.

Avoid multiplayer, complete-terminal loading and advanced scoring in this first
slice. The goal is to validate the bridge and the learning loop.

## Multi-Simulator Template

The Unity project now produces scenario-specific WebGL builds from a shared
lashing runtime:

| Build key | Mission | Scenario variant |
| --- | --- | --- |
| `lashing-hands-v1` | Manos fuera del peligro | Hands in Control |
| `lashing-line-of-fire-v1` | Liberacion brusca | Line of Fire |

Both variants reuse camera control, HUD, safe failure, Stop Work and bridge
events. Each one owns its decision sequence, 3D overlays, feedback and product
identity.

Build a single scenario from the command line:

```powershell
& "C:\Program Files\Unity\Hub\Editor\6000.5.4f1\Editor\Unity.exe" `
  -batchmode -nographics -quit `
  -projectPath ".\unity\FatalZeroSimulators" `
  -executeMethod FatalZero.Editor.SimulatorBuild.BuildLineOfFireWebGL
```

Build every registered scenario:

```powershell
& "C:\Program Files\Unity\Hub\Editor\6000.5.4f1\Editor\Unity.exe" `
  -batchmode -nographics -quit `
  -projectPath ".\unity\FatalZeroSimulators" `
  -executeMethod FatalZero.Editor.SimulatorBuild.BuildAllWebGL
```

Before publishing, run:

```powershell
npm run validate:unity
```

This validator fails when an enabled catalog entry is missing its player,
mission-context handoff, loader, data file or WebAssembly payload.
