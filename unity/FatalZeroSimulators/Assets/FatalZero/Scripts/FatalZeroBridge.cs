using System;
using System.Runtime.InteropServices;
using UnityEngine;

namespace FatalZero
{
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

        private void Awake()
        {
            gameObject.name = "FatalZeroBridge";
        }

        private void Start()
        {
#if UNITY_WEBGL && !UNITY_EDITOR
            FatalZeroBridgeInitialize();
#else
            Context = CreateEditorContext();
            NotifySimulator();
#endif
        }

        public void ReceiveMissionContext(string json)
        {
            var context = JsonUtility.FromJson<MissionContext>(json);
            if (context == null || context.protocolVersion != 1)
            {
                Debug.LogWarning("FATALZERO rejected an invalid mission context.");
                return;
            }

            Context = context;
            NotifySimulator();
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

        private void NotifySimulator()
        {
            if (LashingHandsSimulator.Instance != null)
            {
                LashingHandsSimulator.Instance.ApplyMissionContext(Context);
            }
        }

        private void Emit(string eventType, EventPayload payload)
        {
            if (Context == null)
            {
                Debug.LogWarning("FATALZERO event ignored until mission context is available.");
                return;
            }

            var simulatorEvent = new SimulatorEvent
            {
                type = eventType,
                sessionId = Context.sessionId,
                missionId = Context.missionId,
                timestamp = DateTime.UtcNow.ToString("o"),
                payload = payload
            };

            var json = JsonUtility.ToJson(simulatorEvent);
#if UNITY_WEBGL && !UNITY_EDITOR
            FatalZeroBridgeEmit(json);
#else
            Debug.Log(json);
#endif
        }

        private static MissionContext CreateEditorContext()
        {
            return new MissionContext
            {
                protocolVersion = 1,
                sessionId = "unity-editor-preview",
                missionId = "hands",
                missionTitle = "Manos fuera del peligro",
                roleId = "lashing-operator",
                roleName = "Operario de Trinca y Destrinca",
                terminal = "Buenos Aires",
                requiredPpe = new[] { "Casco", "Guantes", "Gafas" },
                criticalControls = new[]
                {
                    "Verificar tension antes de intervenir",
                    "Mantener manos fuera del ojal y pasador",
                    "Mantener el cuerpo fuera de la trayectoria"
                },
                primaryDimensions = new[] { "culture", "prevent", "training", "immersive" },
                supportingDimensions = new[] { "knowledge", "advisor", "intelligence", "operational", "regional" }
            };
        }
    }
}
