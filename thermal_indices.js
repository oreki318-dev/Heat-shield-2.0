function clamp(val, minVal, maxVal) {
    return Math.max(minVal, Math.min(val, maxVal));
}

function heat_index(T_c, RH) {
    const T = clamp(T_c, -40.0, 60.0);
    const rh = clamp(RH, 0.0, 100.0);
    if (T < 27.0) return T;
    
    const T_f = (T * 9.0 / 5.0) + 32.0;
    let hi_f = 0.5 * (T_f + 61.0 + ((T_f - 68.0) * 1.2) + (rh * 0.094));
    
    if (hi_f >= 80.0) {
        hi_f = -42.379 + 2.04901523 * T_f + 10.14333127 * rh - 0.22475541 * T_f * rh - 0.00683783 * T_f * T_f - 0.05481717 * rh * rh + 0.00122874 * T_f * T_f * rh + 0.00085282 * T_f * rh * rh - 0.00000199 * T_f * T_f * rh * rh;
        if (rh < 13.0 && T_f >= 80.0 && T_f <= 112.0) {
            hi_f -= ((13.0 - rh) / 4.0) * Math.sqrt((17.0 - Math.abs(T_f - 95.0)) / 17.0);
        } else if (rh > 85.0 && T_f >= 80.0 && T_f <= 87.0) {
            hi_f += ((rh - 85.0) / 10.0) * ((87.0 - T_f) / 5.0);
        }
    }
    
    return (hi_f - 32.0) * 5.0 / 9.0;
}

function wet_bulb_temperature(T_c, RH) {
    const T = clamp(T_c, -40.0, 60.0);
    const rh = clamp(RH, 1.0, 100.0);
    return (
        T * Math.atan(0.151977 * Math.pow(rh + 8.313659, 0.5))
        + Math.atan(T + rh)
        - Math.atan(rh - 1.676331)
        + 0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh)
        - 4.686035
    );
}

function dewpoint_temperature(T_c, RH) {
    const T = clamp(T_c, -50.0, 60.0);
    const rh = clamp(RH, 0.01, 100.0);
    const a = 17.27;
    const b = 237.7;
    const gamma = (a * T / (b + T)) + Math.log(rh / 100.0);
    return (b * gamma) / (a - gamma);
}

function mean_radiant_temperature(T_c, wind_speed_ms, solar_radiation_wm2) {
    const T = clamp(T_c, -50.0, 60.0);
    const wind = Math.max(0.1, wind_speed_ms);
    const solar = Math.max(0.0, solar_radiation_wm2);
    let Tmrt = T;
    if (solar > 0) {
        const solar_effect = 0.75 * (solar / 100.0) / Math.pow(wind + 0.5, 0.2);
        Tmrt = T + solar_effect + 0.2 * (T - 20.0);
    }
    return Math.max(T, Tmrt);
}

function wbgt_outdoor(T_c, RH, wind_speed_ms, solar_radiation_wm2) {
    const T = clamp(T_c, -50.0, 60.0);
    const wind = Math.max(0.1, wind_speed_ms);
    const solar = Math.max(0.0, solar_radiation_wm2);
    const Tw = wet_bulb_temperature(T, RH);
    let Tg = T;
    if (solar > 0) {
        Tg = T + (0.012 * solar) / Math.sqrt(wind + 0.3);
    }
    return 0.7 * Tw + 0.2 * Tg + 0.1 * T;
}

function utci_approximation(T_c, RH, wind_speed_ms, solar_radiation_wm2) {
    const T = clamp(T_c, -40.0, 55.0);
    const rh = clamp(RH, 0.0, 100.0);
    const wind = Math.max(0.2, Math.min(wind_speed_ms, 25.0));
    const solar = Math.max(0.0, solar_radiation_wm2);
    const Tmrt = mean_radiant_temperature(T, wind, solar);
    const D_Tmrt = Tmrt - T;
    const e_kPa = (rh / 100.0) * 0.61078 * Math.exp((17.27 * T) / (237.3 + T));
    
    const utci = (
        T
        + 0.607562
        - 0.0227712 * T
        + 0.000806919 * (T * T)
        - 0.0000154271 * (Math.pow(T, 3))
        - 0.3 * wind
        + 0.00230 * wind * T
        + 0.1 * D_Tmrt
        - 0.00361 * D_Tmrt * wind
        + 0.5 * e_kPa
        - 0.0123 * e_kPa * T
    );
    return clamp(utci, -50.0, 65.0);
}

function humidex(T_c, RH) {
    const T = clamp(T_c, -40.0, 60.0);
    const Td = dewpoint_temperature(T, RH);
    const e = 6.11 * Math.exp(5417.7530 * ((1.0 / 273.16) - (1.0 / (273.15 + Td))));
    const h = T + (5.0 / 9.0) * (e - 10.0);
    return Math.max(T, h);
}

function classify_heat_index(hi_c) {
    if (hi_c < 27.0) return {level: 1, category: 'Normal', color: '#4CAF50'};
    if (hi_c < 32.0) return {level: 2, category: 'Caution', color: '#FFC107'};
    if (hi_c < 41.0) return {level: 3, category: 'Extreme Caution', color: '#FF9800'};
    if (hi_c < 54.0) return {level: 4, category: 'Danger', color: '#FF5722'};
    return {level: 5, category: 'Extreme Danger', color: '#B71C1C'};
}

function classify_wbgt(wbgt_c) {
    if (wbgt_c < 18.0) return {level: 1, category: 'No Risk', color: '#4CAF50'};
    if (wbgt_c < 23.0) return {level: 2, category: 'Low', color: '#8BC34A'};
    if (wbgt_c < 28.0) return {level: 3, category: 'Moderate', color: '#FFC107'};
    if (wbgt_c < 32.0) return {level: 4, category: 'High', color: '#FF5722'};
    return {level: 5, category: 'Extreme', color: '#B71C1C'};
}

function classify_utci(utci_c) {
    if (utci_c < 9.0) return {level: 1, category: 'Slight / No Stress', color: '#4CAF50'};
    if (utci_c < 26.0) return {level: 1, category: 'No Thermal Stress', color: '#4CAF50'};
    if (utci_c < 32.0) return {level: 2, category: 'Moderate Heat Stress', color: '#FFC107'};
    if (utci_c < 38.0) return {level: 3, category: 'Strong Heat Stress', color: '#FF9800'};
    if (utci_c < 46.0) return {level: 4, category: 'Very Strong Heat Stress', color: '#FF5722'};
    return {level: 5, category: 'Extreme Heat Stress', color: '#B71C1C'};
}

function classify_humidex(hx_c) {
    if (hx_c < 30.0) return {level: 1, category: 'Comfortable', color: '#4CAF50'};
    if (hx_c < 40.0) return {level: 2, category: 'Some Discomfort', color: '#FFC107'};
    if (hx_c < 45.0) return {level: 3, category: 'Great Discomfort', color: '#FF9800'};
    return {level: 4, category: 'Dangerous', color: '#FF5722'};
}

function classify_wet_bulb(tw_c) {
    if (tw_c < 27.0) return {level: 1, category: 'Manageable', color: '#4CAF50'};
    if (tw_c < 31.0) return {level: 3, category: 'High Stress', color: '#FF9800'};
    if (tw_c < 35.0) return {level: 4, category: 'Critical Danger', color: '#FF5722'};
    return {level: 5, category: 'Lethal Risk', color: '#B71C1C'};
}

export function computeIndices(T_c, RH, wind_speed_ms = 1.0, solar_radiation_wm2 = 0.0) {
    const hi = heat_index(T_c, RH);
    const wbgt = wbgt_outdoor(T_c, RH, wind_speed_ms, solar_radiation_wm2);
    const utci = utci_approximation(T_c, RH, wind_speed_ms, solar_radiation_wm2);
    const hx = humidex(T_c, RH);
    const tw = wet_bulb_temperature(T_c, RH);
    const td = dewpoint_temperature(T_c, RH);
    
    return {
        heat_index: Number(hi.toFixed(1)),
        wbgt: Number(wbgt.toFixed(1)),
        utci: Number(utci.toFixed(1)),
        humidex: Number(hx.toFixed(1)),
        wet_bulb: Number(tw.toFixed(1)),
        dew_point: Number(td.toFixed(1)),
        classifications: {
            heat_index: classify_heat_index(hi),
            wbgt: classify_wbgt(wbgt),
            utci: classify_utci(utci),
            humidex: classify_humidex(hx),
            wet_bulb: classify_wet_bulb(tw)
        }
    };
}

/**
 * Biometeorological Forecast Horizon Engine
 * Projects full thermal stress indices (Heat Index, WBGT, UTCI, Wet-Bulb) forward
 * across hourly (48H / 7-Day) timelines to compute true predictive Lead Time.
 */
export function computeThermalStressHorizon(weatherData) {
    if (!weatherData) return null;
    const hourly = weatherData.hourly || {};
    const times = hourly.time || [];
    const temps = hourly.temperature_2m || [];
    const rhs = hourly.relative_humidity_2m || [];
    const winds = hourly.wind_speed_10m || [];
    const solars = hourly.shortwave_radiation || [];
    const codes = hourly.weather_code || [];

    const numHours = Math.min(times.length, 168);
    if (numHours === 0) return null;

    const hourlyPoints = [];
    const nowMs = Date.now();

    for (let i = 0; i < numHours; i++) {
        const timeStr = times[i];
        const t_c = temps[i] ?? 35.0;
        const rh = rhs[i] ?? 50.0;
        const wind_kmh = winds[i] ?? 10.0;
        const wind_ms = Number((wind_kmh / 3.6).toFixed(1));
        
        let solar = 0;
        if (solars && solars.length > i && solars[i] != null) {
            solar = solars[i];
        } else {
            const d = new Date(timeStr);
            const hr = d.getHours();
            if (hr >= 6 && hr <= 18) {
                solar = Math.round(750 * Math.sin(((hr - 6) / 12) * Math.PI));
            }
        }

        const indices = computeIndices(t_c, rh, wind_ms, solar);
        const ptTime = new Date(timeStr).getTime();
        const leadHours = Math.max(0, Math.round((ptTime - nowMs) / (1000 * 60 * 60)));

        const isDanger = indices.heat_index >= 41.0 || indices.wbgt >= 32.0 || indices.utci >= 38.0;
        const isCaution = indices.heat_index >= 32.0 || indices.wbgt >= 28.0 || indices.utci >= 32.0;
        const isExtreme = indices.heat_index >= 54.0 || indices.utci >= 46.0 || indices.wet_bulb >= 35.0;

        hourlyPoints.push({
            time: timeStr,
            lead_hours: i,
            hours_from_now: leadHours,
            temperature: t_c,
            humidity: rh,
            wind_speed: wind_kmh,
            wind_speed_ms: wind_ms,
            solar_radiation: solar,
            weather_code: codes[i] || 0,
            indices,
            risk_category: indices.classifications.heat_index.category,
            risk_level: indices.classifications.heat_index.level,
            risk_color: indices.classifications.heat_index.color,
            is_caution: isCaution,
            is_danger: isDanger,
            is_extreme: isExtreme
        });
    }

    // 1. Lead Time to Danger Threshold (HI >= 41°C or WBGT >= 32°C)
    let dangerLeadHours = null;
    let dangerStatus = 'NOMINAL_HORIZON';
    let dangerOnsetTime = null;
    let dangerOffsetTime = null;
    let dangerDurationHours = 0;
    let isActiveDangerNow = hourlyPoints[0]?.is_danger || false;

    if (isActiveDangerNow) {
        dangerLeadHours = 0;
        dangerStatus = 'ACTIVE_NOW';
        dangerOnsetTime = hourlyPoints[0].time;
        // Count consecutive active danger hours
        let dCount = 0;
        for (let j = 0; j < hourlyPoints.length; j++) {
            if (hourlyPoints[j].is_danger) {
                dCount++;
            } else {
                dangerOffsetTime = hourlyPoints[j].time;
                break;
            }
        }
        dangerDurationHours = dCount;
    } else {
        // Look ahead for first danger breach
        for (let j = 1; j < hourlyPoints.length; j++) {
            if (hourlyPoints[j].is_danger) {
                dangerLeadHours = hourlyPoints[j].lead_hours;
                dangerStatus = 'PENDING_BREACH';
                dangerOnsetTime = hourlyPoints[j].time;
                // Measure window duration
                let dCount = 0;
                for (let k = j; k < hourlyPoints.length; k++) {
                    if (hourlyPoints[k].is_danger) {
                        dCount++;
                    } else {
                        dangerOffsetTime = hourlyPoints[k].time;
                        break;
                    }
                }
                dangerDurationHours = dCount;
                break;
            }
        }
    }

    // 2. Lead Time to Caution Threshold (HI >= 32°C)
    let cautionLeadHours = null;
    let cautionStatus = 'NOMINAL_HORIZON';
    let cautionOnsetTime = null;
    if (hourlyPoints[0]?.is_caution) {
        cautionLeadHours = 0;
        cautionStatus = 'ACTIVE_NOW';
        cautionOnsetTime = hourlyPoints[0].time;
    } else {
        for (let j = 1; j < hourlyPoints.length; j++) {
            if (hourlyPoints[j].is_caution) {
                cautionLeadHours = hourlyPoints[j].lead_hours;
                cautionStatus = 'PENDING_BREACH';
                cautionOnsetTime = hourlyPoints[j].time;
                break;
            }
        }
    }

    // 3. 48-Hour Peak Projections
    const h48 = hourlyPoints.slice(0, Math.min(48, hourlyPoints.length));
    let peakHI = h48[0] || null;
    let peakWBGT = h48[0] || null;
    let peakUTCI = h48[0] || null;
    let peakTw = h48[0] || null;
    let totalDangerHours48h = 0;
    let thermalBurdenDegreeHours48h = 0;

    h48.forEach(pt => {
        if (!peakHI || pt.indices.heat_index > peakHI.indices.heat_index) peakHI = pt;
        if (!peakWBGT || pt.indices.wbgt > peakWBGT.indices.wbgt) peakWBGT = pt;
        if (!peakUTCI || pt.indices.utci > peakUTCI.indices.utci) peakUTCI = pt;
        if (!peakTw || pt.indices.wet_bulb > peakTw.indices.wet_bulb) peakTw = pt;
        if (pt.is_danger) totalDangerHours48h++;
        if (pt.indices.heat_index > 40.0) {
            thermalBurdenDegreeHours48h += (pt.indices.heat_index - 40.0);
        }
    });

    // 4. Group into Calendar Days for 7-Day Projected Indices
    const dailyMap = new Map();
    hourlyPoints.forEach(pt => {
        const dayKey = pt.time.split('T')[0];
        if (!dailyMap.has(dayKey)) {
            dailyMap.set(dayKey, []);
        }
        dailyMap.get(dayKey).push(pt);
    });

    const dailyForecasts = [];
    dailyMap.forEach((points, dayKey) => {
        let maxT = -999, minT = 999;
        let dayPeakHI = points[0];
        let dayPeakWBGT = points[0];
        let dayPeakUTCI = points[0];
        let dayPeakTw = points[0];
        let dangerHrs = 0;
        let cautionHrs = 0;

        points.forEach(p => {
            if (p.temperature > maxT) maxT = p.temperature;
            if (p.temperature < minT) minT = p.temperature;
            if (p.indices.heat_index > dayPeakHI.indices.heat_index) dayPeakHI = p;
            if (p.indices.wbgt > dayPeakWBGT.indices.wbgt) dayPeakWBGT = p;
            if (p.indices.utci > dayPeakUTCI.indices.utci) dayPeakUTCI = p;
            if (p.indices.wet_bulb > dayPeakTw.indices.wet_bulb) dayPeakTw = p;
            if (p.is_danger) dangerHrs++;
            if (p.is_caution) cautionHrs++;
        });

        const peakDate = new Date(dayPeakHI.time);
        const peakHourStr = peakDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

        dailyForecasts.push({
            date: dayKey,
            max_temp: Number(maxT.toFixed(1)),
            min_temp: Number(minT.toFixed(1)),
            weather_code: dayPeakHI.weather_code,
            peak_heat_index: dayPeakHI.indices.heat_index,
            peak_wbgt: dayPeakWBGT.indices.wbgt,
            peak_utci: dayPeakUTCI.indices.utci,
            peak_wet_bulb: dayPeakTw.indices.wet_bulb,
            peak_hour: peakHourStr,
            danger_hours_count: dangerHrs,
            caution_hours_count: cautionHrs,
            risk_level: dayPeakHI.risk_category,
            risk_color: dayPeakHI.risk_color,
            risk_summary: dayPeakHI.risk_category,
            level_num: dayPeakHI.risk_level
        });
    });

    return {
        hourly_horizon: hourlyPoints,
        daily_forecasts: dailyForecasts,
        lead_times: {
            danger_lead_hours: dangerLeadHours,
            danger_status: dangerStatus,
            danger_onset_time: dangerOnsetTime,
            danger_offset_time: dangerOffsetTime,
            danger_duration_hours: dangerDurationHours,
            is_active_danger_now: isActiveDangerNow,
            caution_lead_hours: cautionLeadHours,
            caution_status: cautionStatus,
            caution_onset_time: cautionOnsetTime
        },
        peak_projections_48h: {
            peak_heat_index: {
                value: peakHI?.indices?.heat_index ?? 0,
                time: peakHI?.time ?? '',
                lead_hours: peakHI?.lead_hours ?? 0,
                category: peakHI?.risk_category ?? 'Normal',
                color: peakHI?.risk_color ?? '#10b981'
            },
            peak_wbgt: {
                value: peakWBGT?.indices?.wbgt ?? 0,
                time: peakWBGT?.time ?? '',
                lead_hours: peakWBGT?.lead_hours ?? 0
            },
            peak_utci: {
                value: peakUTCI?.indices?.utci ?? 0,
                time: peakUTCI?.time ?? '',
                lead_hours: peakUTCI?.lead_hours ?? 0
            },
            peak_wet_bulb: {
                value: peakTw?.indices?.wet_bulb ?? 0,
                time: peakTw?.time ?? '',
                lead_hours: peakTw?.lead_hours ?? 0
            }
        },
        exposure_windows: {
            total_danger_hours_48h: totalDangerHours48h,
            thermal_burden_degree_hours_48h: Number(thermalBurdenDegreeHours48h.toFixed(1)),
            has_danger_window: dangerLeadHours !== null,
            danger_window_text: dangerLeadHours === 0 
                ? `Active Danger Episode (${dangerDurationHours}h continuous)`
                : (dangerLeadHours !== null 
                    ? `Predicted in +${dangerLeadHours}h (${dangerDurationHours}h continuous duration)`
                    : 'No Danger Threshold Breach in 48H')
        }
    };
}

