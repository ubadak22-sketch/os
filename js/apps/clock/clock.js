/**
 * LunaOS — Clock App
 * Real-time analog + digital clock with timezone display.
 */
'use strict';

(function (global) {
  function mount(container, { windowId }) {
    container.innerHTML = `
      <div class="clock-app">
        <div class="clock-analog">
          <div class="clock-face">
            <div class="clock-hand hand-hour"  id="hand-h-${windowId}"></div>
            <div class="clock-hand hand-minute" id="hand-m-${windowId}"></div>
            <div class="clock-hand hand-second" id="hand-s-${windowId}"></div>
            <div class="clock-center"></div>
          </div>
        </div>
        <div class="clock-time" id="clock-dig-${windowId}">00:00:00</div>
        <div class="clock-date" id="clock-date-${windowId}"></div>
        <div class="clock-tz"  id="clock-tz-${windowId}"></div>
      </div>
    `;

    const handH  = container.querySelector(`#hand-h-${windowId}`);
    const handM  = container.querySelector(`#hand-m-${windowId}`);
    const handS  = container.querySelector(`#hand-s-${windowId}`);
    const digEl  = container.querySelector(`#clock-dig-${windowId}`);
    const dateEl = container.querySelector(`#clock-date-${windowId}`);
    const tzEl   = container.querySelector(`#clock-tz-${windowId}`);

    let alive = true;

    function tick() {
      if (!alive) return;
      const now = new Date();
      const h = now.getHours() % 12, m = now.getMinutes(), s = now.getSeconds();

      const degH = (h * 30) + (m * 0.5);
      const degM = m * 6 + (s * 0.1);
      const degS = s * 6;

      if (handH) handH.style.transform = `rotate(${degH}deg)`;
      if (handM) handM.style.transform = `rotate(${degM}deg)`;
      if (handS) handS.style.transform = `rotate(${degS}deg)`;

      if (digEl) digEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      if (dateEl) dateEl.textContent = now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      if (tzEl)   tzEl.textContent = Intl.DateTimeFormat().resolvedOptions().timeZone;

      requestAnimationFrame(tick);
    }

    tick();

    // Cleanup when window closes
    global.NovaOS.EventBus.once('window:closed', ({ windowId: wid }) => {
      if (wid === windowId) alive = false;
    });
  }

  global.NovaOS.AppLoader.register({
    id: 'clock', title: 'Clock', width: 320, height: 380,
    mount
  });
})(window);
