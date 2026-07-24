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
        private const string ScenePath = "Assets/FatalZero/Scenes/LashingHands.unity";
        private const string BuildKey = "lashing-hands-v1";

        [MenuItem("FATALZERO/Build Hands in Control WebGL")]
        public static void BuildWebGL()
        {
            CreateScene();
            ConfigurePlayer();

            var outputPath = GetOutputPath();
            Directory.CreateDirectory(outputPath);

            var options = new BuildPlayerOptions
            {
                scenes = new[] { ScenePath },
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
            Directory.CreateDirectory(Path.GetDirectoryName(ScenePath) ?? "Assets/FatalZero/Scenes");
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

            var bridgeObject = new GameObject("FatalZeroBridge");
            bridgeObject.AddComponent<FatalZeroBridge>();

            var simulatorObject = new GameObject("LashingHandsSimulator");
            simulatorObject.AddComponent<LashingHandsSimulator>();

            EditorSceneManager.SaveScene(scene, ScenePath);
            EditorBuildSettings.scenes = new[]
            {
                new EditorBuildSettingsScene(ScenePath, true)
            };
            AssetDatabase.SaveAssets();
        }

        private static void ConfigurePlayer()
        {
            PlayerSettings.companyName = "3Destiny";
            PlayerSettings.productName = "FATALZERO · Hands in Control";
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

        private static string GetOutputPath()
        {
            return Path.GetFullPath(Path.Combine(
                Application.dataPath,
                "..",
                "..",
                "..",
                "public",
                "unity",
                "builds",
                BuildKey));
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
