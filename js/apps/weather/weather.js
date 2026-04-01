/**
 * LunaOS — Weather App
 * Real weather data via Open-Meteo. No API key required.
 */
'use strict';

(function (global) {
  function mount(container) {
    container.innerHTML = `
      <div class="weather-app" id="wx-root">
        <div class="empty-state">
          <div class="es-icon">🌤</div>
          <div class="es-title">Loading weather…</div>
          <div class="es-desc">Requesting location access.</div>
        </div>
      </div>
    `;

    const root = container.querySelector('#wx-root');

    async function load() {
      try {
        const { lat, lon } = await global.NovaOS.WeatherService.getLocation();
        const data = await global.NovaOS.WeatherService.fetchByCoords(lat, lon);
        render(data, lat, lon);
      } catch (err) {
        showError(err.message);
      }
    }

    function render(data, lat, lon) {
      root.innerHTML = `
        <div class="weather-hero">
          <div class="weather-icon-big">${data.icon}</div>
          <div class="weather-temp-big">${data.temperature}${data.unit}</div>
          <div class="weather-desc">${data.condition}</div>
          <div class="weather-loc">📍 ${data.timezone.replace('_',' ')} · ${lat.toFixed(2)}°, ${lon.toFixed(2)}°</div>
        </div>

        <div class="weather-stats">
          <div class="weather-stat">
            <div class="weather-stat-value">${data.humidity}%</div>
            <div class="weather-stat-label">Humidity</div>
          </div>
          <div class="weather-stat">
            <div class="weather-stat-value">${data.windSpeed}</div>
            <div class="weather-stat-label">Wind km/h</div>
          </div>
          <div class="weather-stat">
            <div class="weather-stat-value">${data.forecast[0]?.high ?? '--'}°</div>
            <div class="weather-stat-label">High today</div>
          </div>
        </div>

        <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--luna-text-3)">7-Day Forecast</div>
        <div class="weather-forecast">
          ${data.forecast.map(d => `
            <div class="weather-fc-day">
              <div class="weather-fc-day-name">${d.dayName}</div>
              <div class="weather-fc-icon">${d.icon}</div>
              <div class="weather-fc-temps">${d.high}° / ${d.low}°</div>
            </div>
          `).join('')}
        </div>

        <button class="btn btn-ghost btn-sm" id="wx-refresh" style="align-self:center">↻ Refresh</button>
      `;

      root.querySelector('#wx-refresh').addEventListener('click', () => {
        root.innerHTML = `<div class="empty-state"><div class="es-icon">🔄</div><div class="es-title">Refreshing…</div></div>`;
        load();
      });
    }

    function showError(msg) {
      root.innerHTML = `
        <div class="empty-state">
          <div class="es-icon">⚠️</div>
          <div class="es-title">Weather unavailable</div>
          <div class="es-desc">${_esc(msg)}</div>
          <button class="btn btn-primary btn-sm" id="wx-retry" style="margin-top:12px">Retry</button>
        </div>
      `;
      root.querySelector('#wx-retry')?.addEventListener('click', () => {
        root.innerHTML = `<div class="empty-state"><div class="es-icon">🌤</div><div class="es-title">Requesting location…</div></div>`;
        load();
      });
    }

    load();
  }

  function _esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  global.NovaOS.AppLoader.register({
    id: 'weather', title: 'Weather', width: 420, height: 580,
    mount
  });
})(window);
