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
