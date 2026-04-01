/**
 * LunaOS WeatherService — Fetches weather from Open-Meteo (no API key required).
 */
'use strict';

(function (global) {
  const BASE_URL = 'https://api.open-meteo.com/v1/forecast';

  const WMO_CODES = {
    0:  { label: 'Clear Sky',          icon: '☀️' },
    1:  { label: 'Mainly Clear',       icon: '🌤' },
    2:  { label: 'Partly Cloudy',      icon: '⛅' },
    3:  { label: 'Overcast',           icon: '☁️' },
    45: { label: 'Foggy',              icon: '🌫' },
    48: { label: 'Rime Fog',           icon: '🌫' },
    51: { label: 'Light Drizzle',      icon: '🌦' },
    53: { label: 'Drizzle',            icon: '🌦' },
    55: { label: 'Heavy Drizzle',      icon: '🌧' },
    61: { label: 'Light Rain',         icon: '🌧' },
    63: { label: 'Rain',               icon: '🌧' },
    65: { label: 'Heavy Rain',         icon: '🌧' },
    71: { label: 'Light Snow',         icon: '🌨' },
    73: { label: 'Snow',               icon: '❄️' },
    75: { label: 'Heavy Snow',         icon: '❄️' },
    80: { label: 'Rain Showers',       icon: '🌦' },
    81: { label: 'Showers',            icon: '🌦' },
    82: { label: 'Violent Showers',    icon: '⛈' },
    95: { label: 'Thunderstorm',       icon: '⛈' },
    99: { label: 'Severe Thunderstorm',icon: '⛈' },
  };

  const WeatherService = {
    /**
     * Fetch weather for given lat/lon.
     * @param {number} lat
     * @param {number} lon
     * @returns {Promise<WeatherData>}
     */
    async fetchByCoords(lat, lon) {
      const params = new URLSearchParams({
        latitude:  lat,
        longitude: lon,
        current:   'temperature_2m,relative_humidity_2m,wind_speed_10m,weathercode',
        daily:     'weathercode,temperature_2m_max,temperature_2m_min',
        timezone:  'auto',
        forecast_days: 7
      });

      const resp = await fetch(`${BASE_URL}?${params}`);
      if (!resp.ok) throw new Error(`Open-Meteo HTTP ${resp.status}`);
      const raw = await resp.json();
      return this._parse(raw);
    },

    /**
     * Get user's coordinates via browser Geolocation.
     * @returns {Promise<{lat, lon}>}
     */
    getLocation() {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported'));
          return;
        }
        navigator.geolocation.getCurrentPosition(
          pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
          err => reject(new Error('Location denied: ' + err.message)),
          { timeout: 8000 }
        );
      });
    },

    /** Parse raw Open-Meteo response into clean data */
    _parse(raw) {
      const cur = raw.current;
      const daily = raw.daily;
      const code = cur.weathercode;
      const condition = WMO_CODES[code] || { label: 'Unknown', icon: '🌡' };

      return {
        temperature: Math.round(cur.temperature_2m),
        unit: '°C',
        humidity: cur.relative_humidity_2m,
        windSpeed: Math.round(cur.wind_speed_10m),
        condition: condition.label,
        icon: condition.icon,
        timezone: raw.timezone,
        forecast: daily.time.slice(0, 7).map((date, i) => ({
          date,
          dayName: new Date(date).toLocaleDateString('en', { weekday: 'short' }),
          icon: (WMO_CODES[daily.weathercode[i]] || { icon: '🌡' }).icon,
          high: Math.round(daily.temperature_2m_max[i]),
          low:  Math.round(daily.temperature_2m_min[i])
        }))
      };
    },

    getCondition(code) {
      return WMO_CODES[code] || { label: 'Unknown', icon: '🌡' };
    }
  };

  global.NovaOS = global.NovaOS || {};
  global.NovaOS.WeatherService = WeatherService;
})(window);
