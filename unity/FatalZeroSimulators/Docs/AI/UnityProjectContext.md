# FATALZERO Unity Simulator Context

## Purpose

This Unity 6 project contains specialized 3D mission engines embedded by the
FATALZERO React platform. Unity owns spatial practice and immediate feedback.
FATALZERO owns role assignment, mission state, evidence, human validation,
certificates, 9D contribution, and World Cup progression.

## First vertical slice

- Build key: `lashing-hands-v1`
- Mission: `Manos fuera del peligro`
- Role: Lashing operator
- Scene: `Assets/FatalZero/Scenes/LashingHands.unity`
- Output: `public/unity/builds/lashing-hands-v1`

The simulator confirms three critical controls:

1. Verify stored tension before intervention.
2. Keep hands outside the eyelet and pin.
3. Keep the body outside the release trajectory.

Unsafe decisions produce a safe failure and explain the missing control. Stop
Work is always available and is reported as a positive action. Speed never
produces points.

## Bridge contract

`FatalZeroBridge.jslib` announces `runtime.ready`, receives typed mission
context from the parent, and forwards Unity events back to the platform.
Protocol details live in `docs/UNITY_SIMULATOR_HANDOFF.md`.

## Build

Run Unity in batch mode with:

```powershell
& 'C:\Program Files\Unity\Hub\Editor\6000.5.4f1\Editor\Unity.exe' `
  -batchmode -nographics -quit `
  -projectPath '<repo>\unity\FatalZeroSimulators' `
  -executeMethod FatalZero.Editor.SimulatorBuild.BuildWebGL `
  -logFile '<repo>\unity-build.log'
```

After a successful build, enable `lashing-hands-v1` in
`public/unity/catalog.json`.

## Reuse

Future scenes should reuse `FatalZeroBridge` and preserve the same event
contract. Domain rules remain outside rendering code. Each new simulator must
support safe failure, Stop Work, keyboard/touch-safe UI, human validation, and
an explicit no-speed-reward rule.
