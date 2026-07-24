using System;
using System.Runtime.InteropServices;
using UnityEngine;

public sealed class FatalZeroBridge : MonoBehaviour
{
    [Serializable]
    public sealed class MissionContext
    {
        public int protocolVersion;
        public string sessionId;
        public string missionId;
        public string missionTitle;
        public string roleId;
        public string roleName;
        public string terminal;
        public string[] requiredPpe;
        public string[] criticalControls;
        public string[] primaryDimensions;
        public string[] supportingDimensions;
    }

    [Serializable]
    public sealed class EventPayload
    {
        public string stepId;
        public string control;
        public string attemptedAction;
        public int controlsConfirmed;
        public bool speedReward;
        public bool humanValidationRequired;
    }

    [Serializable]
    public sealed class SimulatorEvent
    {
        public int protocolVersion = 1;
        public string source = "unity-webgl";
        public string type;
        public string sessionId;
        public string missionId;
        public string timestamp;
        public EventPayload payload;
    }

    public MissionContext Context { get; private set; }

#if UNITY_WEBGL && !UNITY_EDITOR
    [DllImport("__Internal")]
    private static extern void FatalZeroBridgeInitialize();

    [DllImport("__Internal")]
    private static extern void FatalZeroBridgeEmit(string eventJson);
#endif

    private void Start()
    {
#if UNITY_WEBGL && !UNITY_EDITOR
        FatalZeroBridgeInitialize();
#endif
    }

    public void ReceiveMissionContext(string json)
    {
        Context = JsonUtility.FromJson<MissionContext>(json);
    }

    public void EmitControlConfirmed(string stepId, string control)
    {
        Emit("control.confirmed", new EventPayload
        {
            stepId = stepId,
            control = control,
            speedReward = false
        });
    }

    public void EmitSafeFailure(string stepId, string attemptedAction)
    {
        Emit("safe_failure", new EventPayload
        {
            stepId = stepId,
            attemptedAction = attemptedAction,
            speedReward = false
        });
    }

    public void EmitStopWork(string stepId)
    {
        Emit("stop_work.activated", new EventPayload
        {
            stepId = stepId,
            speedReward = false
        });
    }

    public void CompleteSimulation(int controlsConfirmed)
    {
        Emit("simulation.completed", new EventPayload
        {
            controlsConfirmed = controlsConfirmed,
            speedReward = false,
            humanValidationRequired = true
        });
    }

    private void Emit(string eventType, EventPayload payload)
    {
        if (Context == null) return;

        var simulatorEvent = new SimulatorEvent
        {
            type = eventType,
            sessionId = Context.sessionId,
            missionId = Context.missionId,
            timestamp = DateTime.UtcNow.ToString("o"),
            payload = payload
        };

#if UNITY_WEBGL && !UNITY_EDITOR
        FatalZeroBridgeEmit(JsonUtility.ToJson(simulatorEvent));
#else
        Debug.Log(JsonUtility.ToJson(simulatorEvent));
#endif
    }
}
