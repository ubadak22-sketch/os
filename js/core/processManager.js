/**
 * LunaOS ProcessManager — Tracks running app processes, prevents duplicates,
 * assigns PIDs.
 */
'use strict';

(function (global) {
  let _nextPid = 1;
  const _processes = new Map(); // pid → {pid, appId, windowId, startedAt}

  const ProcessManager = {
    /**
     * Spawn a new process.
     * @param {string} appId
     * @param {string} windowId
     * @returns {number} pid
     */
    spawn(appId, windowId) {
      const pid = _nextPid++;
      _processes.set(pid, {
        pid,
        appId,
        windowId,
        startedAt: Date.now()
      });
      global.NovaOS.EventBus.emit('process:spawned', { pid, appId });
      return pid;
    },

    /**
     * Kill a process by pid.
     * @param {number} pid
     */
    kill(pid) {
      const proc = _processes.get(pid);
      if (!proc) return;
      _processes.delete(pid);
      global.NovaOS.EventBus.emit('process:killed', { pid, appId: proc.appId });
    },

    /** Kill all processes for an app id */
    killByApp(appId) {
      for (const [pid, proc] of _processes) {
        if (proc.appId === appId) this.kill(pid);
      }
    },

    /** Check if an app is already running */
    isRunning(appId) {
      for (const proc of _processes.values()) {
        if (proc.appId === appId) return true;
      }
      return false;
    },

    /** Get process by appId */
    getByApp(appId) {
      for (const proc of _processes.values()) {
        if (proc.appId === appId) return proc;
      }
      return null;
    },

    /** Get process by pid */
    get(pid) {
      return _processes.get(pid) || null;
    },

    /** Return array of all running processes */
    list() {
      return Array.from(_processes.values());
    }
  };

  global.NovaOS = global.NovaOS || {};
  global.NovaOS.ProcessManager = ProcessManager;
})(window);
