window.addEventListener('error', (e) => { e.preventDefault(); console.log('Handled error:', e.message); });
window.addEventListener('unhandledrejection', (e) => { e.preventDefault(); console.log('Handled rejection:', e.reason?.message || e.reason); });
/**
 * HeatShield Pro 2.0 — Frontend Controller & Advanced Telemetry Visualizer
 */

// ========== CONFIGURATION & GLOBAL STATE ==========
const API_BASE = '';
const DEFAULT_LAT = 28.61; // Delhi
const DEFAULT_LON = 77.23;
const DEFAULT_NAME = 'Delhi, India';
const REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes

const state = {
  lat: DEFAULT_LAT,
  lon: DEFAULT_LON,
  locationName: DEFAULT_NAME,
  unit: 'C', // 'C' or 'F'
  chartRange: 48, // 24 or 48 hours
  chartSeries: 'all', // 'all', 'hi', 'wbgt', 'tw'
  weatherData: null,
  thermalStressData: null,
  forecastData: null,
  alertData: null,
  hourlyData: null,
  multiCityData: null,
  isLoading: false,
  selectedStrainModel: 'heat_index',
  isGaugeSimulated: false,
  simulatedValue: null
};

async function safeJson(res) {
  if (!res) return null;
  try {
    const text = await res.text();
    if (!text) return null;
    const trimmed = text.trim();
    if (!trimmed || trimmed === 'undefined' || trimmed === '"undefined"') return null;
    return JSON.parse(trimmed);
  } catch (e) {
    return null;
  }
}

async function fetchJson(url, options = {}) {
  try {
    const r = await fetch(url, options);
    if (!r || !r.ok) return null;
    return await safeJson(r);
  } catch (e) {
    return null;
  }
}

let hourlyChart = null;
let heatMap = null;
let refreshTimer = null;
let cityMarkersLayer = null;
let userMarker = null;

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', initApp);

async function initApp() {
  initTheme();
  startUtcClock();
  setupEventListeners();
  initSidebarAndRouter();
  initHydrationCalculator();
  initMap();
  initAuthSystem();
  initNotificationSystem();
  initDataExportHandlers();
  registerServiceWorker();
  initPwaInstall();

  // Apply precision skeleton loading placeholders immediately for zero-layout-shift boot
  applyDashboardSkeletons();

  // Load default location data immediately for zero-delay rendering
  loadAllDashboardData();

  // Optionally upgrade to real GPS location if permission granted
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (pos && pos.coords && typeof pos.coords.latitude === 'number' && !isNaN(pos.coords.latitude)) {
          state.lat = pos.coords.latitude;
          state.lon = pos.coords.longitude;
          state.locationName = await reverseGeocode(state.lat, state.lon);
          loadAllDashboardData();
        }
      },
      () => {
        // Geolocation denied or unavailable; default data is already loaded
      },
      { timeout: 5000, maximumAge: 60000 }
    );
  }

  startAutoRefresh();
}

function startAutoRefresh() {
  setInterval(() => {
    loadAllDashboardData();
  }, 300000); // 5 minutes
}

// ========== THEME TOGGLE ==========
function initTheme() {
  const btn = document.getElementById('btn-theme-toggle');
  const iconDark = document.getElementById('theme-icon-dark');
  const iconLight = document.getElementById('theme-icon-light');

  function applyTheme(theme) {
    if (theme === 'light') {
      document.body.setAttribute('data-theme', 'light');
      if (iconDark) iconDark.style.display = 'block';
      if (iconLight) iconLight.style.display = 'none';
    } else {
      document.body.removeAttribute('data-theme');
      if (iconDark) iconDark.style.display = 'none';
      if (iconLight) iconLight.style.display = 'block';
    }
    // Re-render charts to update grid colors
    if (typeof updateHourlyTimelineChart === 'function' && state.hourlyData) {
      updateHourlyTimelineChart(state.hourlyData);
    }
    if (typeof renderEpidemiology === 'function' && state.epiData) {
      // Re-rendering entire epi section to redraw the chart safely
      renderEpidemiology(state.epiData);
    }
    if (typeof updateMapTheme === 'function') {
      updateMapTheme(theme);
    }
  }

  const savedTheme = localStorage.getItem('heatshield_theme') || 'dark';
  applyTheme(savedTheme);

  if (btn) {
    btn.addEventListener('click', () => {
      const current = document.body.getAttribute('data-theme');
      const newTheme = current === 'light' ? 'dark' : 'light';
      localStorage.setItem('heatshield_theme', newTheme);
      applyTheme(newTheme);
    });
  }
}

// ========== LIVE CLOCK ==========
function startUtcClock() {
  const clockEl = document.getElementById('utc-clock');
  function updateClock() {
    if (clockEl) {
      const now = new Date();
      clockEl.textContent = `UTC ${now.toUTCString().slice(17, 25)}`;
    }
  }
  updateClock();
  setInterval(updateClock, 1000);
}

// ========== EVENT LISTENERS ==========
function setupEventListeners() {
  // Search Form
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('location-search');

  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = searchInput.value.trim();
      if (query) searchCity(query);
    });
  }

  // Geolocation Button
  const geoBtn = document.getElementById('geolocate-btn');
  if (geoBtn) {
    geoBtn.addEventListener('click', handleGeolocate);
  }

  // Refresh Button
  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadAllDashboardData(true);
    });
  }

  // Temperature Unit Switcher
  const unitC = document.getElementById('unit-c');
  const unitF = document.getElementById('unit-f');

  if (unitC && unitF) {
    unitC.addEventListener('click', () => setTemperatureUnit('C'));
    unitF.addEventListener('click', () => setTemperatureUnit('F'));
  }

  // Chart Range Toggles (24h / 48h)
  const btn24h = document.getElementById('btn-chart-24h');
  const btn48h = document.getElementById('btn-chart-48h');

  if (btn24h && btn48h) {
    btn24h.addEventListener('click', () => {
      state.chartRange = 24;
      btn24h.classList.add('active');
      btn48h.classList.remove('active');
      if (state.hourlyData) updateHourlyTimelineChart(state.hourlyData);
    });

    btn48h.addEventListener('click', () => {
      state.chartRange = 48;
      btn48h.classList.add('active');
      btn24h.classList.remove('active');
      if (state.hourlyData) updateHourlyTimelineChart(state.hourlyData);
    });
  }

  // Chart Metric / Index Series Filter (All, HI, WBGT, Wet-Bulb)
  const segIndexFilter = document.getElementById('seg-index-filter');
  if (segIndexFilter) {
    segIndexFilter.addEventListener('click', (e) => {
      const btn = e.target.closest('.seg-btn');
      if (btn && btn.dataset.series) {
        segIndexFilter.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.chartSeries = btn.dataset.series;
        if (state.hourlyData) updateHourlyTimelineChart(state.hourlyData);
      }
    });
  }

  // Download Chart Button
  const btnDownloadChart = document.getElementById('btn-download-chart');
  if (btnDownloadChart) {
    btnDownloadChart.addEventListener('click', () => {
      const canvas = document.getElementById('hourly-chart');
      if (canvas) {
        // Create temporary canvas to add background color
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const ctx = tempCanvas.getContext('2d');
        
        // Fill background to match app dark mode or light mode
        const isLight = document.body.getAttribute('data-theme') === 'light';
        ctx.fillStyle = isLight ? '#ffffff' : '#060911'; 
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // Draw the original chart over the background
        ctx.drawImage(canvas, 0, 0);
        
        const link = document.createElement('a');
        link.download = `heatshield-forecast-${new Date().toISOString().slice(0, 10)}.png`;
        link.href = tempCanvas.toDataURL('image/png', 1.0);
        link.click();
        showToast('Chart exported as PNG', 'success');
      }
    });
  }

  // Quick Preset Location Chips
  const presetChips = document.getElementById('preset-chips');
  if (presetChips) {
    presetChips.addEventListener('click', (e) => {
      const btn = e.target.closest('.station-chip, .chip-btn');
      if (btn) {
        const lat = parseFloat(btn.dataset.lat);
        const lon = parseFloat(btn.dataset.lon);
        const name = btn.dataset.name;

        document.querySelectorAll('.station-chip, .chip-btn').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');

        selectLocation(lat, lon, name);
      }
    });
  }

  // Biometeorological Strain Gauge Wheel interactive controller
  initStrainGaugeWheelInteraction();
}

// ========== LOCATION SERVICES ==========

async function searchCity(query) {
  setLoadingState(true);
  try {
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en`);
    if (!res.ok) throw new Error('Geocoding search failed');
    const data = await safeJson(res);

    if (data && data.results && data.results.length > 0) {
      const loc = data.results[0];
      const fullName = [loc.name, loc.admin1, loc.country].filter(Boolean).join(', ');
      selectLocation(loc.latitude, loc.longitude, fullName);
      document.getElementById('location-search').value = '';
    } else {
      showToast('Location not found. Try entering a larger city nearby.', 'warning');
    }
  } catch (err) {
    console.error('Search error:', err);
    showToast('Failed to search location. Check your network connection.', 'error');
  } finally {
    setLoadingState(false);
  }
}

async function handleGeolocate() {
  if (!navigator.geolocation) {
    showToast('Geolocation is not supported by your browser.', 'error');
    return;
  }

  setLoadingState(true);
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      if (pos && pos.coords && typeof pos.coords.latitude === 'number' && !isNaN(pos.coords.latitude)) {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const name = await reverseGeocode(lat, lon);
        selectLocation(lat, lon, name);
      }
      setLoadingState(false);
    },
    (err) => {
      setLoadingState(false);
      showToast('Location access denied or unavailable.', 'warning');
    },
    { timeout: 8000 }
  );
}

function selectLocation(lat, lon, name) {
  if (typeof lat !== 'number' || isNaN(lat)) lat = DEFAULT_LAT;
  if (typeof lon !== 'number' || isNaN(lon)) lon = DEFAULT_LON;
  state.lat = lat;
  state.lon = lon;
  state.locationName = name || `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;

  if (heatMap) {
    heatMap.setView([lat, lon], 7);
    updateUserMarker(lat, lon, state.locationName);
  }

  loadAllDashboardData();
}

async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
    if (res.ok) {
      const data = await safeJson(res);
      if (data) {
        const city = data.city || data.locality || data.principalSubdivision;
        const country = data.countryName;
        if (city) return `${city}, ${country || ''}`;
      }
    }
  } catch (e) {
    // Fallback
  }
  return `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`;
}

// ========== UNIT CONVERSION HELPERS ==========

function setTemperatureUnit(unit) {
  if (state.unit === unit) return;
  state.unit = unit;

  document.getElementById('unit-c').classList.toggle('active', unit === 'C');
  document.getElementById('unit-f').classList.toggle('active', unit === 'F');

  const unitLabels = document.querySelectorAll('#unit-label-temp');
  unitLabels.forEach(el => el.textContent = `°${unit}`);

  const dangerZoneLegend = document.getElementById('danger-zone-legend');
  if (dangerZoneLegend) {
    dangerZoneLegend.textContent = unit === 'F' ? 'Shaded Area: Danger Zone (>104°F)' : 'Shaded Area: Danger Zone (>40°C)';
  }

  const tempScaleCenter = document.getElementById('temp-scale-center');
  if (tempScaleCenter) {
    tempScaleCenter.textContent = unit === 'F' ? '77°F' : '25°C';
  }

  renderAllData();
}

function formatTemp(valC, withUnit = true, decimalPlaces = 1) {
  if (valC == null || isNaN(valC)) return '--';
  const num = state.unit === 'F' ? (valC * 9 / 5 + 32) : valC;
  return `${num.toFixed(decimalPlaces)}${withUnit ? '°' + state.unit : '°'}`;
}

function convertTemp(valC) {
  if (valC == null || isNaN(valC)) return null;
  return state.unit === 'F' ? (valC * 9 / 5 + 32) : valC;
}

// ========== RENDERING CONTROLLER ==========

function renderAllData() {
  if (state.thermalStressData) updateAtmosphericCards(state.thermalStressData);
  if (state.alertData) updateHeroAlertBanner(state.alertData);
  if (state.thermalStressData) updateThermalStressPanel(state.thermalStressData);
  if (state.forecastData) {
    updateForecastGrid(state.forecastData);
    updateHorizonAnalytics(state.forecastData, state.hourlyData);
  }
  if (state.hourlyData) updateHourlyTimelineChart(state.hourlyData);
  if (state.multiCityData) {
    updateMap(state.multiCityData);
    updateCitySidebar(state.multiCityData);
  }
  updateHydrationTarget();
}

// ========== 1. ATMOSPHERIC TELEMETRY CARDS ==========

function updateAtmosphericCards(data) {
  const current = data.current_conditions || {};
  const t = current.temperature;
  const rh = current.humidity;
  const wind = current.wind_speed;
  const windMs = current.wind_speed_ms;
  const rad = current.solar_radiation;
  const apparent = current.apparent_temperature;

  // Temperature
  const tempEl = document.getElementById('current-temp');
  if (tempEl) {
    tempEl.textContent = t != null ? (state.unit === 'F' ? (t * 9/5 + 32).toFixed(1) : t.toFixed(1)) : '--';
  }
  const apparentBadge = document.getElementById('apparent-temp-badge');
  if (apparentBadge) {
    apparentBadge.textContent = apparent != null ? `Feels like ${formatTemp(apparent)}` : 'Feels like --';
  }

  // Humidity & Dew Point
  const humEl = document.getElementById('current-humidity');
  if (humEl) humEl.textContent = rh != null ? Math.round(rh) : '--';
  const dewPt = data.indices?.dew_point;
  const dewBadge = document.getElementById('dewpoint-mini-badge');
  if (dewBadge) dewBadge.textContent = dewPt != null ? `Dew point ${formatTemp(dewPt)}` : 'Dew point --';

  // Wind Convection (Clean 1-decimal formatting, no 1.44444... bug)
  const windEl = document.getElementById('current-wind');
  if (windEl) windEl.textContent = wind != null ? wind.toFixed(1) : '--';
  const windBadge = document.getElementById('wind-ms-badge');
  if (windBadge) {
    const formattedMs = windMs != null ? Number(windMs).toFixed(1) : (wind != null ? (wind / 3.6).toFixed(1) : '--');
    windBadge.textContent = `${formattedMs} m/s`;
  }

  // Solar Radiation Flux
  const radEl = document.getElementById('current-radiation');
  if (radEl) radEl.textContent = rad != null ? Math.round(rad) : '0';
  const uvBadge = document.getElementById('uv-badge');
  if (uvBadge) {
    if (rad > 750) uvBadge.textContent = 'Extreme solar flux';
    else if (rad > 450) uvBadge.textContent = 'High solar flux';
    else if (rad > 150) uvBadge.textContent = 'Moderate flux';
    else uvBadge.textContent = 'Low / Night flux';
  }
}

// ========== 2. HERO HEAT THREAT ALERT BANNER ==========

function updateHeroAlertBanner(alert) {
  const banner = document.getElementById('alert-banner');
  const level = alert.level || 'green';
  const levelNum = alert.level_num || (level === 'green' ? 1 : level === 'yellow' ? 2 : level === 'orange' ? 3 : 4);
  
  // Set dynamic body ambient theme & alert card CSS class
  document.body.className = `theme-ambient-${level}`;
  if (banner) banner.className = `hero-threat-card alert-${level}`;

  // 1. Radial Gauge Arc & Readout (Severity Visualizer)
  const gaugeArc = document.getElementById('gauge-arc') || document.getElementById('radial-gauge-arc');
  const gaugeVal = document.getElementById('gauge-main-val') || document.getElementById('radial-gauge-value');
  const gaugeTier = document.getElementById('gauge-tier-kicker') || document.getElementById('radial-gauge-tier');
  const gaugeTemp = document.getElementById('gauge-sub-temp');
  const gaugeBeacon = document.getElementById('gauge-beacon');

  if (gaugeVal) gaugeVal.textContent = `STAGE ${levelNum}`;
  if (gaugeTier) gaugeTier.textContent = `LEVEL ${levelNum} OF 4`;

  // 270 degree arc on r=54 circle => circumference = 2 * PI * 54 = 339.3; 270 deg is 254.5
  const totalArc = 254.5;
  const circumference = 339.3;
  const fillFraction = Math.min(Math.max(levelNum / 4, 0.25), 1.0);
  const activeDash = (totalArc * fillFraction).toFixed(1);

  let tierColor = '#10b981'; // Green
  let textColor = '#34d399';
  let badgeBg = 'rgba(16, 185, 129, 0.12)';
  let badgeBorder = 'rgba(16, 185, 129, 0.35)';

  if (level === 'yellow') {
    tierColor = '#eab308';
    textColor = '#fbbf24';
    badgeBg = 'rgba(245, 158, 11, 0.12)';
    badgeBorder = 'rgba(245, 158, 11, 0.35)';
  } else if (level === 'orange') {
    tierColor = '#f97316';
    textColor = '#fb923c';
    badgeBg = 'rgba(249, 115, 22, 0.15)';
    badgeBorder = 'rgba(249, 115, 22, 0.4)';
  } else if (level === 'red' || level === 'dark-red') {
    tierColor = '#ef4444';
    textColor = '#f87171';
    badgeBg = 'rgba(239, 68, 68, 0.18)';
    badgeBorder = 'rgba(239, 68, 68, 0.45)';
  }

  if (gaugeArc) {
    gaugeArc.style.stroke = tierColor;
    gaugeArc.setAttribute('stroke-dasharray', `${activeDash} ${circumference}`);
  }
  if (gaugeBeacon) {
    gaugeBeacon.style.backgroundColor = tierColor;
    gaugeBeacon.style.boxShadow = `0 0 10px 2px ${tierColor}`;
  }

  const hiVal = state.thermalStressData?.indices?.heat_index;
  const currentTemp = hiVal || state.weatherData?.main?.temp || 35.3;
  if (gaugeTemp) {
    gaugeTemp.textContent = formatTemp(currentTemp);
  }

  // Update Matrix Legend Ticks (L1-L4)
  const legendTicks = document.querySelectorAll('.threat-matrix-legend .legend-tick');
  if (legendTicks && legendTicks.length > 0) {
    legendTicks.forEach((tick, idx) => {
      if (idx + 1 === levelNum) {
        tick.classList.add('active');
        tick.style.color = tierColor;
        tick.style.borderColor = badgeBorder;
      } else {
        tick.classList.remove('active');
        tick.style.borderColor = '';
      }
    });
  }

  // Pinned Status Badge beneath Gauge
  const threatTag = document.getElementById('threat-level-tag');
  if (threatTag) {
    let titleText = alert.title || (levelNum === 1 ? 'Normal Conditions' : levelNum === 2 ? 'Yellow Heat Advisory' : levelNum === 3 ? 'Orange Warning' : 'Red Emergency');
    titleText = titleText.replace(/^stage\s*\d+[:\-•\s]*/i, '').trim();
    threatTag.innerHTML = `<span class="badge-beacon-dot" style="background:${tierColor};box-shadow:0 0 8px ${tierColor};"></span><span>Stage ${levelNum}: ${titleText}</span>`;
    threatTag.style.color = textColor;
    threatTag.style.backgroundColor = badgeBg;
    threatTag.style.borderColor = badgeBorder;
  }

  // Update Top HUD tags
  const hudCode = document.querySelector('.hud-code-tag');
  if (hudCode) {
    hudCode.textContent = `STAGE-0${levelNum} // ${level.toUpperCase()} PROTOCOL ACTIVE`;
    hudCode.style.color = textColor;
  }
  const hudRadar = document.querySelector('.hud-pulse-radar');
  if (hudRadar) {
    hudRadar.style.backgroundColor = tierColor;
    hudRadar.style.boxShadow = `0 0 10px 2px ${tierColor}`;
  }

  // 2. Metadata Chips: Location, Live Time, Streak
  const locEl = document.getElementById('location-name');
  if (locEl && state.locationName) {
    locEl.textContent = state.locationName;
  }

  const timeEl = document.getElementById('update-time');
  if (timeEl) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    timeEl.textContent = `Live: ${timeStr} Local`;
  }

  const hwBadge = document.getElementById('heatwave-badge');
  const hw = alert.heatwave_detection || {};
  if (hwBadge) {
    const streakDays = hw.consecutive_days || 3;
    if (hw.is_heatwave) {
      hwBadge.innerHTML = `<svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg> <span class="hw-status-inner">${streakDays}d Streak</span>`;
      hwBadge.style.display = 'inline-flex';
      hwBadge.style.background = 'rgba(245, 158, 11, 0.12)';
      hwBadge.style.borderColor = 'rgba(245, 158, 11, 0.35)';
      hwBadge.style.color = '#fbbf24';
    } else {
      hwBadge.innerHTML = `<svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg> <span class="hw-status-inner">Nominal Baseline</span>`;
      hwBadge.style.display = 'inline-flex';
      hwBadge.style.background = 'rgba(16, 185, 129, 0.12)';
      hwBadge.style.borderColor = 'rgba(16, 185, 129, 0.3)';
      hwBadge.style.color = '#6ee7b7';
    }
  }

  // 3. Narrative Headline & Impact Message
  const alertTitle = document.getElementById('alert-title');
  if (alertTitle) {
    let cleanTitle = alert.title || 'STAGE 2: YELLOW HEAT ADVISORY';
    if (!cleanTitle.toUpperCase().startsWith('STAGE')) {
      cleanTitle = `STAGE ${levelNum}: ${cleanTitle}`;
    }
    alertTitle.textContent = cleanTitle.toUpperCase();
  }

  const alertMsg = document.getElementById('alert-message');
  if (alertMsg) alertMsg.textContent = alert.message || 'Elevated thermal stress. Fatigue possible with prolonged outdoor exertion.';

  // 4. 48H Horizon Panel
  const horizon = alert.lead_time_horizon || state.forecastData?.lead_times || {};
  const peakHI = horizon.predicted_peak_hi != null ? horizon.predicted_peak_hi : state.forecastData?.peak_projections_48h?.peak_heat_index?.value;
  const dangerLeadHours = horizon.danger_lead_hours;

  const leadBadge = document.getElementById('hero-leadtime-badge');
  const leadStatus = document.getElementById('hero-leadtime-status');
  const leadPeak = document.getElementById('hero-leadtime-peak');
  const leadWindow = document.getElementById('hero-leadtime-window');
  const leadBurden = document.getElementById('hero-leadtime-burden');

  if (leadBadge && leadStatus) {
    if (alert.is_early_warning) {
      leadBadge.className = 'leadtime-badge-pill status-early-warning';
      leadBadge.innerHTML = `<svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> <span id="hero-leadtime-status">Early Warning: ${horizon.lead_time_tag || `T-${dangerLeadHours}h to Danger`}</span>`;
    } else if (horizon.is_active_danger_now) {
      leadBadge.className = 'leadtime-badge-pill status-danger';
      leadBadge.innerHTML = `<svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none"><path d="M12 2c1 3 4 5 4 9a6 6 0 0 1-12 0c0-4 3-6 4-9 1 2 2 3 4 0z"/></svg> <span id="hero-leadtime-status">Active Crisis: Severe Thermal Stress</span>`;
    } else {
      leadBadge.className = 'leadtime-badge-pill';
      leadBadge.innerHTML = `<svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg> <span id="hero-leadtime-status">Nominal: 48H Thermal Stress Contained</span>`;
    }
  }

  if (leadPeak) {
    const peakLead = horizon.predicted_peak_lead_hours != null ? ` (+${horizon.predicted_peak_lead_hours}h)` : ' (+38h)';
    leadPeak.textContent = `${formatTemp(peakHI != null ? peakHI : 37.6)}${peakLead}`;
  }
  if (leadWindow) {
    let winText = horizon.danger_duration_hours ? `${horizon.danger_duration_hours}h continuous` : (horizon.danger_window_text || 'None in 48h');
    if (winText.toLowerCase().includes('no danger') || winText.toLowerCase().includes('no breach') || winText.toLowerCase().includes('nominal')) {
      winText = 'None in 48h';
    }
    leadWindow.textContent = winText;
  }
  if (leadBurden) {
    const burdenVal = horizon.thermal_burden_degree_hours_48h != null ? horizon.thermal_burden_degree_hours_48h : (state.forecastData?.exposure_windows?.thermal_burden_degree_hours_48h || 0);
    leadBurden.textContent = `${burdenVal} °C·hr`;
  }

  // 5. 2x2 Telemetry Metrics
  const wbgtVal = state.thermalStressData?.indices?.wbgt;
  const heroHi = document.getElementById('hero-stat-hi');
  const heroWbgt = document.getElementById('hero-stat-wbgt');
  if (heroHi) heroHi.textContent = formatTemp(hiVal != null ? hiVal : 35.3);
  if (heroWbgt) heroWbgt.textContent = formatTemp(wbgtVal != null ? wbgtVal : 27.1);

  const heroPeak = document.getElementById('hero-stat-peak');
  if (heroPeak) heroPeak.textContent = formatTemp(peakHI != null ? peakHI : 37.6);

  const heroLeadTime = document.getElementById('hero-stat-leadtime');
  if (heroLeadTime) {
    if (dangerLeadHours === 0) {
      heroLeadTime.textContent = 'ACTIVE';
      heroLeadTime.className = 'micro-card-val text-red tabular-num';
    } else if (dangerLeadHours != null) {
      heroLeadTime.textContent = `T-${dangerLeadHours}h`;
      heroLeadTime.className = dangerLeadHours <= 12 ? 'micro-card-val text-orange tabular-num' : 'micro-card-val text-cyan tabular-num';
    } else {
      heroLeadTime.textContent = 'Clear 48h';
      heroLeadTime.className = 'micro-card-val text-emerald tabular-num';
    }
  }

  // Recommendations Checklist
  const recContainer = document.getElementById('recommendations-list');
  if (recContainer && alert.recommendations && alert.recommendations.length > 0) {
    recContainer.innerHTML = '<ul>' + alert.recommendations.map(r => `<li><div>${r}</div></li>`).join('') + '</ul>';
  }

  // Vulnerable Populations Guidance
  const vulContainer = document.getElementById('vulnerable-groups');
  if (vulContainer && alert.vulnerable_populations && alert.vulnerable_populations.length > 0) {
    vulContainer.innerHTML = '<ul>' + alert.vulnerable_populations.map(g => `
      <li>
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="#f59e0b" stroke-width="2" fill="none" style="flex-shrink:0; margin-top:2px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <div style="flex:1;">
          <div class="vulnerable-group-title">
            <span>${g.group}</span>
          </div>
          <div class="vulnerable-group-desc">${g.advice}</div>
        </div>
      </li>
    `).join('') + '</ul>';
  }
}

// ========== 3. THERMAL STRESS PANEL & BIOMETEOROLOGICAL STRAIN GAUGE WHEEL ==========

const STRAIN_MODELS = {
  heat_index: {
    id: 'heat_index',
    name: 'Heat Index',
    shortName: 'Heat Index',
    fullName: 'NOAA Heat Index',
    sub: 'NOAA Multi-Polynomial Steadman Model',
    cardId: 'card-idx-hi',
    btnId: 'btn-model-hi',
    minC: 20,
    maxC: 60,
    minF: 68,
    maxF: 140,
    tickStepsC: [20, 30, 40, 50, 60],
    tickStepsF: [68, 86, 104, 122, 140],
    defaultVal: 28,
    classify: (valC) => {
      if (valC < 27.0) return { category: 'Normal', color: '#10b981', impact: 'Thermo-Equilibrium', hydration: '250 mL/h', workRest: 'Continuous', statement: 'Thermal equilibrium maintained. Standard evaporative heat dissipation with minimal cardiac strain.' };
      if (valC < 32.0) return { category: 'Caution', color: '#eab308', impact: 'Mild Exertion', hydration: '500 mL/h', workRest: '50m / 10m', statement: 'Mild thermoregulatory strain. Prolonged physical exertion may induce fatigue and early dehydration.' };
      if (valC < 41.0) return { category: 'Extreme Caution', color: '#f97316', impact: 'Moderate Strain', hydration: '750 mL/h', workRest: '40m / 20m', statement: 'Substantial cardiovascular strain. Heat cramps and heat exhaustion possible with activity. Maintain scheduled hydration.' };
      if (valC < 54.0) return { category: 'Danger', color: '#ef4444', impact: 'Severe Burden', hydration: '1000 mL/h', workRest: '30m / 30m', statement: 'Severe thermoregulatory impairment. Heat exhaustion likely; rapid progression to heat stroke. Limit outdoor labor.' };
      return { category: 'Extreme Danger', color: '#b91c1c', impact: 'Lethal Hazard', hydration: '1200+ mL/h', workRest: 'Mandatory Stop', statement: 'Imminent risk of heat stroke and cardiovascular collapse. Core body cooling critical. Mandatory indoor shelter.' };
    }
  },
  wbgt: {
    id: 'wbgt',
    name: 'WBGT',
    shortName: 'WBGT Outdoor',
    fullName: 'Wet-Bulb Globe Temp (ISO 7243)',
    sub: 'ISO 7243 Environmental Occupational Heat Stress',
    cardId: 'card-idx-wbgt',
    btnId: 'btn-model-wbgt',
    minC: 15,
    maxC: 35,
    minF: 59,
    maxF: 95,
    tickStepsC: [15, 20, 25, 30, 35],
    tickStepsF: [59, 68, 77, 86, 95],
    defaultVal: 24,
    classify: (valC) => {
      if (valC < 18.0) return { category: 'No Risk', color: '#10b981', impact: 'Baseline Load', hydration: '250 mL/h', workRest: 'Continuous', statement: 'Normal occupational baseline. Unrestricted labor, athletics, and industrial outdoor activities allowed.' };
      if (valC < 23.0) return { category: 'Low Stress', color: '#22c55e', impact: 'Discretionary', hydration: '500 mL/h', workRest: '50m / 10m', statement: 'Low occupational thermal strain. Discretionary pacing for heavy labor and unacclimatized personnel.' };
      if (valC < 28.0) return { category: 'Moderate', color: '#eab308', impact: 'Paced Labor', hydration: '750 mL/h', workRest: '45m / 15m', statement: 'Moderate occupational heat stress. Work/rest cycle enforced. Provide designated shaded cool rest zones.' };
      if (valC < 32.0) return { category: 'High Stress', color: '#f97316', impact: 'Restricted', hydration: '1000 mL/h', workRest: '30m / 30m', statement: 'High occupational heat stress. Restrict heavy physical exertion. Strict 30 min work / 30 min rest schedule.' };
      return { category: 'Extreme Strain', color: '#ef4444', impact: 'Critical Hazard', hydration: '1200 mL/h', workRest: 'Cease Heavy Labor', statement: 'Extreme occupational heat hazard. Cessation of unacclimatized outdoor labor and strenuous athletic activities.' };
    }
  },
  utci: {
    id: 'utci',
    name: 'UTCI',
    shortName: 'UTCI Index',
    fullName: 'Universal Thermal Climate Index',
    sub: 'Fiala Multi-Node Dynamic Thermoregulation Model',
    cardId: 'card-idx-utci',
    btnId: 'btn-model-utci',
    minC: 10,
    maxC: 50,
    minF: 50,
    maxF: 122,
    tickStepsC: [10, 20, 30, 40, 50],
    tickStepsF: [50, 68, 86, 104, 122],
    defaultVal: 26,
    classify: (valC) => {
      if (valC < 26.0) return { category: 'No Stress', color: '#10b981', impact: 'Thermo-Neutral', hydration: '250 mL/h', workRest: 'Continuous', statement: 'Comfortable thermo-neutral state. Dynamic peripheral vascular regulation balanced at 37°C core setpoint.' };
      if (valC < 32.0) return { category: 'Moderate Stress', color: '#eab308', impact: 'Sweat Activated', hydration: '500 mL/h', workRest: '50m / 10m', statement: 'Moderate heat stress on human thermoregulatory system. Sweating response and skin vasodilation initiated.' };
      if (valC < 38.0) return { category: 'Strong Stress', color: '#f97316', impact: 'Cardiovascular', hydration: '750 mL/h', workRest: '40m / 20m', statement: 'Strong heat stress. Elevating core body temperature and heart rate. Impaired mental vigilance and physical stamina.' };
      if (valC < 46.0) return { category: 'Very Strong', color: '#ef4444', impact: 'Hyperthermia', hydration: '1000 mL/h', workRest: '20m / 40m', statement: 'Very strong thermal stress. Core body temperature elevation expected with prolonged exposure.' };
      return { category: 'Extreme Stress', color: '#b91c1c', impact: 'Organ Damage', hydration: '1200+ mL/h', workRest: 'Immediate Shelter', statement: 'Extreme physiological thermal stress. Regulatory failure threshold with acute risk of heat-induced cellular damage.' };
    }
  },
  wet_bulb: {
    id: 'wet_bulb',
    name: 'Wet Bulb',
    shortName: 'Wet-Bulb Limit',
    fullName: 'Wet-Bulb Temperature',
    sub: 'Thermodynamic Evaporative Human Survival Boundary',
    cardId: 'card-idx-wetbulb',
    btnId: 'btn-model-wetbulb',
    minC: 15,
    maxC: 35,
    minF: 59,
    maxF: 95,
    tickStepsC: [15, 20, 25, 30, 35],
    tickStepsF: [59, 68, 77, 86, 95],
    defaultVal: 21,
    classify: (valC) => {
      if (valC < 27.0) return { category: 'Manageable', color: '#10b981', impact: 'Evaporative Clear', hydration: '250 mL/h', workRest: 'Continuous', statement: 'Evaporative perspiration cooling fully effective. Vapor pressure gradient permits adequate skin cooling.' };
      if (valC < 31.0) return { category: 'High Stress', color: '#f97316', impact: 'Impaired Cooling', hydration: '750 mL/h', workRest: '45m / 15m', statement: 'Reduced evaporative cooling efficiency. High humidity significantly slows skin surface perspiration dissipation.' };
      if (valC < 35.0) return { category: 'Critical Danger', color: '#ef4444', impact: 'Core Drift Up', hydration: '1000 mL/h', workRest: '20m / 40m', statement: 'Critical thermodynamic boundary. Sweat cannot evaporate effectively. Core temperature rises even when resting in shade.' };
      return { category: 'Lethal Limit', color: '#b91c1c', impact: 'Survival Boundary', hydration: 'Emergency AC', workRest: 'Mandatory Cessation', statement: 'Theoretical thermodynamic limit of human survival (35°C Tw). Fatal hyperthermia risk without active mechanical air conditioning.' };
    }
  },
  humidex: {
    id: 'humidex',
    name: 'Humidex',
    shortName: 'Canadian Humidex',
    fullName: 'Canadian Humidex',
    sub: 'Vapor Pressure Discomfort Scale (Masterton & Richardson)',
    cardId: 'card-idx-humidex',
    btnId: 'btn-model-humidex',
    minC: 20,
    maxC: 60,
    minF: 68,
    maxF: 140,
    tickStepsC: [20, 30, 40, 50, 60],
    tickStepsF: [68, 86, 104, 122, 140],
    defaultVal: 30,
    classify: (valC) => {
      if (valC < 30.0) return { category: 'Comfortable', color: '#10b981', impact: 'Low Mugginess', hydration: '250 mL/h', workRest: 'Continuous', statement: 'Little to no perceived mugginess. Normal respiratory comfort and standard atmospheric conditions.' };
      if (valC < 40.0) return { category: 'Some Discomfort', color: '#eab308', impact: 'Noticeable Muggy', hydration: '500 mL/h', workRest: '50m / 10m', statement: 'Noticeable discomfort and clamminess. Moderation of strenuous exertion and scheduled fluid intake advised.' };
      if (valC < 45.0) return { category: 'Great Discomfort', color: '#f97316', impact: 'Heavy Mugginess', hydration: '750 mL/h', workRest: '35m / 25m', statement: 'Great discomfort. Avoid non-essential outdoor exertion; ensure adequate ventilation and continuous hydration.' };
      return { category: 'Dangerous', color: '#ef4444', impact: 'Severe Humid Load', hydration: '1000 mL/h', workRest: 'Limit Exposure', statement: 'Dangerous humidity levels. Impaired evaporative cooling with high probability of heat cramps, exhaustion, and dizziness.' };
    }
  },
  dew_point: {
    id: 'dew_point',
    name: 'Dew Point',
    shortName: 'Dew Point',
    fullName: 'Saturation Dew Point',
    sub: 'Magnus-Tetens Atmospheric Moisture Saturation',
    cardId: 'card-idx-dewpoint',
    btnId: 'btn-model-dewpoint',
    minC: 10,
    maxC: 30,
    minF: 50,
    maxF: 86,
    tickStepsC: [10, 15, 20, 25, 30],
    tickStepsF: [50, 59, 68, 77, 86],
    defaultVal: 18,
    classify: (valC) => {
      if (valC < 15.0) return { category: 'Comfortable', color: '#10b981', impact: 'Crisp & Dry', hydration: '250 mL/h', workRest: 'Continuous', statement: 'Optimal sweat vapor dissipation. Atmospheric moisture comfortably below human perspiration thresholds.' };
      if (valC < 20.0) return { category: 'Humid', color: '#eab308', impact: 'Clammy Skin', hydration: '500 mL/h', workRest: '50m / 10m', statement: 'Noticeable ambient moisture. Skin feels clammy during physical activity as evaporative rate begins to decline.' };
      if (valC < 24.0) return { category: 'Muggy', color: '#f97316', impact: 'Sticky Air', hydration: '750 mL/h', workRest: '40m / 20m', statement: 'Sticky, humid atmosphere. Perspiration clings to clothing and skin with sluggish natural cooling.' };
      return { category: 'Oppressive', color: '#ef4444', impact: 'Tropical Saturation', hydration: '1000 mL/h', workRest: 'Strict Rest Cycles', statement: 'Severe tropical saturation boundary. Human perspiration cannot evaporate efficiently; stay in air-conditioned environments.' };
    }
  }
};

function switchStrainModel(modelKey) {
  if (!STRAIN_MODELS[modelKey]) return;
  state.selectedStrainModel = modelKey;
  state.isGaugeSimulated = false;
  state.simulatedValue = null;
  if (state.thermalStressData) {
    updateThermalStressPanel(state.thermalStressData);
  }
}

function updateThermalStressPanel(data) {
  if (!data) return;
  const idx = data.indices || {};
  const cls = idx.classifications || {};

  const setTile = (valId, statusId, val, classification) => {
    const valEl = document.getElementById(valId);
    const statusEl = document.getElementById(statusId);
    if (valEl) valEl.textContent = formatTemp(val);
    if (statusEl && classification) {
      statusEl.textContent = classification.category || '--';
      statusEl.style.color = classification.color || 'var(--accent-primary)';
    }
  };

  setTile('idx-heat-index', 'idx-heat-index-status', idx.heat_index, cls.heat_index);
  setTile('idx-wbgt', 'idx-wbgt-status', idx.wbgt, cls.wbgt);
  setTile('idx-utci', 'idx-utci-status', idx.utci, cls.utci);
  setTile('idx-humidex', 'idx-humidex-status', idx.humidex, cls.humidex);
  setTile('idx-wetbulb', 'idx-wetbulb-status', idx.wet_bulb, cls.wet_bulb);

  // Dew point
  const dewEl = document.getElementById('idx-dewpoint');
  const dewStatusEl = document.getElementById('idx-dewpoint-status');
  if (dewEl) dewEl.textContent = formatTemp(idx.dew_point);
  if (dewStatusEl && idx.dew_point != null) {
    if (idx.dew_point >= 24) { dewStatusEl.textContent = 'Oppressive'; dewStatusEl.style.color = '#ef4444'; }
    else if (idx.dew_point >= 20) { dewStatusEl.textContent = 'Muggy'; dewStatusEl.style.color = '#f97316'; }
    else if (idx.dew_point >= 15) { dewStatusEl.textContent = 'Humid'; dewStatusEl.style.color = '#f59e0b'; }
    else { dewStatusEl.textContent = 'Comfortable'; dewStatusEl.style.color = '#10b981'; }
  }

  // Update Biometeorological Strain Gauge Wheel
  updateBiometGaugeWheel(idx);
}

// ---------------------------------------------------------------------------
// BIOMETEOROLOGICAL STRAIN GAUGE WHEEL ENGINE & HIGH-PRECISION ANIMATOR
// ---------------------------------------------------------------------------
const biometGaugeAnim = {
  currentValC: null,
  targetValC: null,
  currentAngle: -90,
  targetAngle: -90,
  currentFraction: 0,
  targetFraction: 0,
  currentColor: '#10b981',
  targetColor: '#10b981',
  rafId: null,
  isDragging: false,
  isDemoPlaying: false,
  demoTimer: null,
  hasCalibrated: false
};

function triggerHubRipple(color = '#38bdf8') {
  const ripple = document.getElementById('gauge-hub-ripple');
  if (!ripple) return;
  ripple.setAttribute('stroke', color);
  ripple.classList.remove('active-ripple');
  // Trigger DOM reflow to restart CSS keyframe animation
  void ripple.offsetWidth;
  ripple.classList.add('active-ripple');
}

function renderGaugeFrame(angle, fraction, valC, color, model) {
  const needleGroup = document.getElementById('gauge-needle-group');
  if (needleGroup) {
    needleGroup.setAttribute('transform', `rotate(${angle.toFixed(2)} 160 175)`);
    needleGroup.style.transform = `rotate(${angle.toFixed(2)}deg)`;
  }

  // Active sweep arc (radius 125, circumference 392.7)
  const activeArc = document.getElementById('gauge-active-arc');
  if (activeArc) {
    const sweepLen = Math.max(0, Math.min(392.7, 392.7 * fraction));
    activeArc.setAttribute('stroke-dasharray', `${sweepLen.toFixed(1)} 400`);
    activeArc.setAttribute('stroke', color);
  }

  // Dynamic Glowing Comet Tip Bead positioned along the curve
  const tipGroup = document.getElementById('gauge-tip-group');
  const tipHalo = document.getElementById('gauge-arc-tip-halo');
  const tipDot = document.getElementById('gauge-arc-tip');
  if (tipGroup && tipHalo && tipDot) {
    if (fraction > 0.005) {
      const tipX = 160 - 125 * Math.cos(fraction * Math.PI);
      const tipY = 175 - 125 * Math.sin(fraction * Math.PI);
      tipHalo.setAttribute('cx', tipX.toFixed(1));
      tipHalo.setAttribute('cy', tipY.toFixed(1));
      tipDot.setAttribute('cx', tipX.toFixed(1));
      tipDot.setAttribute('cy', tipY.toFixed(1));
      tipHalo.setAttribute('fill', color);
      tipDot.setAttribute('stroke', color);
      tipGroup.setAttribute('opacity', '1');
    } else {
      tipGroup.setAttribute('opacity', '0');
    }
  }

  // Metallic Hub and Needle Spine Accents
  const hubPin = document.getElementById('gauge-hub-pin');
  const hubOuter = document.getElementById('gauge-hub-outer');
  const needleGlow = document.getElementById('gauge-needle-glow');
  const needleSpine = document.getElementById('gauge-needle-spine');
  if (hubPin) hubPin.setAttribute('fill', color);
  if (hubOuter) hubOuter.setAttribute('stroke', color);
  if (needleGlow) needleGlow.setAttribute('fill', color);
  if (needleSpine) needleSpine.setAttribute('stroke', color);

  // Dynamic Scale Ticks - Highlight Active Segment
  const activeTickIndex = Math.max(0, Math.min(4, Math.round(fraction * 4)));
  for (let i = 0; i < 5; i++) {
    const tickEl = document.getElementById(`gauge-tick-${i}`);
    if (tickEl) {
      tickEl.classList.toggle('active-tick', i === activeTickIndex);
    }
  }

  // Formatted numeric readout
  const displayVal = state.unit === 'F' ? (valC * 9/5 + 32).toFixed(1) : valC.toFixed(1);
  const valText = document.getElementById('gauge-value-text');
  const largeVal = document.getElementById('gauge-heat-index');
  if (valText) valText.textContent = displayVal;
  if (largeVal) largeVal.textContent = displayVal;
}

function updateBiometGaugeWheel(idx, options = {}) {
  const modelKey = state.selectedStrainModel || 'heat_index';
  const model = STRAIN_MODELS[modelKey] || STRAIN_MODELS.heat_index;

  // Highlight active model nav button
  document.querySelectorAll('.model-nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.model === modelKey);
  });

  // Highlight active index card in grid
  document.querySelectorAll('.index-card').forEach(card => {
    card.classList.remove('active-strain-card');
  });
  const activeCard = document.getElementById(model.cardId);
  if (activeCard) activeCard.classList.add('active-strain-card');

  // Update subtitle
  const subEl = document.getElementById('gauge-model-sub');
  if (subEl) subEl.textContent = model.sub;

  // Retrieve raw Celsius value for active model
  let rawValC = null;
  if (modelKey === 'heat_index') rawValC = idx?.heat_index;
  else if (modelKey === 'wbgt') rawValC = idx?.wbgt;
  else if (modelKey === 'utci') rawValC = idx?.utci;
  else if (modelKey === 'wet_bulb') rawValC = idx?.wet_bulb;
  else if (modelKey === 'humidex') rawValC = idx?.humidex;
  else if (modelKey === 'dew_point') rawValC = idx?.dew_point;

  if (rawValC == null || isNaN(rawValC)) rawValC = model.defaultVal;

  // If user is actively scrubbing / simulated
  const isSim = Boolean(state.isGaugeSimulated && state.simulatedValue != null);
  const targetValC = isSim ? state.simulatedValue : rawValC;

  const info = model.classify(targetValC);
  const targetColor = info.color;

  // Map targetValC to angle between -90° and +90°
  const minC = model.minC;
  const maxC = model.maxC;
  const clampedC = Math.max(minC, Math.min(maxC, targetValC));
  const targetFraction = (clampedC - minC) / (maxC - minC);
  const targetAngle = targetFraction * 180 - 90;

  // Update scale tick labels based on current unit
  const tickSteps = state.unit === 'F' ? model.tickStepsF : model.tickStepsC;
  for (let i = 0; i < 5; i++) {
    const tickEl = document.getElementById(`gauge-tick-${i}`);
    if (tickEl && tickSteps[i] != null) {
      tickEl.textContent = `${tickSteps[i]}°`;
    }
  }

  // Update textual readouts & statuses
  const unitText = document.getElementById('gauge-unit-text');
  const labelText = document.getElementById('gauge-label-text');
  if (unitText) unitText.textContent = `°${state.unit} ${model.shortName}`;
  if (labelText) {
    labelText.textContent = info.category.toUpperCase();
    labelText.style.fill = targetColor;
  }

  // Status badges & Interactive reset controls
  const badgePill = document.getElementById('gauge-badge-pill');
  const resetBtn = document.getElementById('gauge-reset-btn');
  const hintDot = document.getElementById('gauge-hint-dot');
  const hintText = document.getElementById('gauge-hint-text');

  const displayVal = state.unit === 'F' ? (targetValC * 9/5 + 32).toFixed(1) : targetValC.toFixed(1);

  if (isSim) {
    if (badgePill) {
      badgePill.textContent = `SIMULATED: ${info.category.toUpperCase()}`;
      badgePill.style.background = targetColor;
    }
    if (resetBtn) resetBtn.classList.remove('hidden');
    if (hintDot) hintDot.classList.add('simulated');
    if (hintText) hintText.textContent = `Simulated ${model.shortName}: ${displayVal}°${state.unit} — Click Live Sync to restore real telemetry`;
  } else {
    if (badgePill) {
      badgePill.textContent = info.category.toUpperCase();
      badgePill.style.background = targetColor;
    }
    if (resetBtn) resetBtn.classList.add('hidden');
    if (hintDot) hintDot.classList.remove('simulated');
    if (hintText) hintText.textContent = `Interactive Dial — Click or drag to test physiological thresholds`;
  }

  // Summary box readouts
  const largeUnit = document.getElementById('unit-label-gauge');
  const catPill = document.getElementById('gauge-category-pill');
  const statementEl = document.getElementById('gauge-statement');

  if (largeUnit) largeUnit.textContent = `°${state.unit}`;
  if (catPill) {
    catPill.textContent = info.category;
    catPill.style.color = targetColor;
    catPill.style.borderColor = targetColor;
    catPill.style.backgroundColor = `${targetColor}1f`;
  }
  if (statementEl) statementEl.textContent = info.statement;

  // Clinical metrics grid
  const impactEl = document.getElementById('gauge-impact-metric');
  const hydrationEl = document.getElementById('gauge-hydration-metric');
  const workrestEl = document.getElementById('gauge-workrest-metric');

  if (impactEl) {
    impactEl.textContent = info.impact;
    impactEl.style.color = targetColor;
  }
  if (hydrationEl) hydrationEl.textContent = info.hydration;
  if (workrestEl) workrestEl.textContent = info.workRest;

  // ANIMATION DISPATCH: Direct instant render vs Smooth Spring Transition
  if (options.instant || biometGaugeAnim.isDragging) {
    if (biometGaugeAnim.rafId) {
      cancelAnimationFrame(biometGaugeAnim.rafId);
      biometGaugeAnim.rafId = null;
    }
    biometGaugeAnim.currentAngle = targetAngle;
    biometGaugeAnim.currentFraction = targetFraction;
    biometGaugeAnim.currentValC = targetValC;
    biometGaugeAnim.currentColor = targetColor;
    renderGaugeFrame(targetAngle, targetFraction, targetValC, targetColor, model);
    return;
  }

  // If first run, initialize smoothly from minimum or previous value
  if (biometGaugeAnim.currentValC == null) {
    biometGaugeAnim.currentValC = Math.max(minC, targetValC - 10);
    biometGaugeAnim.currentFraction = Math.max(0, (biometGaugeAnim.currentValC - minC) / (maxC - minC));
    biometGaugeAnim.currentAngle = biometGaugeAnim.currentFraction * 180 - 90;
  }

  // Smooth RAF Animation with Spring Settle
  if (biometGaugeAnim.rafId) {
    cancelAnimationFrame(biometGaugeAnim.rafId);
  }

  const startAngle = biometGaugeAnim.currentAngle;
  const startFraction = biometGaugeAnim.currentFraction;
  const startVal = biometGaugeAnim.currentValC;
  const startTime = performance.now();
  const duration = options.duration || 680;

  function animStep(now) {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);
    // Smooth cubic ease out with slight elastic settle
    const ease = 1 - Math.pow(1 - progress, 3);
    const curAngle = startAngle + (targetAngle - startAngle) * ease;
    const curFraction = Math.max(0, Math.min(1, startFraction + (targetFraction - startFraction) * ease));
    const curVal = startVal + (targetValC - startVal) * ease;

    biometGaugeAnim.currentAngle = curAngle;
    biometGaugeAnim.currentFraction = curFraction;
    biometGaugeAnim.currentValC = curVal;

    renderGaugeFrame(curAngle, curFraction, curVal, targetColor, model);

    if (progress < 1) {
      biometGaugeAnim.rafId = requestAnimationFrame(animStep);
    } else {
      biometGaugeAnim.currentAngle = targetAngle;
      biometGaugeAnim.currentFraction = targetFraction;
      biometGaugeAnim.currentValC = targetValC;
      biometGaugeAnim.currentColor = targetColor;
      biometGaugeAnim.rafId = null;
      renderGaugeFrame(targetAngle, targetFraction, targetValC, targetColor, model);
      triggerHubRipple(targetColor);
      if (options.onComplete) options.onComplete();
    }
  }

  biometGaugeAnim.rafId = requestAnimationFrame(animStep);
}

function triggerGaugeCalibration() {
  if (biometGaugeAnim.isDemoPlaying || biometGaugeAnim.isDragging) return;
  const modelKey = state.selectedStrainModel || 'heat_index';
  const model = STRAIN_MODELS[modelKey] || STRAIN_MODELS.heat_index;
  
  // Quick instrument boot calibration sweep: -90 deg -> +90 deg -> target
  const initialTarget = (state.thermalStressData?.indices?.[modelKey]) || model.defaultVal;
  
  biometGaugeAnim.currentAngle = -90;
  biometGaugeAnim.currentFraction = 0;
  biometGaugeAnim.currentValC = model.minC;

  updateBiometGaugeWheel(state.thermalStressData?.indices || {}, { duration: 900 });
}

function playGaugeSweepDemo() {
  if (biometGaugeAnim.demoTimer) {
    clearTimeout(biometGaugeAnim.demoTimer);
    biometGaugeAnim.demoTimer = null;
  }

  const demoBtn = document.getElementById('gauge-demo-btn');
  if (biometGaugeAnim.isDemoPlaying) {
    // Stop demo and return to live
    biometGaugeAnim.isDemoPlaying = false;
    if (demoBtn) {
      demoBtn.classList.remove('is-playing');
      demoBtn.innerHTML = '<svg viewBox="0 0 24 24" width="11" height="11" stroke="currentColor" stroke-width="2.5" fill="none"><polygon points="5 3 19 12 5 21 5 3"/></svg><span>SWEEP DEMO</span>';
    }
    state.isGaugeSimulated = false;
    state.simulatedValue = null;
    updateThermalStressPanel(state.thermalStressData || { indices: {} });
    showToast('Biometeorological sweep demo stopped. Live sync restored.', 'info');
    return;
  }

  biometGaugeAnim.isDemoPlaying = true;
  if (demoBtn) {
    demoBtn.classList.add('is-playing');
    demoBtn.innerHTML = '<svg viewBox="0 0 24 24" width="11" height="11" stroke="currentColor" stroke-width="2.5" fill="none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg><span>STOP DEMO</span>';
  }

  showToast('Running animated biometeorological strain threshold demo...', 'info');

  const modelKey = state.selectedStrainModel || 'heat_index';
  const model = STRAIN_MODELS[modelKey] || STRAIN_MODELS.heat_index;
  const min = model.minC;
  const max = model.maxC;
  const range = max - min;

  // 5 progressive physiological danger steps
  const demoSteps = [
    min + range * 0.15,
    min + range * 0.38,
    min + range * 0.62,
    min + range * 0.84,
    min + range * 0.96
  ];

  let stepIdx = 0;

  function runNextStep() {
    if (!biometGaugeAnim.isDemoPlaying) return;

    if (stepIdx < demoSteps.length) {
      const simVal = Number(demoSteps[stepIdx].toFixed(1));
      state.isGaugeSimulated = true;
      state.simulatedValue = simVal;
      stepIdx++;
      updateBiometGaugeWheel(state.thermalStressData?.indices || {}, {
        duration: 750,
        onComplete: () => {
          biometGaugeAnim.demoTimer = setTimeout(runNextStep, 800);
        }
      });
    } else {
      // Finished sweep - smoothly restore real data
      biometGaugeAnim.isDemoPlaying = false;
      if (demoBtn) {
        demoBtn.classList.remove('is-playing');
        demoBtn.innerHTML = '<svg viewBox="0 0 24 24" width="11" height="11" stroke="currentColor" stroke-width="2.5" fill="none"><polygon points="5 3 19 12 5 21 5 3"/></svg><span>SWEEP DEMO</span>';
      }
      state.isGaugeSimulated = false;
      state.simulatedValue = null;
      updateThermalStressPanel(state.thermalStressData || { indices: {} });
      showToast('Completed strain sweep demonstration. Telemetry synced.', 'success');
    }
  }

  runNextStep();
}

function initStrainGaugeWheelInteraction() {
  const svg = document.getElementById('stress-gauge');
  if (!svg) return;

  function calculateAngleAndValue(clientX, clientY) {
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const svgPoint = pt.matrixTransform(ctm.inverse());

    // Dial center is (160, 175)
    const dx = svgPoint.x - 160;
    const dy = svgPoint.y - 175;

    // Angle relative to vertical: -90 deg (left), 0 deg (top), +90 deg (right)
    let deg = Math.atan2(dy, dx) * 180 / Math.PI;
    let angle = deg + 90;
    if (dy > 0) {
      angle = dx < 0 ? -90 : 90;
    }
    angle = Math.max(-90, Math.min(90, angle));

    const fraction = (angle + 90) / 180;
    const model = STRAIN_MODELS[state.selectedStrainModel] || STRAIN_MODELS.heat_index;
    const simC = model.minC + fraction * (model.maxC - model.minC);
    return { angle, simC: Number(simC.toFixed(1)) };
  }

  // Interactive Hover Reticle Guide Line
  const hoverGuide = document.getElementById('gauge-hover-needle');
  svg.addEventListener('mousemove', (e) => {
    if (biometGaugeAnim.isDragging) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const svgPoint = pt.matrixTransform(ctm.inverse());

    const dx = svgPoint.x - 160;
    const dy = svgPoint.y - 175;
    if (dy <= 15) {
      const angleRad = Math.atan2(dy, dx);
      const endX = 160 + 125 * Math.cos(angleRad);
      const endY = 175 + 125 * Math.sin(angleRad);
      if (hoverGuide) {
        hoverGuide.setAttribute('x2', endX.toFixed(1));
        hoverGuide.setAttribute('y2', endY.toFixed(1));
        hoverGuide.setAttribute('opacity', '0.55');
      }
    } else if (hoverGuide) {
      hoverGuide.setAttribute('opacity', '0');
    }
  });

  svg.addEventListener('mouseleave', () => {
    if (hoverGuide) hoverGuide.setAttribute('opacity', '0');
  });

  function handleStart(e) {
    if (biometGaugeAnim.isDemoPlaying) {
      playGaugeSweepDemo(); // cancel active demo
    }

    biometGaugeAnim.isDragging = true;
    svg.classList.add('is-dragging');
    if (hoverGuide) hoverGuide.setAttribute('opacity', '0');

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const res = calculateAngleAndValue(clientX, clientY);
    if (res != null) {
      state.isGaugeSimulated = true;
      state.simulatedValue = res.simC;
      triggerHubRipple('#38bdf8');
      updateBiometGaugeWheel(state.thermalStressData?.indices || {}, { instant: true });
    }
  }

  function handleMove(e) {
    if (!biometGaugeAnim.isDragging) return;
    if (e.cancelable) e.preventDefault();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const res = calculateAngleAndValue(clientX, clientY);
    if (res != null) {
      state.isGaugeSimulated = true;
      state.simulatedValue = res.simC;
      updateBiometGaugeWheel(state.thermalStressData?.indices || {}, { instant: true });
    }
  }

  function handleEnd() {
    if (!biometGaugeAnim.isDragging) return;
    biometGaugeAnim.isDragging = false;
    svg.classList.remove('is-dragging');
    triggerHubRipple();
    // Gentle settlement animation to current simulated value
    updateBiometGaugeWheel(state.thermalStressData?.indices || {}, { duration: 250 });
  }

  svg.addEventListener('mousedown', handleStart);
  window.addEventListener('mousemove', handleMove);
  window.addEventListener('mouseup', handleEnd);

  svg.addEventListener('touchstart', handleStart, { passive: false });
  window.addEventListener('touchmove', handleMove, { passive: false });
  window.addEventListener('touchend', handleEnd);
  window.addEventListener('touchcancel', handleEnd);

  // Model Nav Buttons click delegation
  const modelNav = document.getElementById('strain-model-nav');
  if (modelNav) {
    modelNav.addEventListener('click', (e) => {
      const btn = e.target.closest('.model-nav-btn');
      if (btn && btn.dataset.model) {
        if (biometGaugeAnim.isDemoPlaying) playGaugeSweepDemo();
        switchStrainModel(btn.dataset.model);
      }
    });
  }

  // Live Sync reset button
  const resetBtn = document.getElementById('gauge-reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (biometGaugeAnim.isDemoPlaying) playGaugeSweepDemo();
      state.isGaugeSimulated = false;
      state.simulatedValue = null;
      triggerHubRipple('#10b981');
      updateThermalStressPanel(state.thermalStressData || { indices: {} });
      showToast('Restored live biometeorological station telemetry', 'info');
    });
  }

  // Sweep Demo button
  const demoBtn = document.getElementById('gauge-demo-btn');
  if (demoBtn) {
    demoBtn.addEventListener('click', playGaugeSweepDemo);
  }

  // 6 Index cards clicking
  const cardMap = {
    'card-idx-hi': 'heat_index',
    'card-idx-wbgt': 'wbgt',
    'card-idx-utci': 'utci',
    'card-idx-wetbulb': 'wet_bulb',
    'card-idx-humidex': 'humidex',
    'card-idx-dewpoint': 'dew_point'
  };
  Object.entries(cardMap).forEach(([cardId, modelKey]) => {
    const card = document.getElementById(cardId);
    if (card) {
      card.addEventListener('click', () => {
        if (biometGaugeAnim.isDemoPlaying) playGaugeSweepDemo();
        switchStrainModel(modelKey);
      });
    }
  });
}

// ========== 4. 48-HOUR TIMELINE CHART ==========

function updateHourlyTimelineChart(hourlyData) {
  const ctx = document.getElementById('hourly-chart');
  if (!ctx || !Array.isArray(hourlyData) || hourlyData.length === 0) return;

  if (hourlyChart) {
    hourlyChart.destroy();
    hourlyChart = null;
  }

  // Filter based on 24h vs 48h range selection
  const filteredData = hourlyData.slice(0, state.chartRange);

  const labels = filteredData.map(d => formatHourlyLabel(d.time));
  const temps = filteredData.map(d => convertTemp(d.temperature));
  const heatIndices = filteredData.map(d => convertTemp(d.indices?.heat_index));
  const wbgts = filteredData.map(d => convertTemp(d.indices?.wbgt));
  const wetBulbs = filteredData.map(d => convertTemp(d.indices?.wet_bulb));

  const dangerThreshold = state.unit === 'F' ? 104 : 40; // 40°C = 104°F

  const allDatasets = [
    {
      id: 'temp',
      label: `Temperature (°${state.unit})`,
      data: temps,
      borderColor: '#FF5722',
      backgroundColor: 'rgba(255, 87, 34, 0.1)',
      fill: true,
      tension: 0.35,
      pointRadius: 2,
      pointHoverRadius: 6,
      borderWidth: 2.5
    },
    {
      id: 'hi',
      label: `Heat Index (°${state.unit})`,
      data: heatIndices,
      borderColor: '#FFC107',
      backgroundColor: 'transparent',
      fill: {
        target: { value: dangerThreshold },
        above: 'rgba(239, 68, 68, 0.25)', // Red shade for danger zone
        below: 'transparent'
      },
      borderDash: [5, 4],
      tension: 0.35,
      pointRadius: 2,
      pointHoverRadius: 6,
      borderWidth: 2.2
    },
    {
      id: 'wbgt',
      label: `WBGT (°${state.unit})`,
      data: wbgts,
      borderColor: '#0284c7',
      backgroundColor: 'transparent',
      tension: 0.35,
      pointRadius: 1.5,
      pointHoverRadius: 5,
      borderWidth: 2
    },
    {
      id: 'tw',
      label: `Wet-Bulb (°${state.unit})`,
      data: wetBulbs,
      borderColor: '#10b981',
      backgroundColor: 'transparent',
      borderDash: [3, 3],
      tension: 0.35,
      pointRadius: 1,
      pointHoverRadius: 4,
      borderWidth: 1.8
    }
  ];

  let activeDatasets = allDatasets;
  if (state.chartSeries && state.chartSeries !== 'all') {
    activeDatasets = allDatasets.filter(ds => ds.id === state.chartSeries || ds.id === 'temp');
  }

  const isLight = document.body.getAttribute('data-theme') === 'light';
  const gridColor = isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.04)';
  const tickColor = isLight ? '#64748b' : '#64748b'; // Can stay same or use '#94a3b8'
  const tooltipBg = isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(8, 16, 26, 0.95)';
  const tooltipTitle = isLight ? '#0f172a' : '#ffffff';
  const tooltipBody = isLight ? '#475569' : '#94a3b8';
  const tooltipBorder = isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)';

  hourlyChart = new Chart(ctx.getContext('2d'), {
    type: 'line',
    data: {
      labels: labels,
      datasets: activeDatasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: tooltipBg,
          titleColor: tooltipTitle,
          titleFont: { family: 'Outfit', size: 14, weight: '700' },
          bodyColor: tooltipBody,
          bodyFont: { family: 'Inter', size: 12 },
          borderColor: tooltipBorder,
          borderWidth: 1,
          padding: 14,
          cornerRadius: 12,
          displayColors: true,
          callbacks: {
            label: (context) => ` ${context.dataset.label}: ${context.parsed.y != null ? context.parsed.y.toFixed(1) : '--'}°${state.unit}`
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: tickColor,
            maxTicksLimit: state.chartRange === 24 ? 8 : 12,
            maxRotation: 0,
            font: { size: 11, family: 'Inter' }
          },
          grid: { color: gridColor }
        },
        y: {
          ticks: {
            color: tickColor,
            callback: (v) => `${v}°`,
            font: { size: 11, family: 'Inter' }
          },
          grid: { color: gridColor }
        }
      }
    }
  });

  const chartSkeleton = document.getElementById('chart-skeleton');
  if (chartSkeleton) chartSkeleton.style.display = 'none';
}

function formatHourlyLabel(isoStr) {
  try {
    const d = new Date(isoStr);
    const day = d.toLocaleDateString([], { weekday: 'short' });
    const hour = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${day} ${hour}`;
  } catch {
    return isoStr;
  }
}

// ========== 4B. EARLY WARNING HORIZON ANALYTICS BENCH ==========

function updateHorizonAnalytics(forecastData, hourlyData) {
  if (!forecastData) return;

  const leadTimes = forecastData.lead_times || {};
  const peakProj = forecastData.peak_projections_48h || {};
  const exposure = forecastData.exposure_windows || {};

  // 1. Danger Horizon Card
  const dangerVal = document.getElementById('horizon-danger-val');
  const dangerStatus = document.getElementById('horizon-danger-status');
  const dangerFooter = document.getElementById('horizon-danger-footer');
  const dangerChip = document.getElementById('horizon-danger-chip');

  if (dangerVal) {
    const dangerLead = leadTimes.danger_lead_hours;
    if (dangerLead === 0) {
      dangerVal.textContent = 'ACTIVE';
      dangerVal.style.color = '#ef4444';
      if (dangerStatus) dangerStatus.textContent = 'Danger threshold active';
      if (dangerChip) {
        dangerChip.textContent = 'CRITICAL NOW';
        dangerChip.style.background = 'rgba(239, 68, 68, 0.2)';
        dangerChip.style.color = '#fca5a5';
      }
    } else if (dangerLead != null) {
      dangerVal.textContent = `T-${dangerLead}h`;
      dangerVal.style.color = dangerLead <= 12 ? '#f97316' : '#38bdf8';
      if (dangerStatus) dangerStatus.textContent = `Onset: ${formatHourlyLabel(leadTimes.danger_onset_time)}`;
      if (dangerChip) {
        dangerChip.textContent = 'PREDICTED BREACH';
        dangerChip.style.background = 'rgba(249, 115, 22, 0.2)';
        dangerChip.style.color = '#fdba74';
      }
    } else {
      dangerVal.textContent = '48h+ Safe';
      dangerVal.style.color = '#10b981';
      if (dangerStatus) dangerStatus.textContent = 'No acute breach projected';
      if (dangerChip) {
        dangerChip.textContent = 'SAFE BOUNDARY';
        dangerChip.style.background = 'rgba(16, 185, 129, 0.15)';
        dangerChip.style.color = '#6ee7b7';
      }
    }
  }

  if (dangerFooter) {
    dangerFooter.innerHTML = `<span>${leadTimes.danger_lead_text || 'Continuous biometeorological monitoring active.'}</span>`;
  }

  // 2. Projected Peak Card
  const peakVal = document.getElementById('horizon-peak-val');
  const peakTime = document.getElementById('horizon-peak-time');
  const peakFooter = document.getElementById('horizon-peak-footer');

  if (peakVal) {
    const peakHI = peakProj.peak_heat_index?.value;
    peakVal.textContent = formatTemp(peakHI);
    peakVal.style.color = (peakHI >= 41) ? '#ef4444' : (peakHI >= 38 ? '#f97316' : '#f59e0b');
  }

  if (peakTime && peakProj.peak_heat_index?.time) {
    const leadH = peakProj.peak_heat_index.lead_hours;
    peakTime.textContent = `${formatHourlyLabel(peakProj.peak_heat_index.time)} (+${leadH}h)`;
  }

  if (peakFooter) {
    const peakWBGT = peakProj.peak_wbgt?.value;
    const peakUTCI = peakProj.peak_utci?.value;
    peakFooter.innerHTML = `<span>WBGT Peak: <strong>${formatTemp(peakWBGT)}</strong> • UTCI: <strong>${formatTemp(peakUTCI)}</strong></span>`;
  }

  // 3. High-Risk Exposure Window Card
  const windowVal = document.getElementById('horizon-window-val');
  const windowDesc = document.getElementById('horizon-window-desc');
  const windowFooter = document.getElementById('horizon-window-footer');

  if (windowVal) {
    const dur = leadTimes.danger_duration_hours || exposure.longest_continuous_danger_hours || 0;
    windowVal.textContent = dur > 0 ? `${dur} hrs` : '0 hrs';
    windowVal.style.color = dur >= 4 ? '#ef4444' : (dur > 0 ? '#f97316' : '#10b981');
  }

  if (windowDesc) {
    const totalDanger = exposure.total_danger_hours_48h || 0;
    windowDesc.textContent = totalDanger > 0 ? `${totalDanger} total danger hrs (48h)` : 'No danger episodes';
  }

  if (windowFooter) {
    const cautionHrs = exposure.total_caution_hours_48h || 0;
    windowFooter.innerHTML = `<span>Caution exposure window: <strong>${cautionHrs} hrs</strong> in 48h</span>`;
  }

  // 4. Accumulated Thermal Burden Card
  const burdenVal = document.getElementById('horizon-burden-val');
  const burdenUnit = document.getElementById('horizon-burden-unit');
  const burdenFooter = document.getElementById('horizon-burden-footer');

  if (burdenVal) {
    const degHrs = exposure.thermal_burden_degree_hours_48h || 0;
    burdenVal.textContent = degHrs.toFixed(1);
    burdenVal.style.color = degHrs >= 30 ? '#ef4444' : (degHrs >= 10 ? '#f97316' : '#38bdf8');
  }

  if (burdenUnit) {
    burdenUnit.textContent = '°C·hr thermal load';
  }

  if (burdenFooter) {
    burdenFooter.innerHTML = `<span>Integrated physiological strain exceeding 40°C threshold</span>`;
  }
}

// ========== 5. 7-DAY FORECAST GRID ==========

function updateForecastGrid(forecasts) {
  const grid = document.getElementById('forecast-grid');
  if (!grid) return;

  const dailyList = Array.isArray(forecasts) ? forecasts : (forecasts?.daily || forecasts?.forecasts || []);
  if (!dailyList || dailyList.length === 0) return;

  grid.innerHTML = dailyList.map(day => {
    const dateObj = new Date(day.date + 'T00:00:00');
    const weekday = dateObj.toLocaleDateString([], { weekday: 'short' });
    const formattedDate = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
    const maxT = formatTemp(day.max_temp);
    const minT = formatTemp(day.min_temp);
    const peakHI = formatTemp(day.peak_heat_index);
    const peakWBGT = formatTemp(day.peak_wbgt);
    const riskColor = day.risk_color || '#10b981';
    const riskLabel = day.risk_level || 'Low Risk';
    const peakHour = day.peak_hour != null ? ` @ ${day.peak_hour}:00` : '';
    const dangerChip = (day.danger_hours_count > 0)
      ? `<div class="forecast-danger-chip">${day.danger_hours_count}h in Danger</div>`
      : '';

    return `
      <div class="forecast-card" style="border-top: 3px solid ${riskColor};">
        <div class="forecast-card-body">
          <div class="forecast-date-header">
            <span class="forecast-weekday">${weekday}</span>
            <span class="forecast-subdate">${formattedDate}</span>
          </div>
          <div class="forecast-icon-box">${getWeatherIconSvg(day.weather_code)}</div>
          <div class="forecast-temps-row">
            <span class="temp-max-val">${maxT}</span>
            <span class="temp-min-val">${minT}</span>
          </div>
          <div class="forecast-peak-hi-row">
            <span class="peak-hi-label">Peak HI${peakHour}</span>
            <span class="peak-hi-val">${peakHI}</span>
          </div>
          <div class="forecast-peak-hi-row" style="margin-top: 0.25rem;">
            <span class="peak-hi-label" style="font-size: 0.68rem; color: #64748b;">Peak WBGT</span>
            <span class="peak-hi-val" style="font-size: 0.8rem; color: #0284c7;">${peakWBGT}</span>
          </div>
          ${dangerChip}
        </div>
        <div class="forecast-risk-ribbon" style="background: ${riskColor}18; color: ${riskColor}; border-top: 1px solid ${riskColor}40;">
          ${riskLabel}
        </div>
      </div>
    `;
  }).join('');
}

// ========== 6. HYDRATION SIMULATOR ==========

function initHydrationCalculator() {
  const weightSlider = document.getElementById('body-weight');
  const weightDisplay = document.getElementById('weight-display');
  const activitySelect = document.getElementById('activity-level');

  if (weightSlider && weightDisplay) {
    weightSlider.addEventListener('input', (e) => {
      weightDisplay.textContent = `${e.target.value} kg`;
      updateHydrationTarget();
    });
  }

  if (activitySelect) {
    activitySelect.addEventListener('change', updateHydrationTarget);
  }
}

function updateHydrationTarget() {
  const weightInput = document.getElementById('body-weight');
  const activityInput = document.getElementById('activity-level');
  const hourlyEl = document.getElementById('hourly-water');
  const dailyEl = document.getElementById('daily-water');
  const tipEl = document.getElementById('hydration-tip');
  const waterRect = document.getElementById('bottle-water-fill');
  const pctText = document.getElementById('bottle-pct-text');

  if (!weightInput || !activityInput || !hourlyEl || !dailyEl) return;

  const weight = parseFloat(weightInput.value) || 70;
  const activity = activityInput.value;

  // Base daily requirement: ~35ml per kg
  let dailyBase = weight * 0.035;

  // Heat Index factor
  const hi = state.thermalStressData?.indices?.heat_index || 30;
  let heatMultiplier = 1.0;
  if (hi >= 45) heatMultiplier = 1.5;
  else if (hi >= 38) heatMultiplier = 1.35;
  else if (hi >= 32) heatMultiplier = 1.2;

  // Activity adjustment
  let activityMultiplier = 1.0;
  let hourlyRate = 200; // ml
  if (activity === 'moderate') {
    activityMultiplier = 1.25;
    hourlyRate = 350;
  } else if (activity === 'heavy') {
    activityMultiplier = 1.5;
    hourlyRate = 550;
  }

  if (hi >= 40) hourlyRate *= 1.3;

  const totalDaily = (dailyBase * heatMultiplier * activityMultiplier).toFixed(1);
  const roundedHourly = Math.round(hourlyRate / 25) * 25;

  hourlyEl.textContent = `${roundedHourly} ml`;
  dailyEl.textContent = `${totalDaily} L`;

  // Animate SVG Water Bottle Fill Level
  // Bottle inner height is ~140px (from y=45 to y=185)
  const maxLiters = 5.0;
  const fillPct = Math.min(100, Math.max(25, (parseFloat(totalDaily) / maxLiters) * 100));
  const fillHeight = (fillPct / 100) * 140;
  const fillY = 185 - fillHeight;

  if (waterRect) {
    waterRect.setAttribute('y', fillY);
    waterRect.setAttribute('height', fillHeight + 10);
  }
  if (pctText) {
    pctText.textContent = `${Math.round(fillPct)}%`;
    pctText.setAttribute('y', Math.min(170, fillY + fillHeight / 2 + 5));
  }

  if (tipEl) {
    if (hi >= 40) {
      tipEl.innerHTML = '🚨 <b>Heat Emergency Warning</b>: Drink water every 15 minutes. Add Oral Rehydration Salts (ORS) to prevent electrolyte collapse.';
    } else if (hi >= 32) {
      tipEl.innerHTML = '💡 <b>High Heat Advisory</b>: Hydrate continuously. Do not wait until you feel thirsty.';
    } else {
      tipEl.innerHTML = '💡 <b>Hydration Tip</b>: Maintain regular fluid intake. Drink water before, during, and after outdoor exposure.';
    }
  }
}

// ========== 7. MULTI-CITY MAP & SIDEBAR ==========

function initMap() {
  const mapEl = document.getElementById('heat-map');
  if (!mapEl || heatMap) return;

  heatMap = L.map('heat-map', {
    zoomControl: true,
    scrollWheelZoom: true
  }).setView([state.lat, state.lon], 5);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(heatMap);

  cityMarkersLayer = L.layerGroup().addTo(heatMap);

  // Click anywhere on map to inspect telemetry
  heatMap.on('click', async (e) => {
    const lat = e.latlng.lat;
    const lon = e.latlng.lng;
    const name = await reverseGeocode(lat, lon);
    selectLocation(lat, lon, name);
  });

  updateUserMarker(state.lat, state.lon, state.locationName);

  setTimeout(() => {
    if (heatMap) heatMap.invalidateSize();
  }, 400);
}

function updateUserMarker(lat, lon, name) {
  if (!heatMap) return;

  if (userMarker) {
    heatMap.removeLayer(userMarker);
  }

  userMarker = L.marker([lat, lon], {
    title: name
  }).addTo(heatMap).bindPopup(`
    <div style="background:#08101a; color:#fff; padding:8px; border-radius:8px; font-family:Outfit,sans-serif;">
      <h4 style="margin-bottom:4px; font-size:14px;">📍 ${name}</h4>
      <p style="font-size:12px; color:#94a3b8;">Active Location</p>
    </div>
  `);
}

function updateMap(cityList) {
  if (!heatMap || !cityMarkersLayer || !Array.isArray(cityList)) return;

  cityMarkersLayer.clearLayers();
  const isLight = document.body.getAttribute('data-theme') === 'light';

  cityList.forEach(city => {
    const size = Math.max(10, Math.min(26, (city.heat_index - 15) * 0.9));
    const riskColor = city.risk_color || '#10b981';

    const circle = L.circleMarker([city.lat, city.lon], {
      radius: size,
      fillColor: riskColor,
      color: isLight ? '#0f172a' : '#ffffff',
      weight: 1.5,
      opacity: 0.95,
      fillOpacity: 0.8
    });

    const displayTemp = formatTemp(city.temperature);
    const displayHI = formatTemp(city.heat_index);

    const popupHtml = `
      <div style="background:#08101a; color:#fff; padding:10px; border-radius:10px; font-family:Inter,sans-serif; min-width:170px;">
        <h4 style="font-family:Outfit,sans-serif; font-size:15px; margin-bottom:6px; color:#fff;">${city.name}, ${city.country || ''}</h4>
        <div style="font-size:12px; margin:3px 0;">🌡️ Temp: <b>${displayTemp}</b></div>
        <div style="font-size:12px; margin:3px 0;">🔥 Heat Index: <b>${displayHI}</b></div>
        <div style="font-size:12px; margin:3px 0;">⚠️ Risk: <b style="color:${riskColor}">${city.risk_level}</b></div>
        <button style="margin-top:8px; width:100%; background:#1e293b; color:#f8fafc; border:1px solid rgba(255,255,255,0.15); padding:6px 8px; border-radius:6px; font-weight:600; font-size:11px; cursor:pointer;" onclick="selectCityFromMap(${city.lat}, ${city.lon}, '${city.name}, ${city.country || ''}')">
          Inspect Telemetry
        </button>
      </div>
    `;

    circle.bindPopup(popupHtml);
    cityMarkersLayer.addLayer(circle);
  });
}

function updateCitySidebar(cityList) {
  const sidebarList = document.getElementById('city-cards-list');
  const countBadge = document.getElementById('city-count-badge');
  if (!sidebarList || !Array.isArray(cityList)) return;

  if (countBadge) countBadge.textContent = `${cityList.length} Active`;

  sidebarList.innerHTML = cityList.map(city => {
    const riskColor = city.risk_color || '#10b981';
    const displayHI = formatTemp(city.heat_index);

    return `
      <div class="city-sidebar-card" style="border-left: 3.5px solid ${riskColor};" onclick="selectCityFromMap(${city.lat}, ${city.lon}, '${city.name}, ${city.country || ''}')">
        <div>
          <div class="city-sidebar-name">${city.name}</div>
          <div class="city-sidebar-country">${city.country || ''}</div>
        </div>
        <div class="city-sidebar-right">
          <div class="city-sidebar-temp">${displayHI}</div>
          <div class="city-sidebar-risk" style="color:${riskColor};">${city.risk_level}</div>
        </div>
      </div>
    `;
  }).join('');
}

// Global hook for map popup buttons & sidebar clicks
window.selectCityFromMap = function(lat, lon, name) {
  selectLocation(lat, lon, name);
};

// ========== UTILITIES ==========

function getWeatherIconSvg(code) {
  // Clear sky / Sun
  if (code == null || code === 0) {
    return `<svg viewBox="0 0 24 24" width="22" height="22" stroke="#f59e0b" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`;
  }
  // Partly cloudy / Overcast
  if (code >= 1 && code <= 3) {
    return `<svg viewBox="0 0 24 24" width="22" height="22" stroke="#94a3b8" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>`;
  }
  // Fog / Mist
  if (code >= 45 && code <= 48) {
    return `<svg viewBox="0 0 24 24" width="22" height="22" stroke="#94a3b8" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14h16M4 18h16M4 10h16M4 6h16"/></svg>`;
  }
  // Rain / Drizzle / Showers
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return `<svg viewBox="0 0 24 24" width="22" height="22" stroke="#0284c7" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 14v6M8 14v6M12 16v6"/></svg>`;
  }
  // Snow
  if (code >= 71 && code <= 77) {
    return `<svg viewBox="0 0 24 24" width="22" height="22" stroke="#e2e8f0" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07 19.07 4.93"/></svg>`;
  }
  // Thunderstorm
  if (code >= 95 && code <= 99) {
    return `<svg viewBox="0 0 24 24" width="22" height="22" stroke="#ef4444" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/><path d="m13 14-3 6h4l-2 4"/></svg>`;
  }
  return `<svg viewBox="0 0 24 24" width="22" height="22" stroke="#f59e0b" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`;
}

function isLightColor(hexColor) {
  if (!hexColor || hexColor.charAt(0) !== '#') return false;
  const rgb = parseInt(hexColor.substring(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma > 160;
}

// ---------------------------------------------------------------------------
// PRECISION SKELETON LOADING GENERATORS (Zero Layout Shift)
// ---------------------------------------------------------------------------

function getForecastSkeletonsHtml() {
  let html = '';
  for (let i = 0; i < 7; i++) {
    html += `
      <div class="forecast-card skeleton-forecast" style="border-top: 3px solid rgba(255,255,255,0.08);">
        <div class="forecast-card-body">
          <div class="forecast-date-header" style="gap:4px; align-items:center;">
            <span class="skeleton-shimmer skeleton-text" style="width:36px; height:13px;"></span>
            <span class="skeleton-shimmer skeleton-text" style="width:48px; height:10px;"></span>
          </div>
          <div class="forecast-icon-box">
            <span class="skeleton-shimmer skeleton-circle" style="width:32px; height:32px;"></span>
          </div>
          <div class="forecast-temps-row" style="gap:6px; justify-content:center;">
            <span class="skeleton-shimmer skeleton-val-sm" style="width:32px; height:15px;"></span>
            <span class="skeleton-shimmer skeleton-val-sm" style="width:26px; height:13px;"></span>
          </div>
          <div class="forecast-peak-hi-row" style="gap:4px;">
            <span class="skeleton-shimmer skeleton-text" style="width:52px; height:9px;"></span>
            <span class="skeleton-shimmer skeleton-text" style="width:28px; height:12px;"></span>
          </div>
        </div>
        <div class="forecast-risk-ribbon skeleton-shimmer" style="height:22px; width:100%;"></div>
      </div>
    `;
  }
  return html;
}

function getShelterSkeletonsHtml() {
  let html = '';
  for (let i = 0; i < 3; i++) {
    html += `
      <div class="shelter-card skeleton-card">
        <div class="shelter-card-head">
          <div class="shelter-head-main" style="width: 100%;">
            <div class="skeleton-shimmer skeleton-text" style="width: 60%; height: 18px; margin-bottom: 4px;"></div>
            <div class="skeleton-shimmer skeleton-text" style="width: 40%; height: 12px;"></div>
          </div>
          <div class="skeleton-shimmer skeleton-pill" style="width: 60px; height: 22px;"></div>
        </div>
        <div class="skeleton-shimmer skeleton-text" style="width: 80%; height: 28px; border-radius: 4px; margin-top: 8px;"></div>
        <div class="shelter-capacity-module" style="margin-top: 8px;">
          <div style="display:flex; justify-content:space-between; margin-bottom: 6px;">
            <div class="skeleton-shimmer skeleton-text" style="width: 40%; height: 12px;"></div>
            <div class="skeleton-shimmer skeleton-text" style="width: 20%; height: 12px;"></div>
          </div>
          <div class="shelter-occ-track" style="height: 6px; border-radius: 3px;"></div>
        </div>
        <div class="shelter-tags-grid" style="margin-top: 8px;">
          <div class="skeleton-shimmer skeleton-pill" style="width: 50px; height: 20px;"></div>
          <div class="skeleton-shimmer skeleton-pill" style="width: 60px; height: 20px;"></div>
          <div class="skeleton-shimmer skeleton-pill" style="width: 45px; height: 20px;"></div>
        </div>
        <div class="shelter-card-actions" style="margin-top: 12px;">
          <div class="skeleton-shimmer skeleton-text" style="width: 35%; height: 14px;"></div>
          <div class="skeleton-shimmer skeleton-pill" style="width: 75px; height: 26px;"></div>
        </div>
      </div>
    `;
  }
  return html;
}

function getProtocolSkeletonsHtml() {
  let html = '<ul style="list-style:none; display:flex; flex-direction:column; gap:0.5rem; margin:0; padding:0;">';
  for (let i = 0; i < 4; i++) {
    html += `
      <li style="background: rgba(0, 0, 0, 0.2); border: 1px solid var(--border-subtle); border-left: 2px solid var(--accent-primary); border-radius: var(--radius-sm); padding: 0.65rem 0.85rem; display: flex; align-items: flex-start; gap: 0.5rem;">
        <div class="skeleton-shimmer skeleton-circle" style="width:14px; height:14px; margin-top:2px;"></div>
        <div style="flex:1;">
          <div class="skeleton-shimmer skeleton-text" style="width:75%; height:13px; margin-bottom:4px;"></div>
          <div class="skeleton-shimmer skeleton-text" style="width:90%; height:11px;"></div>
        </div>
      </li>
    `;
  }
  return html + '</ul>';
}

function getDemographicsSkeletonsHtml() {
  let html = '<ul style="list-style:none; display:flex; flex-direction:column; gap:0.5rem; margin:0; padding:0;">';
  for (let i = 0; i < 3; i++) {
    html += `
      <li style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); border-left: 2px solid #f59e0b; border-radius: var(--radius-sm); padding: 0.65rem 0.85rem; display: flex; align-items: flex-start; gap: 0.5rem;">
        <div class="skeleton-shimmer skeleton-circle" style="width:18px; height:18px;"></div>
        <div style="flex:1;">
          <div class="skeleton-shimmer skeleton-text" style="width:45%; height:14px; margin-bottom:5px;"></div>
          <div class="skeleton-shimmer skeleton-text" style="width:85%; height:11px;"></div>
        </div>
      </li>
    `;
  }
  return html + '</ul>';
}

function getCityListSkeletonsHtml() {
  let html = '';
  for (let i = 0; i < 4; i++) {
    html += `
      <div class="city-sidebar-card skeleton-card" style="border-left: 3.5px solid rgba(255,255,255,0.08); display:flex; justify-content:space-between; align-items:center; padding:0.7rem 0.85rem;">
        <div style="flex:1;">
          <div class="skeleton-shimmer skeleton-text" style="width:65%; height:14px; margin-bottom:4px;"></div>
          <div class="skeleton-shimmer skeleton-text" style="width:40%; height:11px;"></div>
        </div>
        <div class="city-sidebar-right" style="display:flex; flex-direction:column; align-items:flex-end;">
          <div class="skeleton-shimmer skeleton-text" style="width:34px; height:16px; margin-bottom:4px;"></div>
          <div class="skeleton-shimmer skeleton-pill" style="width:50px; height:14px;"></div>
        </div>
      </div>
    `;
  }
  return html;
}

function getEpiAdvisoriesSkeletonsHtml() {
  let html = '';
  for (let i = 0; i < 3; i++) {
    html += `
      <div class="epi-adv-item skeleton-row" style="margin-bottom:0.5rem;">
        <div class="skeleton-shimmer skeleton-circle" style="width:18px; height:18px;"></div>
        <div class="skeleton-shimmer skeleton-text" style="flex:1; height:13px;"></div>
      </div>
    `;
  }
  return html;
}

function getWardListSkeletonsHtml() {
  let html = '';
  for (let i = 0; i < 5; i++) {
    html += `
      <div class="ward-list-item skeleton-card" style="border-left: 3px solid rgba(255,255,255,0.08); padding:0.65rem 0.85rem; display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
        <div style="flex:1;">
          <div class="skeleton-shimmer skeleton-text" style="width:50%; height:13px; margin-bottom:5px;"></div>
          <div class="skeleton-shimmer skeleton-text" style="width:70%; height:11px;"></div>
        </div>
        <div style="text-align:right;">
          <div class="skeleton-shimmer skeleton-text" style="width:38px; height:15px; margin-bottom:4px; margin-left:auto;"></div>
          <div class="skeleton-shimmer skeleton-text" style="width:50px; height:10px; margin-left:auto;"></div>
        </div>
      </div>
    `;
  }
  return html;
}

function getHapProtocolsSkeletonsHtml() {
  let html = '';
  for (let i = 0; i < 4; i++) {
    html += `
      <div class="hap-proto-card skeleton-card" style="padding:1rem;">
        <div class="hap-proto-head" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
          <div style="display:flex; align-items:center; gap:8px;">
            <div class="skeleton-shimmer skeleton-circle" style="width:24px; height:24px;"></div>
            <div class="skeleton-shimmer skeleton-text" style="width:120px; height:14px;"></div>
          </div>
          <div class="skeleton-shimmer skeleton-pill" style="width:65px; height:18px;"></div>
        </div>
        <div class="skeleton-shimmer skeleton-text" style="width:90%; height:12px; margin-bottom:6px;"></div>
        <div class="skeleton-shimmer skeleton-text" style="width:75%; height:12px; margin-bottom:12px;"></div>
        <div style="display:flex; gap:6px;">
          <span class="skeleton-shimmer skeleton-pill" style="width:55px; height:18px;"></span>
          <span class="skeleton-shimmer skeleton-pill" style="width:65px; height:18px;"></span>
        </div>
      </div>
    `;
  }
  return html;
}

function getDispatchLogSkeletonsHtml() {
  let html = '';
  for (let i = 0; i < 4; i++) {
    html += `
      <tr>
        <td><div class="skeleton-shimmer skeleton-text" style="width:70px; height:13px;"></div></td>
        <td><div class="skeleton-shimmer skeleton-text" style="width:55px; height:12px;"></div></td>
        <td><div class="skeleton-shimmer skeleton-text" style="width:90px; height:13px;"></div></td>
        <td><div class="skeleton-shimmer skeleton-text" style="width:85px; height:13px;"></div></td>
        <td><div class="skeleton-shimmer skeleton-text" style="width:55px; height:13px;"></div></td>
        <td><div class="skeleton-shimmer skeleton-text" style="width:65px; height:13px;"></div></td>
        <td><div class="skeleton-shimmer skeleton-pill" style="width:34px; height:18px;"></div></td>
        <td><div class="skeleton-shimmer skeleton-pill" style="width:70px; height:16px;"></div></td>
      </tr>
    `;
  }
  return html;
}

function getHistorySkeletonsHtml() {
  let html = '';
  for (let i = 0; i < 3; i++) {
    html += `
      <div class="history-event-card skeleton-card" style="border-left: 4px solid rgba(255,255,255,0.08); padding:1rem; margin-bottom:0.75rem;">
        <div class="skeleton-shimmer skeleton-text" style="width:60%; height:15px; margin-bottom:6px;"></div>
        <div class="skeleton-shimmer skeleton-text" style="width:40%; height:12px; margin-bottom:12px;"></div>
        <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap: 6px; margin-bottom:10px;">
          <div class="skeleton-shimmer skeleton-text" style="width:80%; height:12px;"></div>
          <div class="skeleton-shimmer skeleton-text" style="width:80%; height:12px;"></div>
          <div class="skeleton-shimmer skeleton-text" style="width:80%; height:12px;"></div>
          <div class="skeleton-shimmer skeleton-text" style="width:80%; height:12px;"></div>
        </div>
        <div class="skeleton-shimmer skeleton-text" style="width:92%; height:12px;"></div>
      </div>
    `;
  }
  return html;
}

function applyDashboardSkeletons() {
  // 1. Hero Threat Banner
  const alertTitle = document.getElementById('alert-title');
  if (alertTitle) alertTitle.innerHTML = '<span class="skeleton-shimmer skeleton-text" style="width: 220px; height: 18px;"></span>';
  
  const alertMsg = document.getElementById('alert-message');
  if (alertMsg) alertMsg.innerHTML = '<span class="skeleton-shimmer skeleton-text" style="width: 90%; height: 13px; display: block; margin-bottom: 5px;"></span><span class="skeleton-shimmer skeleton-text" style="width: 60%; height: 13px; display: block;"></span>';

  const threatTag = document.getElementById('threat-level-tag');
  if (threatTag) threatTag.innerHTML = '<span class="skeleton-shimmer skeleton-pill" style="width: 85px; height: 18px;"></span>';

  const heroHi = document.getElementById('hero-stat-hi');
  if (heroHi) heroHi.innerHTML = '<span class="skeleton-shimmer skeleton-val-md" style="width: 42px; height: 20px;"></span>';

  const heroWbgt = document.getElementById('hero-stat-wbgt');
  if (heroWbgt) heroWbgt.innerHTML = '<span class="skeleton-shimmer skeleton-val-md" style="width: 42px; height: 20px;"></span>';

  // 2. Atmospheric Boundary Telemetry Grid
  const tempEl = document.getElementById('current-temp');
  if (tempEl) tempEl.innerHTML = '<span class="skeleton-shimmer skeleton-val-lg"></span>';

  const apparentBadge = document.getElementById('apparent-temp-badge');
  if (apparentBadge) apparentBadge.innerHTML = '<span class="skeleton-shimmer skeleton-pill" style="width: 85px; height: 18px;"></span>';

  const humEl = document.getElementById('current-humidity');
  if (humEl) humEl.innerHTML = '<span class="skeleton-shimmer skeleton-val-lg"></span>';

  const dewBadge = document.getElementById('dewpoint-mini-badge');
  if (dewBadge) dewBadge.innerHTML = '<span class="skeleton-shimmer skeleton-pill" style="width: 80px; height: 18px;"></span>';

  const windEl = document.getElementById('current-wind');
  if (windEl) windEl.innerHTML = '<span class="skeleton-shimmer skeleton-val-lg"></span>';

  const windBadge = document.getElementById('wind-ms-badge');
  if (windBadge) windBadge.innerHTML = '<span class="skeleton-shimmer skeleton-pill" style="width: 60px; height: 18px;"></span>';

  const radEl = document.getElementById('current-radiation');
  if (radEl) radEl.innerHTML = '<span class="skeleton-shimmer skeleton-val-lg"></span>';

  const uvBadge = document.getElementById('uv-badge');
  if (uvBadge) uvBadge.innerHTML = '<span class="skeleton-shimmer skeleton-pill" style="width: 75px; height: 18px;"></span>';

  // 3. Bio-Thermal Stress Suite & Indices
  const gaugeHi = document.getElementById('gauge-heat-index');
  if (gaugeHi) gaugeHi.innerHTML = '<span class="skeleton-shimmer skeleton-val-lg" style="width: 60px; height: 32px;"></span>';

  const gaugePill = document.getElementById('gauge-category-pill');
  if (gaugePill) gaugePill.innerHTML = '<span class="skeleton-shimmer skeleton-pill" style="width: 70px; height: 18px;"></span>';

  const gaugeDesc = document.getElementById('gauge-statement');
  if (gaugeDesc) gaugeDesc.innerHTML = '<span class="skeleton-shimmer skeleton-text" style="width: 80%; height: 12px; margin: 4px auto 0;"></span>';

  const idxIds = ['idx-heat-index', 'idx-wbgt', 'idx-utci', 'idx-wetbulb', 'idx-humidex', 'idx-dewpoint'];
  idxIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '<span class="skeleton-shimmer skeleton-val-md" style="width: 48px; height: 22px;"></span>';
    const statusEl = document.getElementById(`${id}-status`);
    if (statusEl) statusEl.innerHTML = '<span class="skeleton-shimmer skeleton-pill" style="width: 65px; height: 14px;"></span>';
  });

  // 4. 48-Hour Chart & 7-Day Outlook
  const chartSkeleton = document.getElementById('chart-skeleton');
  if (chartSkeleton) chartSkeleton.style.display = 'flex';

  const forecastGrid = document.getElementById('forecast-grid');
  if (forecastGrid) forecastGrid.innerHTML = getForecastSkeletonsHtml();

  // 5. Cooling Shelters
  const sheltersGrid = document.getElementById('shelters-grid');
  if (sheltersGrid) sheltersGrid.innerHTML = getShelterSkeletonsHtml();

  // 6. Global Radar Map City Sidebar
  const citySidebar = document.getElementById('city-cards-list');
  if (citySidebar) citySidebar.innerHTML = getCityListSkeletonsHtml();

  // 7. Clinical Guidance & Cohorts
  const recList = document.getElementById('recommendations-list');
  if (recList) recList.innerHTML = getProtocolSkeletonsHtml();

  const vulList = document.getElementById('vulnerable-groups');
  if (vulList) vulList.innerHTML = getDemographicsSkeletonsHtml();

  // 8. Epidemiological Surge
  const epiAdvisories = document.getElementById('epi-advisories-list');
  if (epiAdvisories) epiAdvisories.innerHTML = getEpiAdvisoriesSkeletonsHtml();

  const hviScore = document.getElementById('epi-hvi-score');
  if (hviScore) hviScore.innerHTML = '<span class="skeleton-shimmer skeleton-val-md" style="width: 50px; height: 24px;"></span>';

  const hviTier = document.getElementById('epi-hvi-tier');
  if (hviTier) hviTier.innerHTML = '<span class="skeleton-shimmer skeleton-pill" style="width: 90px; height: 18px;"></span>';

  const epiPeakMort = document.getElementById('epi-peak-mortality');
  if (epiPeakMort) epiPeakMort.innerHTML = '<span class="skeleton-shimmer skeleton-val-md" style="width: 45px; height: 20px;"></span>';

  const epiPeakHosp = document.getElementById('epi-peak-hosp');
  if (epiPeakHosp) epiPeakHosp.innerHTML = '<span class="skeleton-shimmer skeleton-val-md" style="width: 45px; height: 20px;"></span>';

  // 9. Ward GIS Rankings
  const wardList = document.getElementById('ward-list');
  if (wardList) wardList.innerHTML = getWardListSkeletonsHtml();

  // 10. HAP Directives
  const hapGrid = document.getElementById('hap-protocols-grid');
  if (hapGrid) hapGrid.innerHTML = getHapProtocolsSkeletonsHtml();

  // 11. Dispatch Audit Log Table
  const dispatchTbody = document.getElementById('dispatch-log-tbody');
  if (dispatchTbody) dispatchTbody.innerHTML = getDispatchLogSkeletonsHtml();

  // 12. Historical Archive Cards
  const historyCards = document.getElementById('history-cards-col');
  if (historyCards) historyCards.innerHTML = getHistorySkeletonsHtml();

  // 13. Sidebar Live Station Widget
  const sideTemp = document.getElementById('sidebar-station-temp');
  if (sideTemp) sideTemp.innerHTML = '<span class="skeleton-shimmer skeleton-val-sm" style="width: 38px; height: 16px;"></span>';

  const sideCond = document.getElementById('sidebar-station-condition');
  if (sideCond) sideCond.innerHTML = '<span class="skeleton-shimmer skeleton-text" style="width: 75px; height: 11px;"></span>';
}

function setLoadingState(isLoading) {
  state.isLoading = isLoading;
  const refreshIcon = document.getElementById('refresh-icon');
  if (refreshIcon) {
    if (isLoading) {
      refreshIcon.style.display = 'inline-block';
      refreshIcon.style.animation = 'spin 1s linear infinite';
    } else {
      refreshIcon.style.animation = 'none';
    }
  }

  const chartSkeleton = document.getElementById('chart-skeleton');
  if (chartSkeleton) {
    chartSkeleton.style.display = isLoading ? 'flex' : 'none';
  }

  if (isLoading) {
    applyDashboardSkeletons();
  }
}

function showToast(msg, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `app-toast toast-${type}`;
  toast.style.position = 'fixed';
  toast.style.bottom = '24px';
  toast.style.right = '24px';
  toast.style.background = type === 'error' ? 'rgba(239, 68, 68, 0.95)' : (type === 'warning' ? 'rgba(245, 158, 11, 0.95)' : (type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(15, 23, 42, 0.94)'));
  toast.style.color = '#ffffff';
  toast.style.backdropFilter = 'blur(16px)';
  toast.style.webkitBackdropFilter = 'blur(16px)';
  toast.style.padding = '0.75rem 1.25rem';
  toast.style.borderRadius = '12px';
  toast.style.border = '1px solid rgba(255, 255, 255, 0.18)';
  toast.style.boxShadow = '0 16px 40px rgba(0, 0, 0, 0.6)';
  toast.style.zIndex = '99999';
  toast.style.fontSize = '0.82rem';
  toast.style.fontWeight = '600';
  toast.style.fontFamily = 'Outfit, Public Sans, sans-serif';
  toast.style.display = 'flex';
  toast.style.alignItems = 'center';
  toast.style.gap = '0.65rem';
  toast.style.transform = 'translateY(16px) scale(0.96)';
  toast.style.opacity = '0';
  toast.style.transition = 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
  
  const icon = type === 'error' ? '⚠️' : (type === 'warning' ? '⚡' : (type === 'success' ? '✓' : 'ℹ️'));
  toast.innerHTML = `<span style="font-size:1rem; line-height:1;">${icon}</span><span>${msg}</span>`;

  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.transform = 'translateY(0) scale(1)';
    toast.style.opacity = '1';
  });

  setTimeout(() => {
    toast.style.transform = 'translateY(10px) scale(0.96)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}

// ========== ENTERPRISE MODULES (EPIDEMIOLOGY, GIS WARDS, HAP, DISPATCH) ==========

let epiSurgeChart = null;
let wardGisMap = null;
let wardTileLayer = null;
let wardGeojsonLayer = null;
let currentWardLayerType = 'heat'; // 'heat', 'hvi', 'hospital'
let currentWardData = null;
let activeAlertTier = 2;

async function loadAllDashboardData(showToastAlert = false) {
  setLoadingState(true);
  try {
    const query = `lat=${state.lat}&lon=${state.lon}`;

    // Parallel fetch of core telemetry + enterprise endpoints
    const [
      weatherRes,
      stressRes,
      forecastRes,
      alertRes,
      hourlyRes,
      multiCityRes,
      epiRes,
      wardGisRes,
      wardSummaryRes,
      hapRes,
      historyRes
    ] = await Promise.all([
      fetchJson(`${API_BASE}/api/weather?${query}`),
      fetchJson(`${API_BASE}/api/thermal-stress?${query}`),
      fetchJson(`${API_BASE}/api/forecast?${query}`),
      fetchJson(`${API_BASE}/api/heatwave-alert?${query}`),
      fetchJson(`${API_BASE}/api/hourly-stress?${query}`),
      fetchJson(`${API_BASE}/api/multi-city`),
      fetchJson(`${API_BASE}/api/epidemiology/forecast?${query}`),
      fetchJson(`${API_BASE}/api/wards/gis?${query}`),
      fetchJson(`${API_BASE}/api/wards/summary?${query}`),
      fetchJson(`${API_BASE}/api/admin/hap-triggers?${query}`),
      fetchJson(`${API_BASE}/api/alerts/history`),
    ]);

    if (weatherRes) state.weatherData = weatherRes;
    if (stressRes) state.thermalStressData = stressRes;
    if (forecastRes) state.forecastData = forecastRes;
    if (alertRes) state.alertData = alertRes;
    if (hourlyRes) state.hourlyData = hourlyRes;
    if (multiCityRes) state.multiCityData = multiCityRes;
    if (epiRes) state.epiData = epiRes;

    const locNameEl = document.getElementById('location-name');
    const updateTimeEl = document.getElementById('update-time');
    if (locNameEl) locNameEl.textContent = state.locationName;
    if (updateTimeEl) updateTimeEl.textContent = `Live: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    // Render core telemetry
    try { renderAllData(); } catch (e) { console.error('Error in renderAllData:', e); }

    // Render enterprise modules safely
    try { if (epiRes) renderEpidemiology(epiRes); } catch (e) { console.error('Error in renderEpidemiology:', e); }
    try { if (wardGisRes) renderWardGisMap(wardGisRes, wardSummaryRes); } catch (e) { console.error('Error in renderWardGisMap:', e); }
    try { if (hapRes) renderHapTriggers(hapRes); } catch (e) { console.error('Error in renderHapTriggers:', e); }
    try { if (historyRes) renderDispatchHistory(historyRes); } catch (e) { console.error('Error in renderDispatchHistory:', e); }
    try { setupDispatchControls(epiRes, hapRes, wardSummaryRes); } catch (e) { console.error('Error in setupDispatchControls:', e); }
    try { setupScenarioSimulator(state.thermalStressData, state.alertData); } catch (e) { console.error('Error in setupScenarioSimulator:', e); }
    try { loadHistoricalBenchmarks(); } catch (e) { console.error('Error in loadHistoricalBenchmarks:', e); }
    try { loadCoolingShelters(); } catch (e) { console.error('Error in loadCoolingShelters:', e); }
    try { updateSidebarTelemetry(); } catch (e) { console.error('Error in updateSidebarTelemetry:', e); }

    if (showToastAlert) showToast(`Telemetry updated for ${state.locationName}`, 'info');
  } catch (err) {
    console.error('Error loading dashboard data:', err);
    showToast('Failed to load live data', 'error');
  } finally {
    setLoadingState(false);
  }
}

// ---------------------------------------------------------------------------
// 1. EPIDEMIOLOGY SURGE CONTROLLER
// ---------------------------------------------------------------------------
function renderEpidemiology(data) {
  // HVI Score & classification
  const hviScoreEl = document.getElementById('epi-hvi-score');
  const hviTierEl = document.getElementById('epi-hvi-tier');
  const hviBarEl = document.getElementById('epi-hvi-bar');
  const hviDescEl = document.getElementById('epi-hvi-desc');

  if (hviScoreEl) hviScoreEl.textContent = (data.hvi || 0).toFixed(2);
  if (hviTierEl && data.hvi_classification) {
    hviTierEl.textContent = `${data.hvi_classification.tier} Vulnerability`;
    hviTierEl.style.color = data.hvi_classification.color;
    hviTierEl.style.background = `${data.hvi_classification.color}22`;
    hviTierEl.style.borderColor = `${data.hvi_classification.color}55`;
  }
  if (hviBarEl) {
    hviBarEl.style.width = `${Math.min(100, Math.max(10, (data.hvi || 0) * 100))}%`;
  }
  if (hviDescEl && data.hvi_classification) {
    hviDescEl.textContent = data.hvi_classification.description;
  }

  // MRI Score & classification
  if (data.mortality_risk_index) {
    const mri = data.mortality_risk_index;
    const scoreEl = document.getElementById('epi-mri-score');
    const tierEl = document.getElementById('epi-mri-tier');
    const barEl = document.getElementById('epi-mri-bar');
    const descEl = document.getElementById('epi-mri-desc');

    if (scoreEl) scoreEl.textContent = mri.score;
    if (tierEl) {
      tierEl.textContent = `${mri.classification} Risk`;
      tierEl.style.color = mri.color;
      tierEl.style.background = `${mri.color}22`;
      tierEl.style.borderColor = `${mri.color}55`;
    }
    if (barEl) {
      barEl.style.width = `${Math.min(100, Math.max(5, mri.score))}%`;
      barEl.style.background = mri.color;
    }
    if (descEl) {
      descEl.textContent = mri.description;
    }
  }


  // Demographic Metrics
  const d = data.demographics || {};
  const setDemog = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = `${Math.round((val || 0) * 100)}%`;
  };
  setDemog('epi-demog-elderly', d.elderly_fraction);
  setDemog('epi-demog-outdoor', d.outdoor_worker_fraction);
  setDemog('epi-demog-slum', d.slum_density_fraction);
  setDemog('epi-demog-morbidity', d.chronic_morbidity_rate);

  // Peak 3-5 day surge estimates
  const forecast = data.daily_surge_forecast || [];
  if (forecast.length > 3) {
    const peakDay = forecast.slice(2, 6).reduce((max, d) => d.excess_mortality_pct > max.excess_mortality_pct ? d : max, forecast[3] || forecast[0]);

    const peakMortEl = document.getElementById('epi-peak-mortality');
    const peakHospEl = document.getElementById('epi-peak-hosp');
    if (peakMortEl) peakMortEl.textContent = `+${peakDay.excess_mortality_pct}%`;
    if (peakHospEl) peakHospEl.textContent = `+${peakDay.excess_hosp_pct}%`;

    const b = peakDay.admission_breakdown || {};
    const setAdm = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = `+${val || 0}`;
    };
    setAdm('epi-adm-cardiac-val', b.cardiovascular);
    setAdm('epi-adm-resp-val', b.respiratory);
    setAdm('epi-adm-heat-val', b.heatstroke);
  }

  // Render Chart.js Surge Timeline
  renderEpiSurgeChart(forecast);

  // Render Advisories
  const advList = document.getElementById('epi-advisories-list');
  if (advList && data.public_health_advisories) {
    const advs = data.public_health_advisories.citizen_advisories || [];
    advList.innerHTML = advs.map(a => `
      <div class="epi-adv-item">
        <span>🛡️</span>
        <span>${a}</span>
      </div>
    `).join('');
  }
}

function renderEpiSurgeChart(forecast) {
  const canvas = document.getElementById('epi-surge-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const labels = forecast.map((d, i) => i === 0 ? 'Today' : `Day +${i}`);
  const hospData = forecast.map(d => d.excess_hosp_pct);
  const mortData = forecast.map(d => d.excess_mortality_pct);

  if (epiSurgeChart) {
    epiSurgeChart.destroy();
  }

  const isLight = document.body.getAttribute('data-theme') === 'light';
  const gridColor = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)';
  const tickColor = isLight ? '#64748b' : '#94a3b8';
  const tooltipBg = isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(10, 18, 30, 0.95)';
  const tooltipBorder = isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)';

  epiSurgeChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Hospitalization Surge (%)',
          data: hospData,
          backgroundColor: 'rgba(239, 68, 68, 0.65)',
          borderColor: '#ef4444',
          borderWidth: 1.5,
          borderRadius: 6,
        },
        {
          label: 'Excess Mortality (%)',
          data: mortData,
          backgroundColor: 'rgba(249, 115, 22, 0.65)',
          borderColor: '#f97316',
          borderWidth: 1.5,
          borderRadius: 6,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: tooltipBg,
          titleFont: { family: 'Outfit', size: 13 },
          bodyFont: { family: 'JetBrains Mono', size: 12 },
          titleColor: isLight ? '#0f172a' : '#ffffff',
          bodyColor: isLight ? '#475569' : '#fff',
          borderColor: tooltipBorder,
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: +${ctx.parsed.y}%`
          }
        }
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: tickColor, font: { family: 'Outfit', size: 11 } }
        },
        y: {
          grid: { color: gridColor },
          ticks: {
            color: tickColor,
            font: { family: 'JetBrains Mono', size: 11 },
            callback: (v) => `+${v}%`
          },
          beginAtZero: true
        }
      }
    }
  });
}

// ---------------------------------------------------------------------------
// 2. WARD-LEVEL GIS CHLOROPLETH CONTROLLER
// ---------------------------------------------------------------------------
function initWardMap() {
  const container = document.getElementById('ward-map');
  if (!container || wardGisMap) return;

  // Delhi center
  wardGisMap = L.map('ward-map', {
    zoomControl: true,
    attributionControl: false
  }).setView([28.64, 77.21], 10);

  const isLight = document.body.getAttribute('data-theme') === 'light';
  const tileUrl = isLight 
    ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

  wardTileLayer = L.tileLayer(tileUrl, {
    maxZoom: 16,
    subdomains: 'abcd'
  }).addTo(wardGisMap);

  // Setup layer switcher
  document.querySelectorAll('.ward-layer-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.ward-layer-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentWardLayerType = btn.getAttribute('data-layer');
      updateWardChloroplethStyle();
    });
  });
}

function updateMapTheme(theme) {
  if (wardGisMap && wardTileLayer) {
    const tileUrl = theme === 'light' 
      ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    wardTileLayer.setUrl(tileUrl);
  }
}

function renderWardGisMap(geojson, summaryList) {
  initWardMap();
  if (!wardGisMap) return;

  currentWardData = geojson;

  if (wardGeojsonLayer) {
    wardGisMap.removeLayer(wardGeojsonLayer);
  }

  wardGeojsonLayer = L.geoJSON(geojson, {
    style: styleWardFeature,
    onEachFeature: onEachWardFeature
  }).addTo(wardGisMap);

  // Dynamically fit map bounds to the current city's wards
  if (geojson && geojson.features && geojson.features.length > 0) {
    try {
      const bounds = wardGeojsonLayer.getBounds();
      if (bounds && bounds.isValid()) {
        wardGisMap.fitBounds(bounds, { padding: [25, 25], maxZoom: 13 });
      } else {
        wardGisMap.setView([state.lat, state.lon], 11);
      }
    } catch (e) {
      wardGisMap.setView([state.lat, state.lon], 11);
    }
  }

  // Update Section & Sidebar headings
  const cityName = state.locationName ? state.locationName.split(',')[0].trim() : 'Municipal';
  const headingEl = document.getElementById('ward-city-heading');
  const listTitleEl = document.getElementById('ward-list-title');
  if (headingEl) headingEl.textContent = cityName;
  if (listTitleEl && summaryList) {
    listTitleEl.textContent = `${summaryList.length} Wards (${cityName})`;
  }

  // Render Sidebar Ward List
  renderWardList(summaryList || []);
}

function styleWardFeature(feature) {
  const p = feature.properties;
  let color = '#4CAF50';

  if (currentWardLayerType === 'heat') {
    color = p.risk_color || '#4CAF50';
  } else if (currentWardLayerType === 'hvi') {
    color = p.hvi_color || '#4CAF50';
  } else if (currentWardLayerType === 'hospital') {
    const load = p.projected_hosp_load_pct || 50;
    if (load >= 85) color = '#B71C1C';
    else if (load >= 75) color = '#FF5722';
    else if (load >= 65) color = '#FF9800';
    else color = '#4CAF50';
  }

  return {
    fillColor: color,
    weight: 2,
    opacity: 0.9,
    color: '#0284c7',
    dashArray: '2',
    fillOpacity: 0.55
  };
}

function updateWardChloroplethStyle() {
  if (wardGeojsonLayer) {
    wardGeojsonLayer.setStyle(styleWardFeature);
  }

  const titleEl = document.getElementById('ward-legend-title');
  if (titleEl) {
    if (currentWardLayerType === 'heat') titleEl.textContent = 'Heat Index (°C)';
    else if (currentWardLayerType === 'hvi') titleEl.textContent = 'HVI Vulnerability';
    else if (currentWardLayerType === 'hospital') titleEl.textContent = 'Hospital Load (%)';
  }
}

function onEachWardFeature(feature, layer) {
  const p = feature.properties;
  layer.bindTooltip(`
    <div style="font-family: Outfit, sans-serif; font-size: 0.85rem; padding: 2px;">
      <b>${p.name}</b> (${p.district})<br>
      🔥 HI: ${p.adj_heat_index}°C | 🧬 HVI: ${p.hvi}<br>
      🏥 Hosp Load: ${p.projected_hosp_load_pct}%
    </div>
  `, { sticky: true, className: 'ward-tooltip' });

  layer.on({
    mouseover: (e) => {
      const l = e.target;
      const isLight = document.body.getAttribute('data-theme') === 'light';
      l.setStyle({ weight: 3, fillOpacity: 0.8, color: isLight ? '#0f172a' : '#ffffff' });
      l.bringToFront();
    },
    mouseout: (e) => {
      wardGeojsonLayer.resetStyle(e.target);
    },
    click: () => {
      showWardDetailDrawer(p);
    }
  });
}

function renderWardList(list) {
  const listEl = document.getElementById('ward-list');
  const countEl = document.getElementById('ward-high-count');
  if (!listEl) return;

  const highCount = list.filter(w => w.alert_level >= 3).length;
  if (countEl) countEl.textContent = `${highCount} High Risk`;

  listEl.innerHTML = list.map(w => `
    <div class="ward-list-item" onclick="selectWardById('${w.id}')" style="border-left: 3px solid ${w.risk_color};">
      <div>
        <div class="w-item-name">${w.name}</div>
        <div class="w-item-sub">HVI ${w.hvi} • ${w.hvi_tier} • ${w.cooling_center_count} Shelters</div>
      </div>
      <div class="w-item-right">
        <div class="w-item-temp" style="color:${w.risk_color};">${w.adj_heat_index}°C</div>
        <div class="w-item-sub">Load: ${w.projected_hosp_load_pct}%</div>
      </div>
    </div>
  `).join('');
}

window.selectWardById = function(wardId) {
  if (!currentWardData) return;
  const feature = currentWardData.features.find(f => f.properties.id === wardId);
  if (feature) {
    showWardDetailDrawer(feature.properties);
    if (wardGisMap && feature.properties.centroid) {
      wardGisMap.panTo([feature.properties.centroid[1], feature.properties.centroid[0]], { animate: true });
    }
  }
};

function showWardDetailDrawer(p) {
  const drawer = document.getElementById('ward-detail-drawer');
  if (!drawer) return;

  drawer.style.display = 'block';

  document.getElementById('ward-detail-name').textContent = p.name;
  document.getElementById('ward-detail-district').textContent = `${p.district} District • Pop: ${(p.population / 100000).toFixed(1)}L`;

  const pill = document.getElementById('ward-detail-risk-pill');
  if (pill) {
    pill.textContent = `Level ${p.alert_level}`;
    pill.style.background = `${p.risk_color}22`;
    pill.style.color = p.risk_color;
    pill.style.borderColor = `${p.risk_color}66`;
  }

  document.getElementById('ward-adj-temp').textContent = `${p.adj_temperature}°C`;
  document.getElementById('ward-adj-hi').textContent = `${p.adj_heat_index}°C`;
  document.getElementById('ward-hvi').textContent = p.hvi;
  document.getElementById('ward-mortality-pct').textContent = `+${p.excess_mortality_pct_day3}%`;

  document.getElementById('ward-hosp-beds').textContent = p.hospital_beds;
  document.getElementById('ward-hosp-load').textContent = `${p.projected_hosp_load_pct}% projected load`;
  const hospBar = document.getElementById('ward-hosp-bar');
  if (hospBar) {
    hospBar.style.width = `${Math.min(100, p.projected_hosp_load_pct)}%`;
    hospBar.style.background = p.projected_hosp_load_pct > 85 ? '#ef4444' : '#f97316';
  }

  const coolingList = document.getElementById('ward-cooling-list');
  if (coolingList) {
    coolingList.innerHTML = (p.cooling_centers || []).map(c => `
      <div class="ward-cooling-item">
        <b>${c.name}</b> (${c.capacity} cap)<br>
        <span style="color:var(--text-muted);">${c.address}</span>
      </div>
    `).join('') || '<span style="color:var(--text-muted);">No designated shelters</span>';
  }

  document.getElementById('ward-power-status').textContent = `Substation Stress: ${p.power_substation_stress}`;
  document.getElementById('ward-population').textContent = `${(p.population || 0).toLocaleString()} residents`;
}

// ---------------------------------------------------------------------------
// 3. CITY ADMIN HAP TRIGGERS CONTROLLER
// ---------------------------------------------------------------------------
function renderHapTriggers(data) {
  const numEl = document.getElementById('hap-level-num');
  const labelEl = document.getElementById('hap-level-label');
  const banner = document.getElementById('hap-alert-banner');

  if (numEl) numEl.textContent = `L${data.alert_level}`;
  if (labelEl) labelEl.textContent = data.alert_label;
  if (banner) {
    banner.style.borderColor = `${data.alert_color}55`;
    banner.style.background = 'var(--bg-card)';
    banner.style.borderLeft = `4px solid ${data.alert_color}`;
  }

  document.getElementById('hap-hi-val').textContent = `${data.heat_index}°C`;
  document.getElementById('hap-wbgt-val').textContent = data.wbgt != null ? `${data.wbgt}°C` : '—';
  document.getElementById('hap-wb-val').textContent = data.wet_bulb != null ? `${data.wet_bulb}°C` : '—';
  document.getElementById('hap-power-val').textContent = `+${data.estimated_power_surge_mw} MW`;

  // Render Protocol Cards
  const grid = document.getElementById('hap-protocols-grid');
  if (!grid) return;

  const allProtocols = [...(data.triggered_protocols || []), ...(data.standby_protocols || [])];
  grid.innerHTML = allProtocols.map(p => `
    <div class="hap-proto-card ${p.status.toLowerCase()}">
      <div class="hap-proto-head">
        <div class="hap-proto-icon-title">
          <span>${p.icon}</span>
          <span>${p.name}</span>
        </div>
        <span class="hap-status-tag" style="background:${p.status_color}22; color:${p.status_color}; border:1px solid ${p.status_color}55;">
          ${p.status}
        </span>
      </div>
      <div class="hap-proto-desc">${p.description}</div>
      <div class="hap-proto-depts">
        ${p.departments.map(d => `<span class="hap-dept-pill">${d}</span>`).join('')}
      </div>
    </div>
  `).join('');
}

// ---------------------------------------------------------------------------
// 4. SMS / WHATSAPP / CAP BROADCAST CONTROLLER & DISPATCH GATEWAY
// ---------------------------------------------------------------------------
let selectedDispatchMode = 'ward'; // 'ward' | 'direct'
let selectedChannel = 'SMS'; // 'SMS' | 'WhatsApp' | 'CAP_CELL' | 'VOICE_IVR'
let selectedTier = 3;
let selectedLang = 'hi';
let activeDeviceType = 'modern';
let cachedDispatchHistory = [];

let WARD_POPULATION_MAP = {
  'all': { name: 'All Metropolitan Grid', pop: 21400000, towers: 4850 }
};

const COHORT_RATIOS = {
  'General Public': 1.0,
  'Outdoor Workers': 0.22,
  'Outdoor & Construction Workers': 0.22,
  'Elderly Residents (65+)': 0.14,
  'Elderly (65+) & Chronic Patients': 0.14,
  'Slum & Informal Settlements': 0.34,
  'Slum & Informal Settlement Residents': 0.34,
  'Healthcare Workers': 0.03,
  'Primary Healthcare Centers & ASHAs': 0.03,
  'School Authorities': 0.05,
  'City Administration': 0.02,
  'DISCOM Engineers': 0.01
};

function setupDispatchControls(epiData, hapData, wardSummary) {
  const msgInput = document.getElementById('dispatch-message');
  const charCountEl = document.getElementById('dispatch-char-count');
  const costEstimateEl = document.getElementById('dispatch-cost-estimate');
  const wardSelect = document.getElementById('dispatch-zone');
  const audienceSelect = document.getElementById('dispatch-audience');
  const sendBtn = document.getElementById('dispatch-send-btn');
  const directPhoneInput = document.getElementById('dispatch-target-phone') || document.getElementById('dispatch-phone');

  // Dynamically populate Target Zone dropdown based on current city wards
  const cityName = state.locationName ? state.locationName.split(',')[0].trim() : 'City';
  if (wardSelect && currentWardData && currentWardData.features) {
    const prevVal = wardSelect.value;
    let totalPop = 0;
    const wardOptions = currentWardData.features.map(f => {
      const p = f.properties;
      totalPop += (p.population || 450000);
      WARD_POPULATION_MAP[p.id] = {
        name: p.name,
        pop: p.population || 450000,
        towers: Math.max(12, Math.round((p.population || 450000) / 8000))
      };
      return `<option value="${p.id}">${p.name} (${((p.population || 450000)/1000).toFixed(0)}K pop)</option>`;
    });

    WARD_POPULATION_MAP['all'] = {
      name: `All ${cityName} (Pan-City Grid)`,
      pop: totalPop || 21400000,
      towers: Math.max(120, Math.round(totalPop / 7000))
    };

    wardSelect.innerHTML = `
      <option value="all">All ${cityName} (Pan-City Grid • ${(totalPop/1000000).toFixed(1)}M pop)</option>
      ${wardOptions.join('')}
    `;

    if (prevVal && WARD_POPULATION_MAP[prevVal]) {
      wardSelect.value = prevVal;
    } else if (currentWardData.features.length > 1) {
      wardSelect.selectedIndex = 1;
    }
  }

  // Mode Toggle (Ward Broadcast vs Direct Handset)
  document.querySelectorAll('.dispatch-mode-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.dispatch-mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedDispatchMode = btn.getAttribute('data-mode') || 'ward';
      const directGroup = document.getElementById('dispatch-direct-group');
      if (directGroup) {
        directGroup.style.display = selectedDispatchMode === 'direct' ? 'block' : 'none';
      }
      if (sendBtn) {
        if (selectedDispatchMode === 'direct') {
          sendBtn.innerHTML = '<span id="dispatch-send-icon">📲</span> TRANSMIT DIRECT TEST SMS';
        } else {
          sendBtn.innerHTML = '<span id="dispatch-send-icon">📡</span> BROADCAST NOW TO CITIZENS';
        }
      }
      updateScopeMetrics();
      appendTerminalLog(`Mode switched to: ${selectedDispatchMode.toUpperCase()} (${selectedDispatchMode === 'direct' ? 'Single Handset Twilio Gateway' : 'TRAI Bulk DLT Mesh'})`);
    };
  });

  // Direct Phone Quick Fill Buttons
  document.querySelectorAll('.dispatch-quick-phone-btn').forEach(btn => {
    btn.onclick = () => {
      const ph = btn.getAttribute('data-phone');
      if (directPhoneInput && ph) {
        directPhoneInput.value = ph;
        showToast(`Target phone set to ${ph}`, 'info');
      }
    };
  });

  // Multi-Channel Buttons
  const channelBtns = {
    'SMS': document.getElementById('dispatch-channel-sms'),
    'WhatsApp': document.getElementById('dispatch-channel-wa'),
    'CAP_CELL': document.getElementById('dispatch-channel-cell'),
    'VOICE_IVR': document.getElementById('dispatch-channel-voice')
  };

  Object.entries(channelBtns).forEach(([chKey, btnEl]) => {
    if (!btnEl) return;
    btnEl.onclick = () => {
      Object.values(channelBtns).forEach(b => b && b.classList.remove('active'));
      btnEl.classList.add('active');
      selectedChannel = chKey;
      syncChannelPreview(chKey);
      updateCharCount();
      updateScopeMetrics();
      appendTerminalLog(`Channel switched to: ${chKey}`);
    };
  });

  // Tier Selector Buttons
  document.querySelectorAll('.dispatch-tier-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.dispatch-tier-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedTier = parseInt(btn.getAttribute('data-tier'), 10) || 3;
      syncTierPreview(selectedTier);
      appendTerminalLog(`CAP Severity Level set to: L${selectedTier} (${getTierName(selectedTier)})`);
    };
  });

  // Language Tabs
  document.querySelectorAll('.dispatch-lang-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.dispatch-lang-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedLang = btn.getAttribute('data-lang') || 'hi';
      showToast(`Advisory language switched to ${selectedLang.toUpperCase()}`, 'info');
      // If template was generic, switch language text
      applyLanguageTemplate(selectedLang);
    };
  });

  // AI Auto-Draft Advisory Button
  const aiBtn = document.getElementById('dispatch-ai-btn');
  if (aiBtn) {
    aiBtn.onclick = handleAiAdvisoryGenerate;
  }

  // Dynamic Variable Insertion Chips
  document.querySelectorAll('.var-chip').forEach(chip => {
    chip.onclick = () => {
      const varKey = chip.getAttribute('data-var');
      insertVariableText(varKey);
    };
  });

  // Message input sync
  if (msgInput) {
    msgInput.oninput = () => {
      updateCharCount();
      updatePhonePreview(msgInput.value);
    };
  }

  // Ward and Audience selectors: update real population and cost metrics
  if (wardSelect) {
    wardSelect.onchange = () => {
      updateScopeMetrics();
      appendTerminalLog(`Selected Target Zone: ${wardSelect.options[wardSelect.selectedIndex].text}`);
    };
  }
  if (audienceSelect) {
    audienceSelect.onchange = () => {
      updateScopeMetrics();
      appendTerminalLog(`Selected Audience Cohort: ${audienceSelect.value}`);
    };
  }

  // Templates
  document.querySelectorAll('.dispatch-tpl-btn').forEach(btn => {
    btn.onclick = () => {
      const tpl = btn.getAttribute('data-tpl');
      applyTemplateByName(tpl);
    };
  });

  // Phone Device Simulator Switcher (Smartphone vs Feature Phone)
  document.querySelectorAll('.phone-type-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.phone-type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeDeviceType = btn.getAttribute('data-device') || 'modern';
      const modernShell = document.getElementById('phone-shell-modern');
      const featureShell = document.getElementById('phone-shell-feature');
      if (modernShell && featureShell) {
        if (activeDeviceType === 'feature') {
          modernShell.style.display = 'none';
          featureShell.style.display = 'block';
        } else {
          modernShell.style.display = 'block';
          featureShell.style.display = 'none';
        }
      }
      updatePhonePreview(msgInput ? msgInput.value : '');
    };
  });

  // Interactive phone preview action pills
  const pillShelter = document.getElementById('phone-pill-shelter');
  if (pillShelter) {
    pillShelter.onclick = () => {
      navigateToView('shelters');
      showToast('Navigating to Nearest Municipal Cooling Centers', 'info');
    };
  }

  const pillCall = document.getElementById('phone-pill-call');
  if (pillCall) {
    pillCall.onclick = () => {
      showToast('NDMA Delhi Heatline 1077 (Toll-Free, 24/7 Medical Triage)', 'info');
    };
  }

  // Siren Audio Test Button
  const sirenBtn = document.getElementById('dispatch-siren-btn');
  if (sirenBtn) {
    sirenBtn.onclick = handleAcousticSirenTest;
  }

  // Clear Form Button
  const clearBtn = document.getElementById('dispatch-clear-btn');
  if (clearBtn) {
    clearBtn.onclick = () => {
      if (msgInput) {
        msgInput.value = '';
        updateCharCount();
        updatePhonePreview('');
      }
      showToast('Composer cleared', 'info');
    };
  }

  // Send Broadcast Button
  if (sendBtn) {
    sendBtn.onclick = handleBroadcastDispatch;
  }

  // History Table Filter
  const filterTierSelect = document.getElementById('dispatch-filter-tier');
  if (filterTierSelect) {
    filterTierSelect.onchange = () => {
      renderDispatchHistory(cachedDispatchHistory);
    };
  }

  // Refresh log button
  const refreshLogBtn = document.getElementById('dispatch-refresh-log-btn');
  if (refreshLogBtn) {
    refreshLogBtn.onclick = () => {
      fetchJson(`${API_BASE}/api/alerts/history`).then(hist => {
        if (hist) {
          cachedDispatchHistory = hist;
          renderDispatchHistory(hist);
          showToast('Audit trail refreshed', 'info');
        }
      });
    };
  }

  // Export CSV button
  const exportBtn = document.getElementById('dispatch-export-btn');
  if (exportBtn) {
    exportBtn.onclick = () => {
      window.open(`${API_BASE}/api/alerts/export-csv`, '_blank');
      showToast('Exporting dispatch audit logs (CSV)...', 'info');
    };
  }

  // Clear History button
  const clearLogBtn = document.getElementById('dispatch-clear-log-btn');
  if (clearLogBtn) {
    clearLogBtn.onclick = async () => {
      if (!confirm('Are you sure you want to clear the dispatch audit log history?')) return;
      try {
        const res = await fetch(`${API_BASE}/api/alerts/clear-history`, { method: 'DELETE' });
        if (res.ok) {
          cachedDispatchHistory = [];
          renderDispatchHistory([]);
          showToast('Dispatch audit history cleared', 'info');
        }
      } catch (err) {
        console.error('Clear history error:', err);
      }
    };
  }

  // Initial Scope calculation and phone preview
  updateScopeMetrics();
  updateCharCount();
  if (msgInput && msgInput.value) {
    updatePhonePreview(msgInput.value);
  }
}

// ---------------------------------------------------------------------------
// Broadcast Helper Functions
// ---------------------------------------------------------------------------
function updateScopeMetrics() {
  const wardSelect = document.getElementById('dispatch-zone');
  const audienceSelect = document.getElementById('dispatch-audience');
  const kpiPop = document.getElementById('kpi-target-pop');
  const kpiCoverage = document.getElementById('kpi-ward-coverage');
  const kpiTowers = document.getElementById('kpi-cell-towers');
  const kpiReach = document.getElementById('kpi-est-reach');
  const popBadge = document.getElementById('dispatch-pop-scope');

  const wardKey = wardSelect ? wardSelect.value : 'all';
  const audience = audienceSelect ? audienceSelect.value : 'General Public';

  const wardInfo = WARD_POPULATION_MAP[wardKey] || WARD_POPULATION_MAP['all'];
  const cohortRatio = COHORT_RATIOS[audience] || 1.0;

  let calculatedPop = Math.round(wardInfo.pop * cohortRatio);
  if (selectedDispatchMode === 'direct') {
    calculatedPop = 1;
  }

  if (kpiPop) kpiPop.textContent = `${calculatedPop.toLocaleString()}`;
  if (popBadge) popBadge.textContent = `${calculatedPop.toLocaleString()} recipients`;

  if (kpiCoverage) {
    if (selectedDispatchMode === 'direct') {
      kpiCoverage.textContent = 'Single Handset (E.164 Direct)';
    } else {
      kpiCoverage.textContent = wardInfo.name.length > 25 ? wardInfo.name.slice(0, 24) + '...' : wardInfo.name;
    }
  }

  if (kpiTowers) {
    if (selectedDispatchMode === 'direct') {
      kpiTowers.textContent = '1 BTS Tower';
    } else {
      kpiTowers.textContent = `${wardInfo.towers} Active Towers`;
    }
  }

  if (kpiReach) {
    if (selectedDispatchMode === 'direct') {
      kpiReach.textContent = '100% Direct Handset';
    } else {
      kpiReach.textContent = selectedChannel === 'CAP_CELL' ? '99.8% (Zero Dropped)' : '98.4% ETA <20s';
    }
  }

  updateCostEstimate(calculatedPop);
}

function updateCostEstimate(recipients) {
  const costEl = document.getElementById('dispatch-cost-estimate');
  if (!costEl) return;

  if (selectedDispatchMode === 'direct') {
    costEl.textContent = 'Est: ₹0.22 (Sandbox Direct)';
    return;
  }

  let ratePerRecip = 0.12;
  if (selectedChannel === 'WhatsApp') ratePerRecip = 0.28;
  else if (selectedChannel === 'CAP_CELL') ratePerRecip = 0.0; // Gov cell broadcast is zero-rated
  else if (selectedChannel === 'VOICE_IVR') ratePerRecip = 0.45;

  const total = Math.round(recipients * ratePerRecip);
  if (selectedChannel === 'CAP_CELL') {
    costEl.textContent = 'Zero-Rated (Gov Emergency CAP)';
  } else {
    costEl.textContent = `Est. Cost: ₹${total.toLocaleString()}`;
  }
}

function updateCharCount() {
  const msgInput = document.getElementById('dispatch-message');
  const charCountEl = document.getElementById('dispatch-char-count');
  if (!msgInput || !charCountEl) return;

  const len = msgInput.value.length;
  if (selectedChannel === 'SMS') {
    const parts = Math.ceil(len / 160) || 1;
    charCountEl.textContent = `${len} / 160 chars ${parts > 1 ? `(${parts} SMS segments)` : ''}`;
    charCountEl.style.color = len > 160 ? '#f59e0b' : '#64748b';
  } else if (selectedChannel === 'WhatsApp') {
    charCountEl.textContent = `${len} / 1024 chars (WhatsApp Rich Advisory)`;
    charCountEl.style.color = len > 1000 ? '#ef4444' : '#64748b';
  } else if (selectedChannel === 'CAP_CELL') {
    charCountEl.textContent = `${len} / 90 chars (CAP Cell Broadcast Alert)`;
    charCountEl.style.color = len > 90 ? '#ef4444' : '#64748b';
  } else {
    charCountEl.textContent = `${len} chars (IVR Speech Script)`;
    charCountEl.style.color = '#64748b';
  }
}

function updatePhonePreview(text) {
  const smartMsgEl = document.getElementById('phone-msg-text');
  const smartTimeEl = document.getElementById('phone-msg-time');
  const fpBodyEl = document.getElementById('fp-body');
  const fpTimeEl = document.getElementById('fp-time');

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const displayText = text || 'Your broadcast preview will appear here...';

  if (smartMsgEl) smartMsgEl.textContent = displayText;
  if (smartTimeEl) smartTimeEl.textContent = timeStr;
  if (fpBodyEl) fpBodyEl.textContent = displayText;
  if (fpTimeEl) fpTimeEl.textContent = timeStr;
}

function syncChannelPreview(channelKey) {
  const iconEl = document.getElementById('phone-channel-icon');
  const labelEl = document.getElementById('phone-channel-label');

  if (channelKey === 'SMS') {
    if (iconEl) iconEl.textContent = '📱';
    if (labelEl) labelEl.textContent = 'Messages (SMS / TRAI DLT)';
  } else if (channelKey === 'WhatsApp') {
    if (iconEl) iconEl.textContent = '💬';
    if (labelEl) labelEl.textContent = 'Delhi HeatShield (WhatsApp)';
  } else if (channelKey === 'CAP_CELL') {
    if (iconEl) iconEl.textContent = '🚨';
    if (labelEl) labelEl.textContent = 'EMERGENCY CELL BROADCAST';
  } else if (channelKey === 'VOICE_IVR') {
    if (iconEl) iconEl.textContent = '📞';
    if (labelEl) labelEl.textContent = 'NDMA Voice Dispatch (1077)';
  }
}

function syncTierPreview(tier) {
  const badgeEl = document.getElementById('phone-alert-badge');
  if (!badgeEl) return;
  const tierMap = {
    1: 'LEVEL 1: NORMAL HEATWATCH',
    2: 'LEVEL 2: YELLOW ADVISORY',
    3: 'LEVEL 3: ORANGE SEVERE ALERT',
    4: 'LEVEL 4: RED EXTREME EMERGENCY',
    5: 'LEVEL 5: CATASTROPHIC HAP DISPATCH'
  };
  badgeEl.textContent = tierMap[tier] || `LEVEL ${tier} ALERT`;
}

function getTierName(tier) {
  const names = { 1: 'Normal', 2: 'Yellow', 3: 'Orange', 4: 'Red Extreme', 5: 'Catastrophic' };
  return names[tier] || 'Standard';
}

function getTierColor(tier) {
  const colors = { 1: '#10b981', 2: '#eab308', 3: '#f97316', 4: '#ef4444', 5: '#dc2626' };
  return colors[tier] || '#10b981';
}

function insertVariableText(varKey) {
  const msgInput = document.getElementById('dispatch-message');
  if (!msgInput) return;

  const currentTemp = state.weatherData && state.weatherData.current ? `${Math.round(state.weatherData.current.temperature_2m || 43.5)}°C` : '43.8°C';
  const feelsLike = state.thermalStressData ? `${Math.round(state.thermalStressData.heat_index || 48.2)}°C` : '48.2°C';
  const wardSelect = document.getElementById('dispatch-zone');
  const wardName = wardSelect && wardSelect.selectedIndex >= 0 ? wardSelect.options[wardSelect.selectedIndex].text.split('(')[0].trim() : 'Delhi NCR';

  let replacement = '';
  if (varKey === '{TEMP}') replacement = currentTemp;
  else if (varKey === '{FEELS_LIKE}') replacement = feelsLike;
  else if (varKey === '{WARD_NAME}') replacement = wardName;
  else if (varKey === '{SHELTER_URL}') replacement = 'https://delhi.gov.in/heat-shelters';
  else if (varKey === '{HELPLINE_1077}') replacement = '1077';

  const start = msgInput.selectionStart || msgInput.value.length;
  const end = msgInput.selectionEnd || msgInput.value.length;
  msgInput.value = msgInput.value.substring(0, start) + replacement + msgInput.value.substring(end);
  msgInput.focus();
  msgInput.selectionStart = msgInput.selectionEnd = start + replacement.length;

  updateCharCount();
  updatePhonePreview(msgInput.value);
}

function applyTemplateByName(tpl) {
  const msgInput = document.getElementById('dispatch-message');
  if (!msgInput) return;

  const currentTemp = state.weatherData && state.weatherData.current ? `${Math.round(state.weatherData.current.temperature_2m || 43.5)}°C` : '43.8°C';
  const wardSelect = document.getElementById('dispatch-zone');
  const wardName = wardSelect && wardSelect.selectedIndex >= 0 ? wardSelect.options[wardSelect.selectedIndex].text.split('(')[0].trim() : 'Delhi NCR';

  let text = '';
  if (tpl === 'sms') {
    text = `🚨 [DELHI DDMA L3 HEAT ALERT] ${wardName}: Temp ${currentTemp}. Avoid outdoor direct sun 11AM-4PM. Drink ORS/water. Shaded cooling shelters active. Emergency: 1077.`;
  } else if (tpl === 'whatsapp') {
    text = `🚨 *DELHI DISASTER MANAGEMENT AUTHORITY (DDMA)*\n*URGENT HEATWAVE ADVISORY — ${wardName}*\n\n⚠️ *Current Temp:* ${currentTemp} (Extreme Heatwave)\n🚰 *Hydration:* Drink electro-lite/ORS every 20 mins.\n🛑 *Mandate:* Outdoor physical work suspended 11:30AM - 4:00PM.\n🏥 *Cooling Shelters:* Open 24/7 with misting fans & medical staff.\n📞 *Helpline:* Dial 1077 for immediate emergency medical transport.`;
  } else if (tpl === 'hap') {
    text = `🚨 MUNICIPAL HEAT ACTION PLAN ALERT: Cooling centers activated citywide. All outdoor construction banned 11AM-4PM. Pre-position EMS at high-risk transit hubs.`;
  } else if (tpl === 'vulnerable') {
    text = `⚠️ [HEALTH ALERT - HIGH RISK COHORT] ${wardName}: Keep elderly, cardiac patients & children indoors in shaded/ventilated rooms. Sponge with cool water. Call 1077 if fever or confusion.`;
  }

  msgInput.value = text;
  updateCharCount();
  updatePhonePreview(text);
  showToast(`Applied ${tpl.toUpperCase()} advisory template`, 'info');
}

function applyLanguageTemplate(lang) {
  const msgInput = document.getElementById('dispatch-message');
  if (!msgInput || !msgInput.value) return;

  const currentTemp = state.weatherData && state.weatherData.current ? `${Math.round(state.weatherData.current.temperature_2m || 43.5)}°C` : '43.8°C';
  const wardSelect = document.getElementById('dispatch-zone');
  const wardName = wardSelect && wardSelect.selectedIndex >= 0 ? wardSelect.options[wardSelect.selectedIndex].text.split('(')[0].trim() : 'दिल्ली एनसीआर';

  if (lang === 'hi') {
    msgInput.value = `🚨 [दिल्ली डीडीएमए भीषण लू चेतावनी] ${wardName}: तापमान ${currentTemp} पहुंचा। दोपहर 11 से 4 बजे तक धूप में निकलने से बचें। खूब ओआरएस/पानी पिएं। निकटतम राहत केंद्र जाएं। हेल्पलाइन: 1077`;
  } else if (lang === 'ur') {
    msgInput.value = `🚨 [دہلی ڈیزاسٹر مینجمنٹ اتھارٹی - شدید گرمی کی وارننگ] ${wardName}: درجہ حرارت ${currentTemp}۔ صبح 11 تا شام 4 بجے تک دھوپ میں کام کرنے سے گریز کریں۔ او آر ایس پئیں اور کولنگ سینٹر کا رخ کریں۔ ایمرجنسی: 1077`;
  } else {
    msgInput.value = `🚨 [DELHI DDMA L3 HEAT ALERT] ${wardName}: Temp ${currentTemp}. Avoid outdoor direct sun 11AM-4PM. Drink ORS/water. Shaded cooling shelters active. Emergency: 1077.`;
  }
  updateCharCount();
  updatePhonePreview(msgInput.value);
}

// ---------------------------------------------------------------------------
// AI Advisory Generation Controller
// ---------------------------------------------------------------------------
async function handleAiAdvisoryGenerate() {
  const aiBtn = document.getElementById('dispatch-ai-btn');
  const msgInput = document.getElementById('dispatch-message');
  const wardSelect = document.getElementById('dispatch-zone');
  const audienceSelect = document.getElementById('dispatch-audience');

  const wardName = wardSelect && wardSelect.selectedIndex >= 0 ? wardSelect.options[wardSelect.selectedIndex].text : 'All Delhi NCR';
  const audience = audienceSelect ? audienceSelect.value : 'General Public';

  const currentTemp = state.weatherData && state.weatherData.current ? state.weatherData.current.temperature_2m : 43.5;
  const heatIndex = state.thermalStressData ? state.thermalStressData.heat_index : 48.2;
  const wbgt = state.thermalStressData ? state.thermalStressData.wbgt : 33.4;

  if (aiBtn) {
    aiBtn.disabled = true;
    aiBtn.innerHTML = '<span class="ai-sparkle">⏳</span> AI Drafting...';
  }

  appendTerminalLog(`Invoking Gemini Biometeorological Advisor: Temp=${currentTemp}°C, WBGT=${wbgt}°C, Lang=${selectedLang.toUpperCase()}`);

  try {
    const res = await fetch(`${API_BASE}/api/alerts/generate-ai-advisory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        temp: currentTemp,
        heat_index: heatIndex,
        wbgt: wbgt,
        audience: audience,
        tier: selectedTier,
        lang: selectedLang,
        zone: wardName
      })
    });

    if (!res.ok) throw new Error('AI generation failed');
    const data = await safeJson(res);

    const advisoryText = data ? (data.advisory || data.directive) : null;
    if (advisoryText) {
      if (msgInput) {
        msgInput.value = advisoryText;
        updateCharCount();
        updatePhonePreview(advisoryText);
      }
      showToast(`AI Advisory generated (${selectedLang.toUpperCase()})`, 'info');
      appendTerminalLog(`Gemini synthesis completed successfully (${advisoryText.length} chars)`);
    } else {
      throw new Error('Empty AI response');
    }
  } catch (err) {
    console.error('AI Advisory Error:', err);
    showToast('Failed to generate AI advisory. Applied biometeorological fallback.', 'warning');
    applyTemplateByName('sms');
  } finally {
    if (aiBtn) {
      aiBtn.disabled = false;
      aiBtn.innerHTML = '<span class="ai-sparkle">✨</span> AI Auto-Draft';
    }
  }
}

// ---------------------------------------------------------------------------
// Acoustic Siren Test via Web Audio API (NDMA Dual-Tone 853 Hz + 960 Hz)
// ---------------------------------------------------------------------------
function handleAcousticSirenTest() {
  const sirenBtn = document.getElementById('dispatch-siren-btn');
  const alertBadge = document.getElementById('phone-alert-badge');

  if (sirenBtn) sirenBtn.disabled = true;

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      showToast('Web Audio API not supported on this browser', 'warning');
      return;
    }
    const audioCtx = new AudioContextClass();
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';
    // Standard National Emergency Alert System dual-tone frequencies
    osc1.frequency.setValueAtTime(853, audioCtx.currentTime);
    osc2.frequency.setValueAtTime(960, audioCtx.currentTime);

    gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(audioCtx.currentTime + 1.2);
    osc2.stop(audioCtx.currentTime + 1.2);

    appendTerminalLog('Acoustic Siren: 853Hz/960Hz dual-frequency attention signal transmitted');
    showToast('Acoustic Emergency Siren Tested (1.2s Attention Tone)', 'info');

    if (alertBadge) {
      alertBadge.style.animation = 'pulse-ring 0.3s infinite alternate';
      setTimeout(() => {
        alertBadge.style.animation = '';
      }, 1500);
    }
  } catch (err) {
    console.warn('Audio Context error:', err);
    showToast('Siren audio test: volume muted or permission needed', 'info');
  } finally {
    setTimeout(() => {
      if (sirenBtn) sirenBtn.disabled = false;
    }, 1500);
  }
}

// ---------------------------------------------------------------------------
// Terminal Logger Helper
// ---------------------------------------------------------------------------
function appendTerminalLog(message) {
  const terminal = document.getElementById('terminal-feed');
  if (!terminal) return;

  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
  const line = document.createElement('div');
  line.className = 'terminal-line';
  line.innerHTML = `<span style="color:#64748b;">[${timeStr}]</span> <span style="color:#0284c7;">»</span> ${message}`;

  terminal.appendChild(line);
  terminal.scrollTop = terminal.scrollHeight;
}

// ---------------------------------------------------------------------------
// Dispatch Submission Controller
// ---------------------------------------------------------------------------
async function handleBroadcastDispatch() {
  const msgInput = document.getElementById('dispatch-message');
  const audienceSelect = document.getElementById('dispatch-audience');
  const wardSelect = document.getElementById('dispatch-zone');
  const sendBtn = document.getElementById('dispatch-send-btn');
  const directPhoneInput = document.getElementById('dispatch-phone');

  const message = msgInput ? msgInput.value.trim() : '';
  const audience = audienceSelect ? audienceSelect.value : 'General Public';
  const zoneId = wardSelect ? wardSelect.value : 'all';
  const zoneName = wardSelect && wardSelect.selectedIndex >= 0 ? wardSelect.options[wardSelect.selectedIndex].text : 'All Delhi NCR';
  const targetPhone = directPhoneInput ? directPhoneInput.value.trim() : '';

  if (!message) {
    showToast('Please type an alert message or select a template', 'warning');
    return;
  }

  if (selectedDispatchMode === 'direct' && !targetPhone) {
    showToast('Please enter a target mobile number for Direct Handset mode', 'warning');
    if (directPhoneInput) directPhoneInput.focus();
    return;
  }

  if (sendBtn) {
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<span id="dispatch-send-icon">⏳</span> TRANSMITTING OVER TELECOM MESH...';
  }

  appendTerminalLog(`Initiating dispatch handshake: Mode=${selectedDispatchMode}, Channel=${selectedChannel}, Zone=${zoneId}`);

  try {
    const payload = {
      mode: selectedDispatchMode,
      zone_id: zoneId,
      zone: zoneName,
      audience: audience,
      channel: selectedChannel,
      alert_tier: selectedTier,
      message: message,
      language: selectedLang,
      target_phone: targetPhone
    };

    const res = await fetch(`${API_BASE}/api/alerts/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errJson = await safeJson(res);
      throw new Error(errJson && errJson.error ? errJson.error : 'Dispatch transmission rejected');
    }

    const result = await safeJson(res);
    if (!result) throw new Error('Invalid dispatch server response');

    // Populate and show the transmission receipt card
    const card = document.getElementById('dispatch-result-card');
    if (card) {
      card.style.display = 'block';
      const idEl = document.getElementById('res-dispatch-id');
      const timeEl = document.getElementById('res-timestamp');
      const chEl = document.getElementById('res-channel');
      const audEl = document.getElementById('res-audience');
      const recEl = document.getElementById('res-recipients');
      const delEl = document.getElementById('res-delivered');
      const rateEl = document.getElementById('res-rate');
      const costEl = document.getElementById('res-cost');
      const latEl = document.getElementById('res-latency');
      const gwEl = document.getElementById('res-gateways');

      if (idEl) idEl.textContent = result.dispatch_id || 'DISP-OK';
      if (timeEl) timeEl.textContent = (result.timestamp || new Date().toISOString()).slice(11, 19) + ' IST';
      if (chEl) chEl.textContent = result.channel || selectedChannel;
      if (audEl) audEl.textContent = result.audience || audience;
      if (recEl) recEl.textContent = (result.total_recipients || 0).toLocaleString();
      if (delEl) delEl.textContent = (result.delivered || 0).toLocaleString();
      if (rateEl) rateEl.textContent = `${result.delivery_rate_pct || 98.4}%`;
      if (costEl) costEl.textContent = `₹${(result.estimated_cost_inr || 0).toLocaleString()}`;
      if (latEl) latEl.textContent = `${result.latency_ms || 320} ms`;
      if (gwEl) gwEl.textContent = result.routing_gateways || 'Airtel, Jio, Vi (TRAI DLT)';
    }

    appendTerminalLog(`ACK Received: ID=${result.dispatch_id} | Delivered=${(result.delivered || 0).toLocaleString()} (${result.delivery_rate_pct}%)`);
    showToast(`Transmission complete! ID: ${result.dispatch_id}`, 'info');

    // Refresh history
    const hist = await fetchJson(`${API_BASE}/api/alerts/history`);
    if (hist) {
      cachedDispatchHistory = hist;
      renderDispatchHistory(hist);
    }
  } catch (err) {
    console.error('Dispatch error:', err);
    appendTerminalLog(`ERROR: Transmission failed - ${err.message}`);
    showToast(`Dispatch failed: ${err.message}`, 'error');
  } finally {
    if (sendBtn) {
      sendBtn.disabled = false;
      if (selectedDispatchMode === 'direct') {
        sendBtn.innerHTML = '<span id="dispatch-send-icon">📲</span> TRANSMIT DIRECT TEST SMS';
      } else {
        sendBtn.innerHTML = '<span id="dispatch-send-icon">📡</span> BROADCAST NOW TO CITIZENS';
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Render Dispatch History Audit Table
// ---------------------------------------------------------------------------
function renderDispatchHistory(history) {
  const tbody = document.getElementById('dispatch-log-tbody');
  const countBadge = document.getElementById('dispatch-log-count');
  const filterSelect = document.getElementById('dispatch-filter-tier');

  if (!tbody) return;

  cachedDispatchHistory = history || [];

  let filtered = [...cachedDispatchHistory];
  if (filterSelect && filterSelect.value !== 'all') {
    const tierFilter = parseInt(filterSelect.value, 10);
    filtered = filtered.filter(h => h.alert_tier === tierFilter);
  }

  if (countBadge) {
    countBadge.textContent = `${filtered.length} Dispatches`;
  }

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="dispatch-log-empty">No broadcast transmissions found for the selected filter.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.slice(0, 15).map(h => {
    const timeDisplay = h.timestamp ? (h.timestamp.includes('T') ? h.timestamp.split('T')[1].slice(0, 8) : h.timestamp.slice(11, 19)) : '--:--:--';
    const channelIcon = h.channel === 'WhatsApp' ? '💬 WhatsApp' : (h.channel === 'CAP_CELL' ? '🚨 CAP Cell' : (h.channel === 'VOICE_IVR' ? '📞 IVR' : '📱 SMS'));
    const isDirect = h.mode === 'direct';

    return `
      <tr>
        <td style="color:#0284c7; font-family:var(--font-mono); font-weight:700;">${h.dispatch_id}</td>
        <td style="font-family:var(--font-mono); font-size:0.72rem; color:var(--text-secondary);">${timeDisplay}</td>
        <td style="font-weight:600;">${channelIcon} ${isDirect ? '<span style="font-size:0.65rem; color:#facc15;">(Direct)</span>' : ''}</td>
        <td>${h.audience || 'General Public'}</td>
        <td style="font-family:var(--font-mono);">${(h.total_recipients || 0).toLocaleString()}</td>
        <td style="font-family:var(--font-mono); color:#10b981;">${(h.delivered || 0).toLocaleString()} <span style="font-size:0.7rem; color:var(--text-muted);">(${h.delivery_rate_pct || 98}%)</span></td>
        <td><span class="dispatch-badge-pill" style="background:rgba(255,255,255,0.06); color:${getTierColor(h.alert_tier)}; border:1px solid ${getTierColor(h.alert_tier)}40;">L${h.alert_tier || 3}</span></td>
        <td><span style="color:#10b981; font-weight:700; font-family:var(--font-mono); font-size:0.72rem;">● ${h.status || 'DELIVERED'}</span></td>
      </tr>
    `;
  }).join('');
}

// ---------------------------------------------------------------------------
// 5. WHAT-IF POLICY INTERVENTION SIMULATOR CONTROLLER
// ---------------------------------------------------------------------------
let currentSimHi = 42.0;
let currentSimHvi = 0.55;
let simDebounceTimer = null;

function setupScenarioSimulator(stressData, epiData) {
  if (stressData && stressData.indices) {
    currentSimHi = stressData.indices.heat_index || 42.0;
  }
  if (epiData && epiData.hvi) {
    currentSimHvi = epiData.hvi;
  }

  // Sliders
  const tempSlider = document.getElementById('sim-temp-slider');
  const rhSlider = document.getElementById('sim-rh-slider');
  const tempValEl = document.getElementById('sim-temp-val');
  const rhValEl = document.getElementById('sim-rh-val');

  if (tempSlider && tempValEl) {
    tempSlider.oninput = () => {
      const v = parseFloat(tempSlider.value);
      tempValEl.textContent = `${v >= 0 ? '+' : ''}${v.toFixed(1)}°C`;
      triggerSimulation();
    };
  }

  if (rhSlider && rhValEl) {
    rhSlider.oninput = () => {
      const v = parseFloat(rhSlider.value);
      rhValEl.textContent = `${v >= 0 ? '+' : ''}${v}%`;
      triggerSimulation();
    };
  }

  // Checkboxes
  const policyCheckboxes = [
    'policy-cool-roofs',
    'policy-labor-curfew',
    'policy-urban-greenery',
    'policy-slum-kits',
    'policy-cooling-shelters'
  ];

  policyCheckboxes.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.onchange = triggerSimulation;
    }
  });

  // Run initial simulation
  triggerSimulation();
}

function triggerSimulation() {
  if (simDebounceTimer) clearTimeout(simDebounceTimer);
  simDebounceTimer = setTimeout(runSimulation, 150);
}

async function runSimulation() {
  const activeInterventions = [];
  if (document.getElementById('policy-cool-roofs')?.checked) activeInterventions.push('cool_roofs');
  if (document.getElementById('policy-labor-curfew')?.checked) activeInterventions.push('labor_curfew');
  if (document.getElementById('policy-urban-greenery')?.checked) activeInterventions.push('urban_greenery');
  if (document.getElementById('policy-slum-kits')?.checked) activeInterventions.push('slum_cool_kits');
  if (document.getElementById('policy-cooling-shelters')?.checked) activeInterventions.push('cooling_shelters');

  const tempOffset = parseFloat(document.getElementById('sim-temp-slider')?.value || '0');
  const rhOffset = parseFloat(document.getElementById('sim-rh-slider')?.value || '0');

  try {
    const res = await fetch(`${API_BASE}/api/policy-modeler`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        heat_index: currentSimHi,
        hvi: currentSimHvi,
        population: 2000000,
        interventions: activeInterventions,
        temp_offset: tempOffset,
        humidity_offset: rhOffset
      })
    });

    if (!res.ok) return;
    const data = await safeJson(res);
    if (data) renderSimulationResults(data);
  } catch (err) {
    console.error('Simulation error:', err);
  }
}

function renderSimulationResults(data) {
  const net = data.net_impact || {};
  const base = data.baseline || {};
  const intv = data.intervened || {};

  // Hero Stats
  const livesEl = document.getElementById('sim-lives-saved');
  const admEl = document.getElementById('sim-averted-adm');
  const gridEl = document.getElementById('sim-grid-shaved');

  if (livesEl) livesEl.textContent = `+${net.lives_saved || 0}`;
  if (admEl) admEl.textContent = `+${net.averted_admissions || 0}`;
  if (gridEl) gridEl.textContent = `-${net.grid_demand_shaved_mw || 0} MW`;

  // Comparison Table
  const setTxt = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setTxt('comp-base-hi', `${base.heat_index}°C`);
  setTxt('comp-int-hi', `${intv.heat_index}°C`);
  setTxt('comp-diff-hi', `-${net.uhi_temperature_drop_c}°C`);

  setTxt('comp-base-hvi', base.hvi);
  setTxt('comp-int-hvi', intv.hvi);
  setTxt('comp-diff-hvi', `-${Math.round((1 - intv.hvi / (base.hvi || 1)) * 100)}%`);

  setTxt('comp-base-mort', `+${base.excess_mortality_pct}%`);
  setTxt('comp-int-mort', `+${intv.excess_mortality_pct}%`);
  setTxt('comp-diff-mort', `-${net.mortality_reduction_pct}%`);

  const economicCr = ((net.estimated_economic_savings_inr || 0) / 10000000).toFixed(2);
  setTxt('comp-economic-val', `₹${economicCr} Crore Estimated Economic Value`);
}

// ---------------------------------------------------------------------------
// 6. HISTORICAL BENCHMARKS CONTROLLER
// ---------------------------------------------------------------------------
async function loadHistoricalBenchmarks() {
  const col = document.getElementById('history-cards-col');
  const timeEl = document.getElementById('hap-report-time');

  if (timeEl) {
    timeEl.textContent = new Date().toUTCString();
  }

  try {
    const res = await fetch(`${API_BASE}/api/historical-benchmarks?lat=${state.lat}&lon=${state.lon}`);
    if (!res.ok) return;
    const data = await safeJson(res);
    const benchmarks = data?.all_benchmarks || [];

    if (col) {
      col.innerHTML = benchmarks.map(b => `
        <div class="history-event-card" style="border-left-color: ${b.color};">
          <div class="hist-event-title">${b.name}</div>
          <div class="hist-event-loc">📍 ${b.location} (${b.year})</div>
          <div class="hist-event-stats">
            <div class="hist-stat-item">Peak Temp: <b class="hist-stat-val">${b.peak_temperature_c}°C</b></div>
            <div class="hist-stat-item">Peak HI: <b class="hist-stat-val">${b.peak_heat_index_c}°C</b></div>
            <div class="hist-stat-item">Excess Deaths: <b class="hist-stat-val" style="color:${b.color};">${b.total_excess_deaths.toLocaleString()}</b></div>
            <div class="hist-stat-item">HAP Active: <b class="hist-stat-val">${b.hap_active ? '✅ Yes' : '❌ No'}</b></div>
          </div>
          <div class="hist-event-lesson">💡 <b>Impact:</b> ${b.lessons_learned}</div>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('Historical benchmarks error:', err);
  }
}



// ---------------------------------------------------------------------------
// APPLICATION ROUTER & SIDEBAR MANAGER (Multi-Page Architecture)
// ---------------------------------------------------------------------------
const APP_VIEWS = {
  'telemetry': {
    id: 'view-telemetry',
    category: 'Public Observations',
    title: 'Atmospheric Boundary Telemetry',
    adminOnly: false
  },
  'biomet': {
    id: 'view-biomet',
    category: 'Public Observations',
    title: 'Multi-Model Bio-Thermal Stress Suite',
    adminOnly: false,
    onActivate: () => {
      triggerGaugeCalibration();
    }
  },
  'forecast': {
    id: 'view-forecast',
    category: 'Public Observations',
    title: '48H Trajectory & 7-Day Outlook',
    adminOnly: false,
    onActivate: () => {
      setTimeout(() => {
        if (hourlyChart) hourlyChart.resize();
      }, 80);
    }
  },
  'shelters': {
    id: 'view-shelters',
    category: 'Public Observations',
    title: 'Air-Conditioned Cooling Sanctuaries',
    adminOnly: false
  },
  'health': {
    id: 'view-health',
    category: 'Public Observations',
    title: 'Clinical Guidance, Hydration & Triage',
    adminOnly: false
  },
  'map': {
    id: 'view-map',
    category: 'Public Observations',
    title: 'Global Heat Risk Radar Map',
    adminOnly: false,
    onActivate: () => {
      setTimeout(() => {
        if (heatMap) heatMap.invalidateSize();
      }, 100);
    }
  },
  'ward-gis': {
    id: 'view-ward',
    category: 'Civil Defense Command',
    title: 'Hyper-Local Ward GIS Chloropleth',
    adminOnly: true,
    onActivate: () => {
      setTimeout(() => {
        if (state.wardMap) state.wardMap.invalidateSize();
      }, 100);
    }
  },
  'epi-surge': {
    id: 'view-epi',
    category: 'Civil Defense Command',
    title: 'Epidemiological Surge & Mortality Model',
    adminOnly: true,
    onActivate: () => {
      setTimeout(() => {
        if (state.epiChart) state.epiChart.resize();
      }, 80);
    }
  },
  'hap-directives': {
    id: 'view-hap',
    category: 'Civil Defense Command',
    title: 'Municipal Heat Action Plan Directives',
    adminOnly: true
  },
  'dispatch': {
    id: 'view-dispatch',
    category: 'Civil Defense Command',
    title: 'Emergency Multi-Channel Alert Gateway',
    adminOnly: true
  },
  'sim-sitrep': {
    id: 'view-sim',
    category: 'Civil Defense Command',
    title: 'Policy Modeler & SitRep Export',
    adminOnly: true
  }
};

let currentViewKey = 'telemetry';

window.navigateToView = function navigateToView(viewKey, pushHash = true) {
  if (!APP_VIEWS[viewKey]) {
    viewKey = 'telemetry';
  }

  const viewConfig = APP_VIEWS[viewKey];
  const isAdmin = document.body.classList.contains('is-admin');

  if (viewConfig.adminOnly && !isAdmin) {
    showToast('Official clearance required. Click "Admin Demo" in the top bar to unlock.', 'warning');
    const adminBtn = document.getElementById('btn-quick-admin-demo');
    if (adminBtn) {
      adminBtn.classList.add('pulse-attention');
      setTimeout(() => adminBtn.classList.remove('pulse-attention'), 2000);
    }
  }

  currentViewKey = viewKey;

  // 1. Smooth scroll to target view section with satisfying animation
  const targetEl = document.getElementById(viewConfig.id);
  if (targetEl) {
    const stickyNav = document.getElementById('sticky-top-nav-bar');
    const appHeader = document.querySelector('.app-header');
    const headerH = appHeader ? appHeader.offsetHeight : 58;
    const navH = stickyNav ? stickyNav.offsetHeight : 44;
    const offset = headerH + navH + 16;

    const rect = targetEl.getBoundingClientRect();
    const targetY = window.pageYOffset + rect.top - offset;

    window.scrollTo({
      top: Math.max(0, targetY),
      behavior: 'smooth'
    });

    // Tactile arrival pulse animation
    targetEl.classList.remove('section-target-highlight');
    void targetEl.offsetWidth; // trigger reflow
    targetEl.classList.add('section-target-highlight');
    setTimeout(() => {
      targetEl.classList.remove('section-target-highlight');
    }, 1500);
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 2. Update top navigation active pills & auto-center in scroller
  updateTopNavActiveState(viewConfig.id);

  // 3. Update top breadcrumbs
  const bcCategory = document.getElementById('bc-category');
  const bcCurrent = document.getElementById('bc-current');
  const bcStation = document.getElementById('bc-station-tag');
  if (bcCategory) bcCategory.textContent = viewConfig.category;
  if (bcCurrent) bcCurrent.textContent = viewConfig.title;
  if (bcStation && state.locationName) bcStation.textContent = state.locationName;

  // 4. Update hash in browser URL
  if (pushHash && window.location.hash !== `#/${viewKey}`) {
    if (window.history && window.history.pushState) {
      window.history.pushState(null, '', `#/${viewKey}`);
    } else {
      window.location.hash = `#/${viewKey}`;
    }
  }

  // 5. Invoke any view activation hooks (e.g. Leaflet map / Chart.js resize)
  if (typeof viewConfig.onActivate === 'function') {
    try {
      viewConfig.onActivate();
    } catch (e) {
      console.warn('View activation hook error:', e);
    }
  }
};

function updateTopNavActiveState(activeTargetId) {
  const pills = document.querySelectorAll('.top-nav-pill');
  pills.forEach(pill => {
    const target = pill.getAttribute('data-target');
    if (target === activeTargetId) {
      pill.classList.add('active');

      // Ensure active pill is smoothly centered in horizontal scroller
      const scroller = document.getElementById('top-nav-scroller');
      if (scroller) {
        const pillLeft = pill.offsetLeft;
        const pillWidth = pill.offsetWidth;
        const scrollerWidth = scroller.offsetWidth;
        const currentScroll = scroller.scrollLeft;

        if (pillLeft < currentScroll || pillLeft + pillWidth > currentScroll + scrollerWidth) {
          scroller.scrollTo({
            left: Math.max(0, pillLeft - (scrollerWidth / 2) + (pillWidth / 2)),
            behavior: 'smooth'
          });
        }
      }
    } else {
      pill.classList.remove('active');
    }
  });
}

function initSidebarAndRouter() {
  // Bind click handlers to top navigation pills
  const navPills = document.querySelectorAll('.top-nav-pill');
  navPills.forEach(pill => {
    pill.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = pill.getAttribute('data-target');
      const viewKey = Object.keys(APP_VIEWS).find(k => APP_VIEWS[k].id === targetId) || 'telemetry';
      navigateToView(viewKey, true);
    });
  });

  // Quick Top button in nav bar
  const btnQuickTop = document.getElementById('btn-quick-top');
  if (btnQuickTop) {
    btnQuickTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Floating Back to Top Button
  const btnFloatingTop = document.getElementById('btn-floating-top');
  if (btnFloatingTop) {
    btnFloatingTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ScrollSpy: dynamically reflect active section as user scrolls
  let scrollTimeout = null;
  const sectionIds = Object.values(APP_VIEWS).map(v => v.id);

  window.addEventListener('scroll', () => {
    // Show/hide floating back to top button
    if (btnFloatingTop) {
      if (window.pageYOffset > 320) {
        btnFloatingTop.classList.add('visible');
      } else {
        btnFloatingTop.classList.remove('visible');
      }
    }

    if (scrollTimeout) return;
    scrollTimeout = setTimeout(() => {
      scrollTimeout = null;

      const offsetThreshold = 180;
      let activeId = sectionIds[0];

      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.classList.contains('admin-only') && !document.body.classList.contains('is-admin')) {
          continue;
        }
        const top = el.getBoundingClientRect().top;
        if (top <= offsetThreshold) {
          activeId = id;
        }
      }

      if (activeId) {
        updateTopNavActiveState(activeId);
        const activeKey = Object.keys(APP_VIEWS).find(k => APP_VIEWS[k].id === activeId);
        if (activeKey && APP_VIEWS[activeKey]) {
          const bcCategory = document.getElementById('bc-category');
          const bcCurrent = document.getElementById('bc-current');
          if (bcCategory) bcCategory.textContent = APP_VIEWS[activeKey].category;
          if (bcCurrent) bcCurrent.textContent = APP_VIEWS[activeKey].title;
        }
      }
    }, 60);
  }, { passive: true });

  // Handle URL hash changes (browser back / forward)
  window.addEventListener('hashchange', () => {
    const rawHash = window.location.hash.replace(/^#\/?/, '').replace(/^\//, '');
    if (rawHash && APP_VIEWS[rawHash]) {
      navigateToView(rawHash, false);
    }
  });

  // Resolve initial route from hash or pathname
  const initialHash = window.location.hash.replace(/^#\/?/, '').replace(/^\//, '');
  const initialPath = window.location.pathname.replace(/^\//, '');
  const startView = (initialHash && APP_VIEWS[initialHash])
    ? initialHash
    : ((initialPath && APP_VIEWS[initialPath]) ? initialPath : 'telemetry');

  if (startView && startView !== 'telemetry') {
    setTimeout(() => {
      navigateToView(startView, false);
    }, 150);
  }
}

function updateSidebarTelemetry() {
  const stationName = document.getElementById('sidebar-station-name');
  const stationTemp = document.getElementById('sidebar-station-temp');
  const stationCond = document.getElementById('sidebar-station-condition');
  const bcStation = document.getElementById('bc-station-tag');

  if (stationName && state.locationName) {
    stationName.textContent = state.locationName;
  }
  if (stationTemp && state.currentData) {
    stationTemp.textContent = `${Math.round(state.currentData.temperature_2m || 0)}°${state.unit}`;
  }
  if (stationCond) {
    const hi = state.thermalStressData ? Math.round(state.thermalStressData.heat_index_c || 0) : null;
    stationCond.textContent = hi ? `Heat Index: ${hi}°C` : 'Biomet Stream Active';
  }
  if (bcStation && state.locationName) {
    bcStation.textContent = state.locationName;
  }
}

// ---------------------------------------------------------------------------
// 7. USER AUTHENTICATION & ACCESS CONTROL MANAGER
// ---------------------------------------------------------------------------
let currentUser = null;

function getAuthHeaders() {
  const token = localStorage.getItem('heatshield_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function initAuthSystem() {
  const modal = document.getElementById('auth-modal');
  const btnOpen = document.getElementById('btn-auth-open');
  const btnClose = document.getElementById('btn-auth-close');

  if (btnOpen && modal) {
    btnOpen.addEventListener('click', () => {
      openAuthModal();
    });
  }

  if (btnClose && modal) {
    btnClose.addEventListener('click', () => {
      closeAuthModal();
    });
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeAuthModal();
    });
  }

  // Auth Tab Switcher
  const tabBtns = document.querySelectorAll('.auth-tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      switchAuthTab(tab);
    });
  });

  // Login Form
  const formLogin = document.getElementById('form-auth-login');
  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      await performLogin(email, password);
    });
  }

  // Register Form
  const formRegister = document.getElementById('form-auth-register');
  if (formRegister) {
    formRegister.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('reg-name').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-password').value;
      const role = document.getElementById('reg-role').value;
      const org = document.getElementById('reg-org').value.trim();
      await performRegister({ name, email, password, role, organization: org });
    });
  }

  // Fast Demo Login Buttons
  const demoBtns = document.querySelectorAll('.demo-user-card');
  demoBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const email = btn.getAttribute('data-email');
      const pass = btn.getAttribute('data-pass');
      if (email && pass) {
        await performLogin(email, pass);
      }
    });
  });

  // 1-Click Quick Admin Demo Button in Header
  const btnQuickAdmin = document.getElementById('btn-quick-admin-demo');
  if (btnQuickAdmin) {
    btnQuickAdmin.addEventListener('click', async () => {
      const isAdmin = document.body.classList.contains('is-admin');
      if (isAdmin) {
        // Toggle logout back to observer
        await performLogout();
        showToast('Switched back to Public Observer view.', 'info');
      } else {
        const textEl = document.getElementById('btn-quick-admin-text');
        if (textEl) textEl.textContent = 'Activating...';
        await performLogin('admin@heatshield.gov.in', 'admin123');
        showToast('Admin Demo Active: Civil defense modules unlocked.', 'success');
        setTimeout(() => {
          navigateToView('dispatch');
        }, 200);
      }
    });
  }

  // Quick Nav: Broadcast Console link
  const navDispatch = document.getElementById('nav-link-dispatch');
  if (navDispatch) {
    navDispatch.addEventListener('click', async (e) => {
      e.preventDefault();
      if (!document.body.classList.contains('is-admin')) {
        showToast('Unlocking Broadcast Console as Municipal Officer...', 'info');
        await performLogin('admin@heatshield.gov.in', 'admin123');
      }
      setTimeout(() => {
        navigateToView('dispatch');
      }, 200);
    });
  }

  // Google OAuth Login & Register Buttons
  const btnGoogleLogin = document.getElementById('btn-google-login');
  const btnGoogleReg = document.getElementById('btn-google-register');

  if (btnGoogleLogin) {
    console.log('click', () => {
      promptGoogleSignIn();
    });
  }

  if (btnGoogleReg) {
    console.log('click', () => {
      promptGoogleSignIn();
    });
  }

  // Logout Button
  const btnLogout = document.getElementById('btn-auth-logout');
  if (btnLogout) {
    console.log('click', async () => {
      await performLogout();
    });
  }

  // Check initial login state
  await checkAuthStatus();
}

function openAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;
  modal.style.display = 'flex';

  if (currentUser && currentUser.role !== 'GUEST') {
    showLoggedInPanel();
  } else {
    switchAuthTab('login');
  }
}

function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.style.display = 'none';
}

function switchAuthTab(tabName) {
  const tabs = document.querySelectorAll('.auth-tab-btn');
  tabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-tab') === tabName));

  const formLogin = document.getElementById('form-auth-login');
  const formRegister = document.getElementById('form-auth-register');
  const panelFastDemo = document.getElementById('panel-fastdemo');
  const panelLoggedIn = document.getElementById('panel-logged-in');

  if (formLogin) formLogin.style.display = tabName === 'login' ? 'block' : 'none';
  if (formRegister) formRegister.style.display = tabName === 'register' ? 'block' : 'none';
  if (panelFastDemo) panelFastDemo.style.display = tabName === 'fastdemo' ? 'block' : 'none';
  if (panelLoggedIn) panelLoggedIn.style.display = 'none';

  // Clear messages
  const msgLogin = document.getElementById('login-msg-box');
  const msgReg = document.getElementById('reg-msg-box');
  if (msgLogin) msgLogin.style.display = 'none';
  if (msgReg) msgReg.style.display = 'none';
}

function showLoggedInPanel() {
  const formLogin = document.getElementById('form-auth-login');
  const formRegister = document.getElementById('form-auth-register');
  const panelFastDemo = document.getElementById('panel-fastdemo');
  const panelLoggedIn = document.getElementById('panel-logged-in');
  const tabSwitch = document.querySelector('.auth-tab-switch');

  if (formLogin) formLogin.style.display = 'none';
  if (formRegister) formRegister.style.display = 'none';
  if (panelFastDemo) panelFastDemo.style.display = 'none';
  if (tabSwitch) tabSwitch.style.display = 'none';

  if (panelLoggedIn && currentUser) {
    panelLoggedIn.style.display = 'block';
    document.getElementById('active-user-avatar').textContent = currentUser.avatar || 'U';
    document.getElementById('active-user-avatar').style.backgroundColor = currentUser.badge_color || '#0284c7';
    document.getElementById('active-user-name').textContent = currentUser.name || 'User';
    document.getElementById('active-user-email').textContent = currentUser.email || '';
    document.getElementById('active-user-badge').textContent = currentUser.role_label || currentUser.role;
    document.getElementById('active-user-org').textContent = currentUser.organization || '';
  }
}

async function checkAuthStatus() {
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) return;
    const data = await safeJson(res);
    if (data && data.user) {
      currentUser = data.user;
      updateUserHeaderPill(currentUser);
    }
  } catch (err) {
    console.error('Auth check error:', err);
  }
}

async function performLogin(email, password) {
  const msgBox = document.getElementById('login-msg-box');
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = (await safeJson(res)) || {};

    if (!res.ok) {
      if (msgBox) {
        msgBox.textContent = data.error || 'Authentication failed.';
        msgBox.className = 'auth-msg-box msg-error';
        msgBox.style.display = 'block';
      }
      return;
    }

    if (data.token) {
      localStorage.setItem('heatshield_token', data.token);
    }
    if (data.user) {
      currentUser = data.user;
      updateUserHeaderPill(currentUser);
    }

    if (msgBox) {
      msgBox.textContent = `Welcome back, ${currentUser?.name || 'User'}!`;
      msgBox.className = 'auth-msg-box msg-success';
      msgBox.style.display = 'block';
    }

    showToast(`Signed in as ${currentUser?.role_label || 'User'}`, 'success');
    setTimeout(() => {
      closeAuthModal();
    }, 600);
  } catch (err) {
    if (msgBox) {
      msgBox.textContent = 'Server connection error during login.';
      msgBox.className = 'auth-msg-box msg-error';
      msgBox.style.display = 'block';
    }
  }
}

async function performRegister(userData) {
  const msgBox = document.getElementById('reg-msg-box');
  try {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = (await safeJson(res)) || {};

    if (!res.ok) {
      if (msgBox) {
        msgBox.textContent = data.error || 'Registration failed.';
        msgBox.className = 'auth-msg-box msg-error';
        msgBox.style.display = 'block';
      }
      return;
    }

    if (data.token) {
      localStorage.setItem('heatshield_token', data.token);
    }
    if (data.user) {
      currentUser = data.user;
      updateUserHeaderPill(currentUser);
    }

    if (msgBox) {
      msgBox.textContent = 'Account registered successfully!';
      msgBox.className = 'auth-msg-box msg-success';
      msgBox.style.display = 'block';
    }

    showToast(`Account created as ${currentUser?.role_label || 'User'}`, 'success');
    setTimeout(() => {
      closeAuthModal();
    }, 600);
  } catch (err) {
    if (msgBox) {
      msgBox.textContent = 'Server connection error during registration.';
      msgBox.className = 'auth-msg-box msg-error';
      msgBox.style.display = 'block';
    }
  }
}

async function promptGoogleSignIn() {
  // Try native Google GIS if loaded, or prompt with verified Google quick sign-in
  const defaultGoogleUser = {
    name: 'Aarav Sharma',
    email: 'aarav.sharma.weather@gmail.com',
    picture: 'https://lh3.googleusercontent.com/a/default-user',
    google_id: 'g_10847291847291847'
  };

  const userEmail = prompt("Sign in with Google Account:\nEnter Google Email (or leave as default):", defaultGoogleUser.email);
  if (userEmail === null) return; // User cancelled

  const emailToUse = userEmail.trim() || defaultGoogleUser.email;
  const nameToUse = emailToUse.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase());

  await performGoogleAuth({
    email: emailToUse,
    name: nameToUse,
    picture: defaultGoogleUser.picture,
    google_id: defaultGoogleUser.google_id
  });
}

async function performGoogleAuth(googleUser) {
  const msgBox = document.getElementById('login-msg-box') || document.getElementById('reg-msg-box');
  try {
    const res = await fetch(`${API_BASE}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(googleUser)
    });
    const data = (await safeJson(res)) || {};

    if (!res.ok) {
      if (msgBox) {
        msgBox.textContent = data.error || 'Google authentication failed.';
        msgBox.className = 'auth-msg-box msg-error';
        msgBox.style.display = 'block';
      }
      return;
    }

    if (data.token) {
      localStorage.setItem('heatshield_token', data.token);
    }
    if (data.user) {
      currentUser = data.user;
      updateUserHeaderPill(currentUser);
    }

    if (msgBox) {
      msgBox.textContent = `Signed in with Google as ${currentUser?.name || 'User'}!`;
      msgBox.className = 'auth-msg-box msg-success';
      msgBox.style.display = 'block';
    }

    showToast(`Signed in with Google (${currentUser?.email || ''})`, 'success');
    setTimeout(() => {
      closeAuthModal();
    }, 500);
  } catch (err) {
    if (msgBox) {
      msgBox.textContent = 'Google server connection error.';
      msgBox.className = 'auth-msg-box msg-error';
      msgBox.style.display = 'block';
    }
  }
}

async function performLogout() {
  try {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
  } catch (e) {
    // Ignore error
  }
  localStorage.removeItem('heatshield_token');
  currentUser = {
    id: 'guest',
    name: 'Public Observer',
    email: null,
    role: 'GUEST',
    role_label: 'Public Access',
    organization: 'Open Meteorological Feed',
    badge_color: '#64748b',
    avatar: 'PO'
  };
  document.body.classList.remove('is-admin');
  updateUserHeaderPill(currentUser);
  const tabSwitch = document.querySelector('.auth-tab-switch');
  if (tabSwitch) tabSwitch.style.display = 'flex';
  switchAuthTab('login');
  showToast('Logged out of session', 'info');
  closeAuthModal();
}

window.updateUserHeaderPill = function updateUserHeaderPill(user) {
  if (!user) return;
  const avatarEl = document.getElementById('user-avatar-pill');
  const nameEl = document.getElementById('user-name-pill');
  const roleEl = document.getElementById('user-role-pill');

  if (avatarEl) {
    avatarEl.textContent = user.avatar || 'U';
    avatarEl.style.backgroundColor = user.badge_color || '#0284c7';
  }
  if (nameEl) {
    nameEl.textContent = user.name || 'User';
  }
  if (roleEl) {
    roleEl.textContent = user.role === 'GUEST' ? 'GUEST' : (user.role === 'MUNICIPAL_OFFICER' ? 'OFFICER' : (user.role === 'HEALTH_EPIDEMIOLOGIST' ? 'EPIDEMIOLOGIST' : 'CITIZEN'));
    roleEl.style.color = user.badge_color || 'var(--accent-primary)';
  }

  const isAdmin = user.role === 'MUNICIPAL_OFFICER' || user.role === 'HEALTH_EPIDEMIOLOGIST' || user.role === 'ADMIN';
  if (isAdmin) {
    document.body.classList.add('is-admin');
  } else {
    document.body.classList.remove('is-admin');
    if (APP_VIEWS[currentViewKey]?.adminOnly) {
      navigateToView('telemetry');
    }
  }

  const sideRoleEl = document.getElementById('side-role-name');
  if (sideRoleEl) {
    sideRoleEl.textContent = isAdmin ? (user.role_label || 'OFFICER ACCESS') : 'PUBLIC ACCESS';
  }

  const btnQuickAdmin = document.getElementById('btn-quick-admin-demo');
  const btnQuickAdminText = document.getElementById('btn-quick-admin-text');
  if (btnQuickAdmin) {
    if (isAdmin) {
      btnQuickAdmin.classList.add('active');
      if (btnQuickAdminText) btnQuickAdminText.textContent = 'Admin Active';
      btnQuickAdmin.title = 'Admin Active — Click to switch to Public Observer view';
    } else {
      btnQuickAdmin.classList.remove('active');
      if (btnQuickAdminText) btnQuickAdminText.textContent = 'Admin Demo';
      btnQuickAdmin.title = '1-Click Login as Municipal Disaster Officer for Demo';
    }
  }
}

// ---------------------------------------------------------------------------
// 8. COOLING SHELTERS & HYDRATION ROUTER (Feature 1)
// ---------------------------------------------------------------------------
let coolingSheltersData = [];
let shelterRouteLine = null;

async function loadCoolingShelters() {
  const grid = document.getElementById('shelters-grid');
  try {
    const res = await fetch(`${API_BASE}/api/cooling-shelters?lat=${state.lat}&lon=${state.lon}`);
    if (!res.ok) return;
    const data = await safeJson(res);
    coolingSheltersData = data?.cooling_shelters || [];

    if (grid && coolingSheltersData.length > 0) {
      const sideCountEl = document.getElementById('side-shelter-count');
      if (sideCountEl) {
        sideCountEl.textContent = `${coolingSheltersData.length} Hubs`;
      }
      grid.innerHTML = coolingSheltersData.map(s => {
        const occColor = s.occupancy_pct > 85 ? 'fill-red' : (s.occupancy_pct > 65 ? 'fill-yellow' : 'fill-green');
        const cityBadge = s.city_name ? `<span class="shelter-badge badge-city">📍 ${s.city_name}</span>` : '';
        return `
          <div class="shelter-card" id="shelter-card-${s.id}">
            <div class="shelter-card-head">
              <div class="shelter-head-main">
                <h4 class="shelter-name">${s.name}</h4>
                <div class="shelter-subtext">${s.category} <span class="dot-sep">•</span> ${s.operating_hours}</div>
              </div>
              <div class="shelter-dist-pill">
                <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                ${s.distance_km} km
              </div>
            </div>

            <div class="shelter-addr-box">
               ${s.address}
            </div>

            <div class="shelter-capacity-module">
              <div class="shelter-occ-label">
                <span>Live Capacity</span>
                <span class="occ-fraction">${s.current_occupancy} / ${s.capacity_total} <span class="occ-pct">(${s.occupancy_pct}%)</span></span>
              </div>
              <div class="shelter-occ-track">
                <div class="shelter-occ-fill ${occColor}" style="width: ${s.occupancy_pct}%;"></div>
              </div>
            </div>

            <div class="shelter-tags-grid">
              ${cityBadge}
              <span class="shelter-badge badge-ac">❄️ ${s.ac_type}</span>
              <span class="shelter-badge badge-ors">💧 ${s.ors_stock_packets} ORS</span>
              ${s.ice_immersion_facility ? '<span class="shelter-badge badge-ice">🧊 Ice Tub</span>' : ''}
              ${s.wheelchair_accessible ? '<span class="shelter-badge">♿ Access</span>' : ''}
            </div>

            <div class="shelter-card-actions">
              <div class="shelter-contact">
                <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                ${s.contact}
              </div>
              <button class="btn-route-action" onclick="routeToShelter('${s.id}')">
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                Route
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    // Bind Locate Nearest button
    const btnFind = document.getElementById('btn-find-closest-shelter');
    if (btnFind && coolingSheltersData.length > 0) {
      btnFind.onclick = () => {
        const closest = coolingSheltersData[0];
        routeToShelter(closest.id);
        const card = document.getElementById(`shelter-card-${closest.id}`);
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          card.style.borderColor = '#0284c7';
        }
      };
    }
  } catch (err) {
    console.error('Cooling shelters loading error:', err);
  }
}

function routeToShelter(shelterId) {
  const shelter = coolingSheltersData.find(s => s.id === shelterId);
  if (!shelter) return;

  // Navigate to Global Radar Map view
  navigateToView('map');

  if (!heatMap) return;

  setTimeout(() => {
    heatMap.invalidateSize();
    // Set map view & create route polyline
    heatMap.setView([shelter.lat, shelter.lon], 14);

    if (shelterRouteLine) {
      heatMap.removeLayer(shelterRouteLine);
    }

    // Draw walking route line from current state coordinates to shelter
    const latlngs = [
      [state.lat, state.lon],
      [shelter.lat, shelter.lon]
    ];

    shelterRouteLine = L.polyline(latlngs, {
      color: '#0284c7',
      weight: 4,
      dashArray: '8, 8',
      opacity: 0.9
    }).addTo(heatMap);

    // Popup on shelter
    L.popup()
      .setLatLng([shelter.lat, shelter.lon])
      .setContent(`
        <div style="font-family:sans-serif; color:#0b0f17; min-width:180px;">
          <h4 style="margin:0 0 4px; color:#0284c7; font-weight:800;">${shelter.name}</h4>
          <div style="font-size:12px; margin-bottom:4px;">${shelter.address}</div>
          <div style="font-size:11px; color:#10b981; font-weight:700;">${shelter.distance_km} km (${shelter.walking_time_mins} min walk)</div>
          <div style="font-size:11px; margin-top:2px;">Occupancy: ${shelter.current_occupancy}/${shelter.capacity_total} (${shelter.occupancy_pct}%)</div>
        </div>
      `)
      .openOn(heatMap);

    showToast(`Navigating to ${shelter.name} (${shelter.distance_km} km)`, 'info');
  }, 200);
}

// ---------------------------------------------------------------------------
// 9. BROWSER PUSH NOTIFICATIONS & WHATSAPP ALERTS (Feature 3)
// ---------------------------------------------------------------------------
function initNotificationSystem() {
  const bellBtn = document.getElementById('btn-notify-bell');
  const modal = document.getElementById('notify-modal');
  const closeBtn = document.getElementById('btn-notify-close');
  const enablePushBtn = document.getElementById('btn-enable-push');
  const waSubBtn = document.getElementById('btn-wa-sub');
  const waInputRow = document.getElementById('wa-input-row');
  const submitWaBtn = document.getElementById('btn-submit-wa');
  
  const smsSubBtn = document.getElementById('btn-sms-sub');
  const smsInputRow = document.getElementById('sms-input-row');
  const submitSmsBtn = document.getElementById('btn-submit-sms');

  const testPushBtn = document.getElementById('btn-send-test-push');
  const msgBox = document.getElementById('notify-msg-box');
  const permStatus = document.getElementById('push-perm-status');

  if (bellBtn && modal) {
    bellBtn.addEventListener('click', () => {
      modal.style.display = 'flex';
      updatePushPermStatus();
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });
  }

  function updatePushPermStatus() {
    if (!permStatus) return;
    if (!('Notification' in window)) {
      permStatus.textContent = 'Browser Notifications Not Supported';
      permStatus.style.color = '#ef4444';
    } else {
      permStatus.textContent = `Notification Permission: ${Notification.permission.toUpperCase()}`;
      permStatus.style.color = Notification.permission === 'granted' ? '#10b981' : '#94a3b8';
    }
  }

  if (enablePushBtn) {
    enablePushBtn.addEventListener('click', async () => {
      if (!('Notification' in window)) {
        showToast('Browser does not support notifications.', 'warning');
        return;
      }
      const perm = await Notification.requestPermission();
      updatePushPermStatus();
      if (perm === 'granted') {
        try {
          await fetch(`${API_BASE}/api/alerts/subscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'BROWSER_PUSH', target: 'Client Browser WebEndpoint', hi_threshold: 40.0 })
          });
          if (msgBox) {
            msgBox.textContent = 'Push Notifications Enabled Successfully!';
            msgBox.className = 'auth-msg-box msg-success';
            msgBox.style.display = 'block';
          }
          showToast('Heatwave push notifications enabled!', 'success');
        } catch (e) {}
      } else {
        showToast('Notification permission was not granted.', 'warning');
      }
    });
  }

  if (waSubBtn && waInputRow) {
    waSubBtn.addEventListener('click', () => {
      waInputRow.style.display = waInputRow.style.display === 'none' ? 'flex' : 'none';
    });
  }

  if (smsSubBtn && smsInputRow) {
    smsSubBtn.addEventListener('click', () => {
      smsInputRow.style.display = smsInputRow.style.display === 'none' ? 'flex' : 'none';
    });
  }

  if (submitSmsBtn) {
    submitSmsBtn.addEventListener('click', async () => {
      const phone = document.getElementById('sms-phone-input')?.value.trim();
      if (!phone) {
        showToast('Please enter a valid phone number for SMS', 'warning');
        return;
      }
      try {
        await fetch(`${API_BASE}/api/alerts/subscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'SMS_ALERT', target: phone, hi_threshold: 40.0 })
        });
        if (msgBox) {
          msgBox.textContent = `Subscribed ${phone} to SMS Heat Alerts!`;
          msgBox.className = 'auth-msg-box msg-success';
          msgBox.style.display = 'block';
        }
        showToast('Subscribed to SMS broadcasts!', 'success');
        if (smsInputRow) smsInputRow.style.display = 'none';
      } catch (e) {
        showToast('Failed to subscribe to SMS alerts', 'error');
      }
    });
  }

  if (submitWaBtn) {
    submitWaBtn.addEventListener('click', async () => {
      const phone = document.getElementById('wa-phone-input')?.value.trim();
      if (!phone) {
        showToast('Please enter a valid phone number', 'warning');
        return;
      }
      try {
        await fetch(`${API_BASE}/api/alerts/subscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'WHATSAPP_BOT', target: phone, hi_threshold: 40.0 })
        });
        if (msgBox) {
          msgBox.textContent = `Subscribed ${phone} to WhatsApp Heat Alerts!`;
          msgBox.className = 'auth-msg-box msg-success';
          msgBox.style.display = 'block';
        }
        showToast('Subscribed to WhatsApp broadcasts!', 'success');
        if (waInputRow) waInputRow.style.display = 'none';
      } catch (e) {
        showToast('Failed to subscribe WhatsApp bot', 'error');
      }
    });
  }

  if (testPushBtn) {
    testPushBtn.addEventListener('click', async () => {
      const hi = state.thermalStressData?.indices?.heat_index || 44.5;
      try {
        const res = await fetch(`${API_BASE}/api/alerts/send-test-push`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ heat_index: hi, location: state.locationName })
        });
        const data = await safeJson(res);
        if (!data) return;

        // If granted, trigger native notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(data.title, {
            body: data.body,
            icon: '/static/favicon.ico'
          });
        }

        if (msgBox) {
          msgBox.textContent = `Test Alert Dispatched: "${data.title}"`;
          msgBox.className = 'auth-msg-box msg-success';
          msgBox.style.display = 'block';
        }

        showToast(`Simulated Alert Pushed (${hi}°C)`, 'success');
      } catch (e) {
        showToast('Failed to send test push', 'error');
      }
    });
  }
}

// ---------------------------------------------------------------------------
// 10. CSV DATASET EXPORT HANDLER (Feature 6)
// ---------------------------------------------------------------------------
function initDataExportHandlers() {
  const csvBtn = document.getElementById('btn-export-csv');
  if (csvBtn) {
    csvBtn.addEventListener('click', () => {
      const url = `${API_BASE}/api/export/telemetry-csv?lat=${state.lat}&lon=${state.lon}`;
      window.location.href = url;
      showToast('Downloading 48-Hour Biometeorology CSV dataset...', 'success');
    });
  }
}

// ---------------------------------------------------------------------------
// 11. PWA SERVICE WORKER & INSTALL PROMPT MANAGER
// ---------------------------------------------------------------------------
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('HeatShield PWA Service Worker Registered:', reg.scope))
        .catch(err => console.warn('SW registration skipped:', err));
    });
  }
}

let deferredPwaPrompt = null;
function initPwaInstall() {
  const installBtn = document.getElementById('btn-pwa-install');
  
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPwaPrompt = e;
    if (installBtn) {
      installBtn.style.display = 'inline-flex';
      installBtn.addEventListener('click', async () => {
        if (deferredPwaPrompt) {
          deferredPwaPrompt.prompt();
          const { outcome } = await deferredPwaPrompt.userChoice;
          if (outcome === 'accepted') {
            showToast('HeatShield Pro installed successfully!', 'success');
          }
          deferredPwaPrompt = null;
          installBtn.style.display = 'none';
        }
      });
    }
  });

  window.addEventListener('appinstalled', () => {
    if (installBtn) installBtn.style.display = 'none';
    showToast('HeatShield Pro installed to home screen!', 'success');
  });
}




