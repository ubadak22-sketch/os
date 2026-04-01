/**
 * LunaOS AppLoader v2 — Registry and launcher with RAM gating.
 */
'use strict';

(function (global) {
  const _registry = new Map();

  const AppLoader = {
    register(def) {
      if (!def.id || !def.mount) {
        console.error('[AppLoader] App must have id and mount:', def);
        return;
      }
      _registry.set(def.id, def);
    },

    launch(appId) {
      const def = _registry.get(appId);
      if (!def) {
        console.warn(`[AppLoader] Unknown app: "${appId}"`);
        global.NovaOS.Kernel?.notify('System', `App "${appId}" not found`, '⚠️');
        return;
      }

      const PM = global.NovaOS.ProcessManager;
      const WM = global.NovaOS.WindowManager;
      const K  = global.NovaOS.Kernel;

      // Single-instance: toggle existing window
      if (!def.multiInstance && PM.isRunning(appId)) {
        WM.toggleFromDock(appId);
        return;
      }

      // RAM gate
      if (K && !K.tryAllocRAM(appId)) return;

      try {
        const windowId = WM.create({
          appId,
          title:  def.title,
          width:  def.width  || 680,
          height: def.height || 480,
        });

        const container = WM.getBody(windowId);
        if (!container) throw new Error('No window body');

        const pid = PM.spawn(appId, windowId);

        // Attach pid to window record via WM internal map
        const wm = global.NovaOS.WindowManager;
        if (wm._windows) {
          const entry = wm._windows.get(windowId);
          if (entry) entry.pid = pid;
        }

        // Mount — wrapped so crashes don't break the shell
        try {
          def.mount(container, { windowId, pid, appId });
        } catch (mountErr) {
          console.error(`[AppLoader] mount error for "${appId}":`, mountErr);
          container.innerHTML = `
            <div class="empty-state">
              <div class="es-icon">&#10060;</div>
              <div class="es-title">App crashed</div>
              <div class="es-desc">${mountErr.message}</div>
            </div>`;
        }

        global.NovaOS.SoundSystem?.click();
        global.NovaOS.EventBus.emit('app:launched', { appId, windowId, pid });
      } catch (err) {
        console.error(`[AppLoader] Failed to launch "${appId}":`, err);
        // Refund RAM on outer failure
        global.NovaOS.Kernel?.RAM?.free(appId);
        global.NovaOS.Kernel?.notify('System Error', `Failed to open ${def.title}`, '❌');
      }
    },

    has(appId)  { return _registry.has(appId); },
    list()      { return Array.from(_registry.values()); },
    get(appId)  { return _registry.get(appId) || null; }
  };

  global.NovaOS = global.NovaOS || {};
  global.NovaOS.AppLoader = AppLoader;
})(window);
