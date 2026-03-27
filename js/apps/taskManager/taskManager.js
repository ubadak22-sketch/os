/**
 * LunaOS — Task Manager App
 * Real-time CPU/RAM/GPU monitoring + process list with kill support.
 */
'use strict';

(function (global) {
  function mount(container, { windowId }) {
    container.innerHTML = `
      <div class="tm-app">
        <div class="tm-header">
          <span class="tm-title">Task Manager</span>
          <span id="tm-uptime-${windowId}" style="font-size:11px;font-family:var(--font-mono);color:var(--luna-text-3)"></span>
        </div>
        <div class="tm-body">

          <!-- Gauges -->
          <div class="tm-gauge-grid">
            <div class="tm-gauge cpu">
              <div class="tm-gauge-icon">&#128187;</div>
              <div class="tm-gauge-value" id="tm-cpu-${windowId}">0%</div>
              <div class="tm-gauge-label">CPU</div>
              <div class="tm-gauge-bar" id="tm-cpu-bar-${windowId}"></div>
            </div>
            <div class="tm-gauge ram">
              <div class="tm-gauge-icon">&#128200;</div>
              <div class="tm-gauge-value" id="tm-ram-${windowId}">0%</div>
              <div class="tm-gauge-label">RAM</div>
              <div class="tm-gauge-bar" id="tm-ram-bar-${windowId}"></div>
            </div>
            <div class="tm-gauge gpu">
              <div class="tm-gauge-icon">&#127918;</div>
              <div class="tm-gauge-value" id="tm-gpu-${windowId}">0%</div>
              <div class="tm-gauge-label">GPU</div>
              <div class="tm-gauge-bar" id="tm-gpu-bar-${windowId}"></div>
            </div>
          </div>

          <!-- RAM detail -->
          <div class="tm-ram-detail">
            <div class="tm-ram-title">Memory (MB)</div>
            <div class="tm-ram-row">
              <span>Total RAM</span>
              <span class="tm-ram-row-val" id="tm-rtotal-${windowId}">15,000 MB</span>
            </div>
            <div class="tm-ram-row">
              <span>Reserved (OS)</span>
              <span class="tm-ram-row-val" id="tm-rreserved-${windowId}">1,500 MB</span>
            </div>
            <div class="tm-ram-row">
              <span>Used by apps</span>
              <span class="tm-ram-row-val" id="tm-rused-${windowId}">0 MB</span>
            </div>
            <div class="tm-ram-row">
              <span>Available</span>
              <span class="tm-ram-row-val" id="tm-ravail-${windowId}" style="color:var(--luna-green)">13,500 MB</span>
            </div>
          </div>

          <!-- Process table -->
          <div class="tm-process-table">
            <div class="tm-table-head">
              <span>Process</span>
              <span>PID</span>
              <span>RAM</span>
              <span>Action</span>
            </div>
            <div id="tm-proc-list-${windowId}"></div>
          </div>

        </div>
      </div>
    `;

    let alive   = true;
    let cpuBase = 10, gpuBase = 6;
    const startTime = Date.now();

    function fmt(n) { return n.toLocaleString(); }

    function tick() {
      if (!alive) return;

      // Simulated CPU/GPU
      cpuBase += (Math.random() * 6 - 3);
      cpuBase  = Math.max(4, Math.min(75, cpuBase));
      gpuBase += (Math.random() * 5 - 2.5);
      gpuBase  = Math.max(2, Math.min(50, gpuBase));
      const cpu = Math.round(cpuBase + Math.random() * 10);
      const gpu = Math.round(gpuBase + Math.random() * 8);

      // Real-ish RAM from kernel
      const RAM = global.NovaOS.Kernel.RAM;
      const usable   = RAM.total - RAM.reserved;
      const ramPct   = Math.round((RAM.used / usable) * 100);

      // Update gauges
      const set = (id, val, pct) => {
        const v = container.querySelector(`#tm-${id}-${windowId}`);
        const b = container.querySelector(`#tm-${id}-bar-${windowId}`);
        if (v) v.textContent = val + '%';
        if (b) b.style.width = Math.min(100, pct) + '%';
      };
      set('cpu', cpu, cpu);
      set('ram', ramPct, ramPct);
      set('gpu', gpu, gpu);

      // RAM detail
      const setTxt = (id, txt) => {
        const el = container.querySelector(`#tm-${id}-${windowId}`);
        if (el) el.textContent = txt;
      };
      setTxt('rtotal',    fmt(RAM.total)    + ' MB');
      setTxt('rreserved', fmt(RAM.reserved) + ' MB');
      setTxt('rused',     fmt(RAM.used)     + ' MB');
      setTxt('ravail',    fmt(RAM.available()) + ' MB');

      // Uptime
      const secs  = Math.floor((Date.now() - startTime) / 1000);
      const m     = Math.floor(secs / 60);
      const s     = secs % 60;
      const uptEl = container.querySelector(`#tm-uptime-${windowId}`);
      if (uptEl) uptEl.textContent = `uptime ${m}m ${s}s`;

      // Process list
      _renderProcs();
    }

    function _renderProcs() {
      const listEl = container.querySelector(`#tm-proc-list-${windowId}`);
      if (!listEl) return;
      const procs = global.NovaOS.ProcessManager.list();
      const RAM   = global.NovaOS.Kernel.RAM;

      if (!procs.length) {
        listEl.innerHTML = `<div style="padding:14px;text-align:center;font-size:12px;color:var(--luna-text-3)">No processes running</div>`;
        return;
      }

      listEl.innerHTML = procs.map(p => {
        const ramMB = RAM.appLimits[p.appId] || 400;
        return `
          <div class="tm-table-row">
            <span>${p.appId}</span>
            <span style="font-family:var(--font-mono);color:var(--luna-text-3)">${p.pid}</span>
            <span style="font-family:var(--font-mono)">${fmt(ramMB)} MB</span>
            <span>
              <button class="btn btn-danger btn-sm" data-pid="${p.pid}" data-appid="${p.appId}" style="padding:2px 8px;font-size:10px">
                Kill
              </button>
            </span>
          </div>
        `;
      }).join('');

      // Wire kill buttons
      listEl.querySelectorAll('[data-pid]').forEach(btn => {
        btn.addEventListener('click', () => {
          const pid    = parseInt(btn.dataset.pid);
          const appId  = btn.dataset.appid;
          const proc   = global.NovaOS.ProcessManager.get(pid);
          if (!proc) return;
          const win = global.NovaOS.WindowManager.getByApp(appId);
          if (win) global.NovaOS.WindowManager.close(win.windowId);
          else     global.NovaOS.ProcessManager.kill(pid);
          global.NovaOS.Kernel.notify('Task Manager', `Killed "${appId}"`, '&#128202;');
        });
      });
    }

    // Run immediately then every 1.5s
    tick();
    const interval = setInterval(tick, 1500);

    global.NovaOS.EventBus.once('window:closed', ({ windowId: wid }) => {
      if (wid === windowId) { alive = false; clearInterval(interval); }
    });
  }

  global.NovaOS.AppLoader.register({
    id: 'taskManager', title: 'Task Manager', width: 560, height: 560,
    mount
  });
})(window);
