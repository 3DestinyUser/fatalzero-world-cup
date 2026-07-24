mergeInto(LibraryManager.library, {
  FatalZeroBridgeInitialize: function () {
    if (window.fatalZeroBridgeInitialized) return;
    window.fatalZeroBridgeInitialized = true;

    window.FatalZeroDeliverMissionContext = function () {
      if (!window.unityInstance || !window.fatalZeroPendingMissionContext) return false;

      window.unityInstance.SendMessage(
        "FatalZeroBridge",
        "ReceiveMissionContext",
        JSON.stringify(window.fatalZeroPendingMissionContext)
      );
      window.fatalZeroPendingMissionContext = null;
      return true;
    };

    window.addEventListener("message", function (message) {
      var data = message.data;
      if (!data || data.source !== "fatalzero-platform" || data.type !== "mission.context") return;

      window.fatalZeroPendingMissionContext = data.context;
      window.FatalZeroDeliverMissionContext();
    });

    window.parent.postMessage({
      source: "fatalzero-unity",
      type: "runtime.ready"
    }, window.location.origin);
  },

  FatalZeroBridgeEmit: function (eventJsonPointer) {
    var eventJson = UTF8ToString(eventJsonPointer);
    var eventData = JSON.parse(eventJson);

    window.parent.postMessage({
      source: "fatalzero-unity",
      event: eventData
    }, window.location.origin);
  }
});
