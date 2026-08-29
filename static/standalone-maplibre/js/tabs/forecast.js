/**
 * Tab 1: Forecast Screen View
 */

import { formatTemp, formatTime, formatDateShort, getWeatherIconEmoji, getUvCategory } from '../utils/formatters.js';

export function renderForecastTab(container, { location, observations, hourlyForecast, dailyForecast }) {
  if (!observations && !dailyForecast?.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="spinner"></div>
        <p>Loading weather forecast...</p>
      </div>
    `;
    return;
  }

  const today = dailyForecast?.[0] || {};
  const currentTemp = observations?.temp;
  const feelsLike = observations?.temp_feels_like;
  const rainSince9am = observations?.rain_since_9am ?? '--';
  const humidity = observations?.humidity ?? '--';
  const wind = observations?.wind || {};
  const uv = today?.uv || {};
  const uvCategory = getUvCategory(uv.max_index);

  container.innerHTML = `
    <div class="forecast-container">
      <!-- Hero Conditions Card -->
      <div class="card hero-card">
        <div class="hero-header">
          <div>
            <h1 class="hero-location">${location?.name || 'Sydney'}</h1>
            <p class="hero-state">${location?.state || 'NSW'} ${location?.postcode ? '• ' + location.postcode : ''}</p>
          </div>
          <div class="hero-icon">${getWeatherIconEmoji(today?.icon_descriptor || observations?.icon_descriptor)}</div>
        </div>

        <div class="hero-main">
          <div class="hero-temp-box">
            <span class="hero-temp">${formatTemp(currentTemp)}</span>
            <div class="hero-subtemp">
              <span class="hero-feels">Feels like ${formatTemp(feelsLike)}</span>
              <span class="hero-range">${formatTemp(today?.temp_min)} / ${formatTemp(today?.temp_max)}</span>
            </div>
          </div>
          <div class="hero-summary">
            <p class="hero-short-text">${today?.short_text || 'Current conditions from Bureau station'}</p>
            ${today?.rain?.chance !== undefined ? `
              <div class="hero-rain-badge">
                <span>💧 ${today.rain.chance}%</span>
                ${today.rain.amount?.min !== undefined ? `<span>(${today.rain.amount.min}-${today.rain.amount.max} mm)</span>` : ''}
              </div>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- 72-Hour Horizontal Hourly Forecast Carousel -->
      <div class="section-box">
        <h2 class="section-title">Hourly Forecast (Next 72 Hours)</h2>
        <div class="hourly-scroll-container">
          ${(hourlyForecast || []).slice(0, 36).map((h, i) => `
            <div class="hourly-card ${i === 0 ? 'hourly-now' : ''}">
              <span class="hourly-time">${i === 0 ? 'Now' : formatTime(h.time, location?.timezone)}</span>
              <span class="hourly-icon">${getWeatherIconEmoji(h.icon_descriptor)}</span>
              <span class="hourly-temp">${formatTemp(h.temp)}</span>
              <div class="hourly-rain">
                <span style="font-size: 0.75rem; color: #60a5fa;">💧 ${h.rain?.chance ?? 0}%</span>
                <div class="hourly-rain-bar" style="height: ${Math.min(24, Math.max(3, (h.rain?.chance ?? 0) * 0.24))}px"></div>
              </div>
              <span class="hourly-wind">${h.wind?.speed_kilometre ?? '--'} km/h ${h.wind?.direction ?? ''}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 7-Day Extended Forecast Accordion -->
      <div class="section-box">
        <h2 class="section-title">7-Day Extended Forecast</h2>
        <div class="daily-list">
          ${(dailyForecast || []).map((d, idx) => `
            <details class="daily-row" ${idx === 0 ? 'open' : ''}>
              <summary class="daily-summary">
                <span class="daily-date">${idx === 0 ? 'Today' : formatDateShort(d.date, location?.timezone)}</span>
                <span class="daily-icon">${getWeatherIconEmoji(d.icon_descriptor)}</span>
                <div class="daily-rain-chance">
                  <span>💧 ${d.rain?.chance ?? 0}%</span>
                  ${d.rain?.amount?.max ? `<small>${d.rain.amount.min || 0}-${d.rain.amount.max}mm</small>` : ''}
                </div>
                <div class="daily-temps">
                  <span class="temp-min">${formatTemp(d.temp_min)}</span>
                  <span class="temp-bar"></span>
                  <span class="temp-max">${formatTemp(d.temp_max)}</span>
                </div>
              </summary>
              <div class="daily-details">
                <p class="daily-extended-text">${d.extended_text || d.short_text || 'No detailed text available.'}</p>
                <div class="daily-meta-grid">
                  <div><span>☀️ UV Rating:</span> <b>${uv.max_index ?? '--'} (${uvCategory.label})</b></div>
                  <div><span>💨 Wind:</span> <b>${d.wind?.speed_kilometre ? d.wind.speed_kilometre + ' km/h ' + (d.wind.direction || '') : 'Moderate'}</b></div>
                  <div><span>🌅 Sunrise:</span> <b>${formatTime(d.astronomical?.sunrise_time, location?.timezone)}</b></div>
                  <div><span>🌇 Sunset:</span> <b>${formatTime(d.astronomical?.sunset_time, location?.timezone)}</b></div>
                  ${d.fire_danger ? `<div><span>🔥 Fire Danger:</span> <b>${d.fire_danger}</b></div>` : ''}
                </div>
              </div>
            </details>
          `).join('')}
        </div>
      </div>

      <!-- Atmospheric Details Grid -->
      <div class="section-box">
        <h2 class="section-title">Current Atmospheric Observations</h2>
        <div class="metrics-grid">
          <div class="card metric-card">
            <span class="metric-label">💨 Wind</span>
            <span class="metric-value">${wind.speed_kilometre ?? '--'} <small>km/h</small></span>
            <span class="metric-sub">${wind.direction ? 'Direction: ' + wind.direction : ''} ${wind.speed_knot ? '(' + wind.speed_knot + ' kts)' : ''}</span>
          </div>

          <div class="card metric-card">
            <span class="metric-label">💧 Humidity & Dew Point</span>
            <span class="metric-value">${humidity}%</span>
            <span class="metric-sub">Dew Point: ${observations?.temp_dew_point ? observations.temp_dew_point + '°' : '--'}</span>
          </div>

          <div class="card metric-card">
            <span class="metric-label">🌧️ Rainfall</span>
            <span class="metric-value">${rainSince9am} <small>mm</small></span>
            <span class="metric-sub">Accumulated since 9:00 AM</span>
          </div>

          <div class="card metric-card">
            <span class="metric-label">🌡️ Barometer</span>
            <span class="metric-value">${observations?.pressure_msl ?? '--'} <small>hPa</small></span>
            <span class="metric-sub">Mean Sea Level Pressure</span>
          </div>
        </div>
      </div>
    </div>
  `;
}
