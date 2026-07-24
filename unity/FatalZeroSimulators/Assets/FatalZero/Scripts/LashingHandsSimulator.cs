using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace FatalZero
{
    public sealed class LashingHandsSimulator : MonoBehaviour
    {
        [Serializable]
        private sealed class DecisionStep
        {
            public string id;
            public string title;
            public string prompt;
            public string safeAction;
            public string unsafeAction;
            public string success;
            public string failure;
            public Vector3 hotspotPosition;
        }

        public static LashingHandsSimulator Instance { get; private set; }

        private readonly List<DecisionStep> steps = new List<DecisionStep>
        {
            new DecisionStep
            {
                id = "tension-check",
                title = "01 · VERIFICA LA TENSION",
                prompt = "El tensor esta bajo carga. ¿Que haces antes de tocarlo?",
                safeAction = "Detengo, observo y verifico estabilidad y tension",
                unsafeAction = "Empiezo a girar para terminar mas rapido",
                success = "Control confirmado: la energia se evalua antes de intervenir.",
                failure = "Fallo seguro: intervenir sin verificar puede liberar energia de forma brusca.",
                hotspotPosition = new Vector3(-1.9f, 1.3f, 0.35f)
            },
            new DecisionStep
            {
                id = "hands-position",
                title = "02 · MANOS FUERA DEL PELIGRO",
                prompt = "Debes girar el tensor. ¿Donde posicionas las manos?",
                safeAction = "Sobre el cuerpo exterior, lejos del ojal y el pasador",
                unsafeAction = "Dentro del ojal para guiar el pasador",
                success = "Control confirmado: dedos fuera del punto de atrapamiento.",
                failure = "Fallo seguro: un movimiento repentino puede aplastar o cizallar los dedos.",
                hotspotPosition = new Vector3(0.05f, 1.15f, 0.2f)
            },
            new DecisionStep
            {
                id = "body-position",
                title = "03 · FUERA DE LA TRAYECTORIA",
                prompt = "La barra conserva tension. ¿Como completas la liberacion?",
                safeAction = "Me ubico al costado, coordino y retiro con control",
                unsafeAction = "Me coloco frente a la barra y tiro hacia mi cuerpo",
                success = "Control confirmado: cuerpo fuera de la linea de fuego.",
                failure = "Fallo seguro: la barra puede salir despedida hacia el cuerpo.",
                hotspotPosition = new Vector3(2.0f, 1.4f, 0.5f)
            }
        };

        private readonly List<GameObject> hotspotObjects = new List<GameObject>();
        private FatalZeroBridge bridge;
        private Camera sceneCamera;
        private Font font;
        private Text missionTitle;
        private Text roleLine;
        private Text progressText;
        private Text instructionText;
        private Text decisionTitle;
        private Text decisionPrompt;
        private Text feedbackTitle;
        private Text feedbackBody;
        private GameObject decisionPanel;
        private GameObject feedbackPanel;
        private GameObject completionPanel;
        private Button safeButton;
        private Button unsafeButton;
        private Button evidenceButton;
        private int currentStep;
        private bool awaitingDecision;
        private bool feedbackAdvancesStep;
        private bool simulationSent;

        private static readonly Color Navy = new Color32(2, 18, 31, 255);
        private static readonly Color Panel = new Color32(5, 31, 48, 242);
        private static readonly Color Orange = new Color32(255, 95, 14, 255);
        private static readonly Color Green = new Color32(90, 202, 95, 255);
        private static readonly Color Red = new Color32(231, 52, 52, 255);
        private static readonly Color SoftText = new Color32(180, 202, 218, 255);

        private void Awake()
        {
            Instance = this;
        }

        private void Start()
        {
            bridge = FindFirstObjectByType<FatalZeroBridge>();
            font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            BuildScene();
            BuildInterface();
            SelectStep(0);

            if (bridge != null && bridge.Context != null)
            {
                ApplyMissionContext(bridge.Context);
            }
        }

        private void Update()
        {
            if (awaitingDecision || currentStep >= steps.Count || Input.GetMouseButton(0) == false)
            {
                AnimateHotspots();
                return;
            }

            if (EventSystem.current != null && EventSystem.current.IsPointerOverGameObject())
            {
                return;
            }

            var ray = sceneCamera.ScreenPointToRay(Input.mousePosition);
            if (Physics.Raycast(ray, out var hit, 100f))
            {
                var hotspot = hit.collider.GetComponent<SimulatorHotspot>();
                if (hotspot != null && hotspot.StepIndex == currentStep)
                {
                    OpenDecision();
                }
            }

            AnimateHotspots();
        }

        public void ApplyMissionContext(FatalZeroBridge.MissionContext context)
        {
            if (context == null || missionTitle == null)
            {
                return;
            }

            missionTitle.text = string.IsNullOrWhiteSpace(context.missionTitle)
                ? "MANOS FUERA DEL PELIGRO"
                : context.missionTitle.ToUpperInvariant();
            roleLine.text = $"{context.roleName}  ·  {context.terminal}";
        }

        private void BuildScene()
        {
            RenderSettings.fog = true;
            RenderSettings.fogColor = new Color32(4, 18, 27, 255);
            RenderSettings.fogMode = FogMode.Exponential;
            RenderSettings.fogDensity = 0.018f;
            RenderSettings.ambientLight = new Color32(70, 91, 105, 255);

            var cameraObject = new GameObject("Main Camera");
            sceneCamera = cameraObject.AddComponent<Camera>();
            cameraObject.tag = "MainCamera";
            sceneCamera.clearFlags = CameraClearFlags.SolidColor;
            sceneCamera.backgroundColor = Navy;
            sceneCamera.fieldOfView = 47f;
            cameraObject.transform.position = new Vector3(0f, 5.2f, -10.5f);
            cameraObject.transform.LookAt(new Vector3(0f, 1.25f, 0.6f));
            var orbit = cameraObject.AddComponent<SimulatorOrbitCamera>();
            orbit.Configure(new Vector3(0f, 1.15f, 0.5f), 10.8f);

            var keyLightObject = new GameObject("Key Light");
            var keyLight = keyLightObject.AddComponent<Light>();
            keyLight.type = LightType.Directional;
            keyLight.color = new Color32(214, 231, 255, 255);
            keyLight.intensity = 1.25f;
            keyLightObject.transform.rotation = Quaternion.Euler(42f, -32f, 0f);

            var orangeLightObject = new GameObject("Port Light");
            var orangeLight = orangeLightObject.AddComponent<Light>();
            orangeLight.type = LightType.Point;
            orangeLight.color = Orange;
            orangeLight.intensity = 6f;
            orangeLight.range = 16f;
            orangeLightObject.transform.position = new Vector3(4f, 4f, -1f);

            var deckMaterial = CreateMaterial("Wet deck", new Color32(31, 42, 48, 255), 0.72f, 0.35f);
            var steelMaterial = CreateMaterial("Steel", new Color32(82, 91, 96, 255), 0.86f, 0.78f);
            var darkSteel = CreateMaterial("Dark steel", new Color32(24, 29, 33, 255), 0.78f, 0.65f);
            var containerBlue = CreateMaterial("Container blue", new Color32(17, 62, 82, 255), 0.45f, 0.1f);
            var containerRed = CreateMaterial("Container red", new Color32(108, 45, 34, 255), 0.38f, 0.08f);
            var safetyYellow = CreateMaterial("Safety yellow", new Color32(245, 177, 35, 255), 0.35f, 0.12f);

            CreateCube("Lashing deck", new Vector3(0f, -0.3f, 1f), new Vector3(16f, 0.55f, 9f), deckMaterial);
            CreateCube("Container left", new Vector3(-5.4f, 1.6f, 2.7f), new Vector3(4.2f, 3.6f, 2.7f), containerBlue);
            CreateCube("Container right", new Vector3(5.4f, 1.6f, 2.7f), new Vector3(4.2f, 3.6f, 2.7f), containerRed);
            CreateCube("Container rear", new Vector3(0f, 2.25f, 5f), new Vector3(6.2f, 4.8f, 1.2f), containerBlue);

            for (var i = -7; i <= 7; i++)
            {
                CreateCube($"Deck seam {i}", new Vector3(i, -0.005f, 0.7f), new Vector3(0.035f, 0.02f, 8f), darkSteel);
            }

            CreateCube("Safety line left", new Vector3(-3.2f, 0.01f, -1.4f), new Vector3(4.1f, 0.025f, 0.16f), safetyYellow);
            CreateCube("Safety line right", new Vector3(3.2f, 0.01f, -1.4f), new Vector3(4.1f, 0.025f, 0.16f), safetyYellow);

            BuildTurnbuckle(steelMaterial, darkSteel);
            BuildRailings(steelMaterial);
            BuildHotspots();
        }

        private void BuildTurnbuckle(Material steelMaterial, Material darkSteel)
        {
            CreateCylinder("Turnbuckle body", new Vector3(0f, 0.72f, 0.45f), new Vector3(0.38f, 1.3f, 0.38f), Quaternion.Euler(0f, 0f, 90f), darkSteel);
            CreateCylinder("Thread left", new Vector3(-1.05f, 0.72f, 0.45f), new Vector3(0.16f, 0.9f, 0.16f), Quaternion.Euler(0f, 0f, 90f), steelMaterial);
            CreateCylinder("Thread right", new Vector3(1.05f, 0.72f, 0.45f), new Vector3(0.16f, 0.9f, 0.16f), Quaternion.Euler(0f, 0f, 90f), steelMaterial);
            CreateTorusApproximation("Eyelet left", new Vector3(-1.75f, 0.72f, 0.45f), steelMaterial);
            CreateTorusApproximation("Eyelet right", new Vector3(1.75f, 0.72f, 0.45f), steelMaterial);

            var bar = CreateCylinder("Lashing bar", new Vector3(0.25f, 1.45f, 0.65f), new Vector3(0.11f, 3.3f, 0.11f), Quaternion.Euler(0f, 0f, -65f), steelMaterial);
            bar.transform.position = new Vector3(0.25f, 1.45f, 0.65f);

            CreateCube("Anchor plate left", new Vector3(-2.2f, 0.08f, 0.45f), new Vector3(0.9f, 0.16f, 0.9f), darkSteel);
            CreateCube("Anchor plate right", new Vector3(2.2f, 0.08f, 0.45f), new Vector3(0.9f, 0.16f, 0.9f), darkSteel);
        }

        private void BuildRailings(Material material)
        {
            for (var x = -7f; x <= 7f; x += 2f)
            {
                CreateCylinder($"Railing post {x}", new Vector3(x, 1f, -3.1f), new Vector3(0.06f, 1f, 0.06f), Quaternion.identity, material);
            }

            CreateCylinder("Railing top", new Vector3(0f, 1.8f, -3.1f), new Vector3(0.07f, 7.2f, 0.07f), Quaternion.Euler(0f, 0f, 90f), material);
            CreateCylinder("Railing middle", new Vector3(0f, 1f, -3.1f), new Vector3(0.055f, 7.2f, 0.055f), Quaternion.Euler(0f, 0f, 90f), material);
        }

        private void BuildHotspots()
        {
            var material = CreateEmissionMaterial("Hotspot", Orange);
            for (var i = 0; i < steps.Count; i++)
            {
                var sphere = GameObject.CreatePrimitive(PrimitiveType.Sphere);
                sphere.name = $"Hotspot {i + 1}";
                sphere.transform.position = steps[i].hotspotPosition;
                sphere.transform.localScale = Vector3.one * 0.42f;
                sphere.GetComponent<Renderer>().material = material;
                var hotspot = sphere.AddComponent<SimulatorHotspot>();
                hotspot.StepIndex = i;
                hotspotObjects.Add(sphere);

                var ring = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
                ring.name = $"Hotspot ring {i + 1}";
                ring.transform.SetParent(sphere.transform, false);
                ring.transform.localPosition = Vector3.zero;
                ring.transform.localRotation = Quaternion.Euler(90f, 0f, 0f);
                ring.transform.localScale = new Vector3(1.8f, 0.05f, 1.8f);
                ring.GetComponent<Renderer>().material = material;
                Destroy(ring.GetComponent<Collider>());
            }
        }

        private void BuildInterface()
        {
            if (FindFirstObjectByType<EventSystem>() == null)
            {
                var eventSystem = new GameObject("EventSystem");
                eventSystem.AddComponent<EventSystem>();
                eventSystem.AddComponent<StandaloneInputModule>();
            }

            var canvasObject = new GameObject("HUD");
            var canvas = canvasObject.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvasObject.AddComponent<GraphicRaycaster>();
            var scaler = canvasObject.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1440f, 810f);
            scaler.matchWidthOrHeight = 0.5f;

            var topBar = CreatePanel(canvasObject.transform, "Top Bar", Navy, new Vector2(0f, 0.91f), Vector2.one);
            AddText(topBar.transform, "Brand", "FATALZERO  ·  UNITY MISSION ENGINE", 22, FontStyle.Bold, TextAnchor.MiddleLeft,
                new Vector2(0.025f, 0f), new Vector2(0.56f, 1f), Color.white);
            progressText = AddText(topBar.transform, "Progress", "CONTROL 01 / 03", 18, FontStyle.Bold, TextAnchor.MiddleRight,
                new Vector2(0.65f, 0f), new Vector2(0.975f, 1f), Orange);

            var titlePanel = CreatePanel(canvasObject.transform, "Mission Header", Panel, new Vector2(0.025f, 0.69f), new Vector2(0.46f, 0.89f));
            AddText(titlePanel.transform, "Kicker", "SIMULADOR 3D · TRINCA Y DESTRINCA", 15, FontStyle.Bold, TextAnchor.UpperLeft,
                new Vector2(0.04f, 0.67f), new Vector2(0.96f, 0.94f), Orange);
            missionTitle = AddText(titlePanel.transform, "Mission", "MANOS FUERA DEL PELIGRO", 30, FontStyle.Bold, TextAnchor.MiddleLeft,
                new Vector2(0.04f, 0.27f), new Vector2(0.96f, 0.72f), Color.white);
            roleLine = AddText(titlePanel.transform, "Role", "Operario de Trinca y Destrinca  ·  Buenos Aires", 15, FontStyle.Normal, TextAnchor.LowerLeft,
                new Vector2(0.04f, 0.07f), new Vector2(0.96f, 0.31f), SoftText);

            var instructionPanel = CreatePanel(canvasObject.transform, "Instruction", Panel, new Vector2(0.025f, 0.07f), new Vector2(0.43f, 0.24f));
            instructionText = AddText(instructionPanel.transform, "Instruction Text", string.Empty, 19, FontStyle.Bold, TextAnchor.MiddleLeft,
                new Vector2(0.05f, 0.08f), new Vector2(0.95f, 0.92f), Color.white);

            var stopButton = CreateButton(canvasObject.transform, "Stop Work", "DETENER TRABAJO", Red,
                new Vector2(0.77f, 0.04f), new Vector2(0.975f, 0.115f));
            stopButton.onClick.AddListener(ActivateStopWork);

            decisionPanel = CreatePanel(canvasObject.transform, "Decision Panel", Panel, new Vector2(0.54f, 0.23f), new Vector2(0.975f, 0.78f));
            decisionTitle = AddText(decisionPanel.transform, "Decision Title", string.Empty, 18, FontStyle.Bold, TextAnchor.UpperLeft,
                new Vector2(0.06f, 0.77f), new Vector2(0.94f, 0.94f), Orange);
            decisionPrompt = AddText(decisionPanel.transform, "Decision Prompt", string.Empty, 27, FontStyle.Bold, TextAnchor.UpperLeft,
                new Vector2(0.06f, 0.45f), new Vector2(0.94f, 0.79f), Color.white);
            safeButton = CreateButton(decisionPanel.transform, "Safe Choice", string.Empty, Green,
                new Vector2(0.06f, 0.22f), new Vector2(0.94f, 0.41f));
            safeButton.onClick.AddListener(ConfirmSafeDecision);
            unsafeButton = CreateButton(decisionPanel.transform, "Unsafe Choice", string.Empty, new Color32(91, 48, 48, 255),
                new Vector2(0.06f, 0.04f), new Vector2(0.94f, 0.19f));
            unsafeButton.onClick.AddListener(ConfirmUnsafeDecision);
            decisionPanel.SetActive(false);

            feedbackPanel = CreatePanel(canvasObject.transform, "Feedback Panel", Panel, new Vector2(0.55f, 0.27f), new Vector2(0.975f, 0.72f));
            feedbackTitle = AddText(feedbackPanel.transform, "Feedback Title", string.Empty, 25, FontStyle.Bold, TextAnchor.UpperLeft,
                new Vector2(0.07f, 0.66f), new Vector2(0.93f, 0.9f), Color.white);
            feedbackBody = AddText(feedbackPanel.transform, "Feedback Body", string.Empty, 20, FontStyle.Normal, TextAnchor.UpperLeft,
                new Vector2(0.07f, 0.27f), new Vector2(0.93f, 0.68f), SoftText);
            var continueButton = CreateButton(feedbackPanel.transform, "Continue", "CONTINUAR", Orange,
                new Vector2(0.56f, 0.06f), new Vector2(0.93f, 0.22f));
            continueButton.onClick.AddListener(CloseFeedback);
            feedbackPanel.SetActive(false);

            completionPanel = CreatePanel(canvasObject.transform, "Completion Panel", Panel, new Vector2(0.18f, 0.19f), new Vector2(0.82f, 0.8f));
            AddText(completionPanel.transform, "Complete Kicker", "SECUENCIA CONTROLADA", 17, FontStyle.Bold, TextAnchor.MiddleCenter,
                new Vector2(0.1f, 0.78f), new Vector2(0.9f, 0.92f), Green);
            AddText(completionPanel.transform, "Complete Title", "3 CONTROLES CRITICOS CONFIRMADOS", 34, FontStyle.Bold, TextAnchor.MiddleCenter,
                new Vector2(0.08f, 0.55f), new Vector2(0.92f, 0.78f), Color.white);
            AddText(completionPanel.transform, "Complete Body",
                "La velocidad no genero puntos. Tu evidencia requiere validacion humana antes de certificar la competencia.",
                20, FontStyle.Normal, TextAnchor.MiddleCenter,
                new Vector2(0.12f, 0.28f), new Vector2(0.88f, 0.56f), SoftText);
            evidenceButton = CreateButton(completionPanel.transform, "Evidence", "ENVIAR EVIDENCIA A FATALZERO", Orange,
                new Vector2(0.22f, 0.08f), new Vector2(0.78f, 0.22f));
            evidenceButton.onClick.AddListener(SendEvidence);
            completionPanel.SetActive(false);
        }

        private void SelectStep(int index)
        {
            currentStep = index;
            awaitingDecision = false;
            decisionPanel.SetActive(false);
            feedbackPanel.SetActive(false);

            for (var i = 0; i < hotspotObjects.Count; i++)
            {
                hotspotObjects[i].SetActive(i >= index);
                var renderer = hotspotObjects[i].GetComponent<Renderer>();
                renderer.material.color = i == index ? Orange : new Color32(77, 102, 121, 255);
            }

            if (index >= steps.Count)
            {
                progressText.text = "CONTROL 03 / 03";
                instructionText.text = "Secuencia segura completada. Registra evidencia para validacion.";
                completionPanel.SetActive(true);
                return;
            }

            progressText.text = $"CONTROL {index + 1:00} / {steps.Count:00}";
            instructionText.text = $"Selecciona el punto {index + 1} en la escena 3D.\nArrastra para inspeccionar el tensor.";
        }

        private void OpenDecision()
        {
            awaitingDecision = true;
            var step = steps[currentStep];
            decisionTitle.text = step.title;
            decisionPrompt.text = step.prompt;
            SetButtonLabel(safeButton, step.safeAction);
            SetButtonLabel(unsafeButton, step.unsafeAction);
            decisionPanel.SetActive(true);
        }

        private void ConfirmSafeDecision()
        {
            var step = steps[currentStep];
            bridge?.EmitControlConfirmed(step.id, step.safeAction);
            feedbackAdvancesStep = true;
            feedbackTitle.text = "CONTROL CONFIRMADO";
            feedbackTitle.color = Green;
            feedbackBody.text = step.success;
            decisionPanel.SetActive(false);
            feedbackPanel.SetActive(true);
        }

        private void ConfirmUnsafeDecision()
        {
            var step = steps[currentStep];
            bridge?.EmitSafeFailure(step.id, step.unsafeAction);
            feedbackAdvancesStep = false;
            feedbackTitle.text = "FALLO SEGURO · TAREA DETENIDA";
            feedbackTitle.color = Red;
            feedbackBody.text = $"{step.failure}\n\nEl error queda como aprendizaje; no genera ventaja ni penaliza el reporte.";
            decisionPanel.SetActive(false);
            feedbackPanel.SetActive(true);
        }

        private void CloseFeedback()
        {
            var advancesStep = feedbackAdvancesStep;
            feedbackPanel.SetActive(false);
            if (advancesStep)
            {
                SelectStep(currentStep + 1);
            }
            else
            {
                awaitingDecision = false;
                instructionText.text = $"Revisa el control {currentStep + 1} y vuelve a seleccionar el punto activo.";
            }
        }

        private void ActivateStopWork()
        {
            var stepId = currentStep < steps.Count ? steps[currentStep].id : "mission-complete";
            bridge?.EmitStopWork(stepId);
            feedbackAdvancesStep = false;
            feedbackTitle.text = "STOP WORK · ACCION POSITIVA";
            feedbackTitle.color = Green;
            feedbackBody.text = "Detener una tarea ante duda o control faltante protege al equipo. Reportar suma aprendizaje al ecosistema.";
            decisionPanel.SetActive(false);
            feedbackPanel.SetActive(true);
            awaitingDecision = false;
        }

        private void SendEvidence()
        {
            if (simulationSent)
            {
                return;
            }

            simulationSent = true;
            bridge?.CompleteSimulation(steps.Count);
            SetButtonLabel(evidenceButton, "EVIDENCIA ENVIADA · VALIDACION PENDIENTE");
            evidenceButton.interactable = false;
            instructionText.text = "FATALZERO recibio la evidencia. Continua en la plataforma para certificar.";
        }

        private void AnimateHotspots()
        {
            for (var i = 0; i < hotspotObjects.Count; i++)
            {
                if (hotspotObjects[i].activeSelf == false)
                {
                    continue;
                }

                var active = i == currentStep;
                var scale = active ? 0.42f + Mathf.Sin(Time.time * 4f) * 0.055f : 0.32f;
                hotspotObjects[i].transform.localScale = Vector3.one * scale;
                hotspotObjects[i].transform.Rotate(0f, 40f * Time.deltaTime, 0f, Space.World);
            }
        }

        private Material CreateMaterial(string materialName, Color color, float smoothness, float metallic)
        {
            var shader = Shader.Find("Standard");
            var material = new Material(shader) { name = materialName, color = color };
            material.SetFloat("_Glossiness", smoothness);
            material.SetFloat("_Metallic", metallic);
            return material;
        }

        private Material CreateEmissionMaterial(string materialName, Color color)
        {
            var material = CreateMaterial(materialName, color, 0.7f, 0.1f);
            material.EnableKeyword("_EMISSION");
            material.SetColor("_EmissionColor", color * 1.8f);
            return material;
        }

        private GameObject CreateCube(string objectName, Vector3 position, Vector3 scale, Material material)
        {
            var cube = GameObject.CreatePrimitive(PrimitiveType.Cube);
            cube.name = objectName;
            cube.transform.position = position;
            cube.transform.localScale = scale;
            cube.GetComponent<Renderer>().material = material;
            return cube;
        }

        private GameObject CreateCylinder(string objectName, Vector3 position, Vector3 scale, Quaternion rotation, Material material)
        {
            var cylinder = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            cylinder.name = objectName;
            cylinder.transform.position = position;
            cylinder.transform.localScale = scale;
            cylinder.transform.rotation = rotation;
            cylinder.GetComponent<Renderer>().material = material;
            return cylinder;
        }

        private void CreateTorusApproximation(string objectName, Vector3 position, Material material)
        {
            var parent = new GameObject(objectName);
            parent.transform.position = position;
            const int segments = 12;
            for (var i = 0; i < segments; i++)
            {
                var angle = i * Mathf.PI * 2f / segments;
                var segment = CreateCylinder(
                    $"{objectName} segment {i}",
                    position + new Vector3(Mathf.Cos(angle) * 0.32f, Mathf.Sin(angle) * 0.32f, 0f),
                    new Vector3(0.07f, 0.12f, 0.07f),
                    Quaternion.Euler(0f, 0f, -angle * Mathf.Rad2Deg),
                    material);
                segment.transform.SetParent(parent.transform, true);
            }
        }

        private GameObject CreatePanel(Transform parent, string objectName, Color color, Vector2 anchorMin, Vector2 anchorMax)
        {
            var panel = new GameObject(objectName);
            panel.transform.SetParent(parent, false);
            var image = panel.AddComponent<Image>();
            image.color = color;
            var rect = panel.GetComponent<RectTransform>();
            rect.anchorMin = anchorMin;
            rect.anchorMax = anchorMax;
            rect.offsetMin = Vector2.zero;
            rect.offsetMax = Vector2.zero;
            return panel;
        }

        private Text AddText(Transform parent, string objectName, string value, int size, FontStyle style,
            TextAnchor alignment, Vector2 anchorMin, Vector2 anchorMax, Color color)
        {
            var textObject = new GameObject(objectName);
            textObject.transform.SetParent(parent, false);
            var text = textObject.AddComponent<Text>();
            text.font = font;
            text.text = value;
            text.fontSize = size;
            text.fontStyle = style;
            text.alignment = alignment;
            text.color = color;
            text.horizontalOverflow = HorizontalWrapMode.Wrap;
            text.verticalOverflow = VerticalWrapMode.Overflow;
            var rect = textObject.GetComponent<RectTransform>();
            rect.anchorMin = anchorMin;
            rect.anchorMax = anchorMax;
            rect.offsetMin = Vector2.zero;
            rect.offsetMax = Vector2.zero;
            return text;
        }

        private Button CreateButton(Transform parent, string objectName, string label, Color color,
            Vector2 anchorMin, Vector2 anchorMax)
        {
            var buttonObject = new GameObject(objectName);
            buttonObject.transform.SetParent(parent, false);
            var image = buttonObject.AddComponent<Image>();
            image.color = color;
            var button = buttonObject.AddComponent<Button>();
            button.targetGraphic = image;
            var colors = button.colors;
            colors.highlightedColor = Color.Lerp(color, Color.white, 0.16f);
            colors.pressedColor = Color.Lerp(color, Color.black, 0.22f);
            button.colors = colors;
            var rect = buttonObject.GetComponent<RectTransform>();
            rect.anchorMin = anchorMin;
            rect.anchorMax = anchorMax;
            rect.offsetMin = Vector2.zero;
            rect.offsetMax = Vector2.zero;
            AddText(buttonObject.transform, "Label", label, 17, FontStyle.Bold, TextAnchor.MiddleCenter,
                new Vector2(0.04f, 0.08f), new Vector2(0.96f, 0.92f), Color.white);
            return button;
        }

        private static void SetButtonLabel(Button button, string value)
        {
            var label = button.GetComponentInChildren<Text>();
            if (label != null)
            {
                label.text = value;
            }
        }
    }

    public sealed class SimulatorHotspot : MonoBehaviour
    {
        public int StepIndex { get; set; }
    }

    public sealed class SimulatorOrbitCamera : MonoBehaviour
    {
        private Vector3 target;
        private float distance;
        private float yaw;
        private float pitch = 18f;
        private Vector3 lastPointer;

        public void Configure(Vector3 orbitTarget, float orbitDistance)
        {
            target = orbitTarget;
            distance = orbitDistance;
            yaw = transform.eulerAngles.y;
        }

        private void LateUpdate()
        {
            if (Input.GetMouseButtonDown(0))
            {
                lastPointer = Input.mousePosition;
            }

            if (Input.GetMouseButton(0) && (EventSystem.current == null || EventSystem.current.IsPointerOverGameObject() == false))
            {
                var delta = Input.mousePosition - lastPointer;
                yaw += delta.x * 0.12f;
                pitch = Mathf.Clamp(pitch - delta.y * 0.08f, 8f, 42f);
                lastPointer = Input.mousePosition;
            }

            distance = Mathf.Clamp(distance - Input.mouseScrollDelta.y * 0.5f, 7.5f, 13f);
            var rotation = Quaternion.Euler(pitch, yaw, 0f);
            transform.position = target + rotation * new Vector3(0f, 0f, -distance);
            transform.LookAt(target);
        }
    }
}
