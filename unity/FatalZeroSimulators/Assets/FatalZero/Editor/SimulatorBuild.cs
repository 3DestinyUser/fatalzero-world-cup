using System;
using System.IO;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEngine;

namespace FatalZero.Editor
{
    public static class SimulatorBuild
    {
        private const string HandsScenePath = "Assets/FatalZero/Scenes/LashingHands.unity";
        private const string HandsBuildKey = "lashing-hands-v1";
        private const string ReleaseScenePath = "Assets/FatalZero/Scenes/LashingLineOfFire.unity";
        private const string ReleaseBuildKey = "lashing-line-of-fire-v1";
        private const string SuspendedScenePath = "Assets/FatalZero/Scenes/SuspendedLoad.unity";
        private const string SuspendedBuildKey = "suspended-load-v1";

        [MenuItem("FATALZERO/Build Hands in Control WebGL")]
        public static void BuildWebGL()
        {
            BuildSimulator(
                HandsScenePath,
                HandsBuildKey,
                "FATALZERO · Hands in Control",
                "LashingHandsSimulator",
                LashingScenarioVariant.HandsInControl);
        }

        [MenuItem("FATALZERO/Build Line of Fire WebGL")]
        public static void BuildLineOfFireWebGL()
        {
            BuildSimulator(
                ReleaseScenePath,
                ReleaseBuildKey,
                "FATALZERO · Line of Fire",
                "LashingLineOfFireSimulator",
                LashingScenarioVariant.LineOfFire);
        }

        [MenuItem("FATALZERO/Build Suspended Load WebGL")]
        public static void BuildSuspendedLoadWebGL()
        {
            BuildSimulator(
                SuspendedScenePath,
                SuspendedBuildKey,
                "FATALZERO · Suspended Load",
                "SuspendedLoadSimulator",
                LashingScenarioVariant.SuspendedLoad);
        }

        [MenuItem("FATALZERO/Build All WebGL Simulators")]
        public static void BuildAllWebGL()
        {
            BuildWebGL();
            BuildLineOfFireWebGL();
            BuildSuspendedLoadWebGL();
        }

        private static void BuildSimulator(
            string scenePath,
            string buildKey,
            string productName,
            string simulatorObjectName,
            LashingScenarioVariant variant)
        {
            CreateScene(scenePath, simulatorObjectName, variant);
            ConfigurePlayer(productName);

            var outputPath = GetOutputPath(buildKey);
            Directory.CreateDirectory(outputPath);

            var options = new BuildPlayerOptions
            {
                scenes = new[] { scenePath },
                locationPathName = outputPath,
                target = BuildTarget.WebGL,
                options = BuildOptions.CleanBuildCache
            };

            var report = BuildPipeline.BuildPlayer(options);
            if (report.summary.result != BuildResult.Succeeded)
            {
                throw new InvalidOperationException(
                    $"FATALZERO WebGL build failed: {report.summary.result} with {report.summary.totalErrors} errors.");
            }

            PatchWebTemplate(Path.Combine(outputPath, "index.html"));
            Debug.Log($"FATALZERO_BUILD_OK {outputPath} {report.summary.totalSize} bytes");
        }

        [MenuItem("FATALZERO/Create Hands in Control Scene")]
        public static void CreateScene()
        {
            CreateScene(
                HandsScenePath,
                "LashingHandsSimulator",
                LashingScenarioVariant.HandsInControl);
        }

        [MenuItem("FATALZERO/Create Line of Fire Scene")]
        public static void CreateLineOfFireScene()
        {
            CreateScene(
                ReleaseScenePath,
                "LashingLineOfFireSimulator",
                LashingScenarioVariant.LineOfFire);
        }

        [MenuItem("FATALZERO/Create Suspended Load Scene")]
        public static void CreateSuspendedLoadScene()
        {
            CreateScene(
                SuspendedScenePath,
                "SuspendedLoadSimulator",
                LashingScenarioVariant.SuspendedLoad);
        }

        private static void CreateScene(
            string scenePath,
            string simulatorObjectName,
            LashingScenarioVariant variant)
        {
            Directory.CreateDirectory(Path.GetDirectoryName(scenePath) ?? "Assets/FatalZero/Scenes");
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

            var bridgeObject = new GameObject("FatalZeroBridge");
            bridgeObject.AddComponent<FatalZeroBridge>();

            var simulatorObject = new GameObject(simulatorObjectName);
            var simulator = simulatorObject.AddComponent<LashingHandsSimulator>();
            simulator.Variant = variant;

            EditorSceneManager.SaveScene(scene, scenePath);
            EditorBuildSettings.scenes = new[]
            {
                new EditorBuildSettingsScene(scenePath, true)
            };
            AssetDatabase.SaveAssets();
        }

        private static void ConfigurePlayer(string productName)
        {
            PlayerSettings.companyName = "3Destiny";
            PlayerSettings.productName = productName;
            PlayerSettings.defaultWebScreenWidth = 1440;
            PlayerSettings.defaultWebScreenHeight = 810;
            PlayerSettings.runInBackground = true;
            PlayerSettings.WebGL.compressionFormat = WebGLCompressionFormat.Disabled;
            PlayerSettings.WebGL.dataCaching = false;
            PlayerSettings.WebGL.debugSymbolMode = WebGLDebugSymbolMode.Off;
            PlayerSettings.SetGraphicsAPIs(BuildTarget.WebGL, new[]
            {
                UnityEngine.Rendering.GraphicsDeviceType.OpenGLES3
            });
        }

        private static string GetOutputPath(string buildKey)
        {
            return Path.GetFullPath(Path.Combine(
                Application.dataPath,
                "..",
                "..",
                "..",
                "public",
                "unity",
                "builds",
                buildKey));
        }

        private static void PatchWebTemplate(string indexPath)
        {
            if (File.Exists(indexPath) == false)
            {
                throw new FileNotFoundException("Unity WebGL index was not generated.", indexPath);
            }

            var html = File.ReadAllText(indexPath);
            const string promise = ".then((unityInstance) => {";
            if (html.Contains("window.unityInstance = unityInstance;") == false)
            {
                html = html.Replace(
                    promise,
                    promise
                    + "\n          window.unityInstance = unityInstance;"
                    + "\n          window.FatalZeroDeliverMissionContext?.();");
            }
            else if (html.Contains("window.FatalZeroDeliverMissionContext?.();") == false)
            {
                html = html.Replace(
                    "window.unityInstance = unityInstance;",
                    "window.unityInstance = unityInstance;\n          window.FatalZeroDeliverMissionContext?.();");
            }

            html = html.Replace(
                "</head>",
                "<style>html,body,#unity-container,#unity-canvas{width:100%!important;height:100%!important;margin:0;overflow:hidden;background:#02121f}#unity-footer{display:none}</style></head>");
            File.WriteAllText(indexPath, html);
        }
    }
}
