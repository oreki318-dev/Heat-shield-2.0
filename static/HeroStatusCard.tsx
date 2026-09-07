import React from 'react';
import { MapPin, Clock, Flame, ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';

export interface TelemetryMetrics {
  heatIndex: number | string;
  wbgtStress: number | string;
  projectedPeak: number | string;
  dangerHorizon: string;
}

export interface HorizonProjection {
  peakTemp: string;
  peakOffset: string;
  thresholdBreach: string;
  accumulatedBurden: string;
  statusText?: string;
  isCrisis?: boolean;
  isEarlyWarning?: boolean;
}

export interface HeroStatusCardProps {
  stageNumber?: 1 | 2 | 3 | 4;
  stageName?: string;
  severityColor?: 'amber' | 'emerald' | 'orange' | 'red';
  locationName?: string;
  liveTime?: string;
  streakDays?: number;
  advisoryTitle?: string;
  advisoryMessage?: string;
  metrics?: TelemetryMetrics;
  horizon?: HorizonProjection;
  className?: string;
}

export const HeroStatusCard: React.FC<HeroStatusCardProps> = ({
  stageNumber = 2,
  stageName = 'Yellow Heat Advisory',
  severityColor = 'amber',
  locationName = 'Gandhinagar, India',
  liveTime = 'Live: 20:20 IST',
  streakDays = 3,
  advisoryTitle = 'STAGE 2: YELLOW HEAT ADVISORY',
  advisoryMessage = 'Elevated thermal stress. Fatigue possible with prolonged outdoor exertion.',
  metrics = {
    heatIndex: '35.3°C',
    wbgtStress: '27.1°C',
    projectedPeak: '37.6°C',
    dangerHorizon: 'Clear 48h',
  },
  horizon = {
    peakTemp: '37.6°C',
    peakOffset: '+38h',
    thresholdBreach: 'None in 48h',
    accumulatedBurden: '0 °C·hr',
    statusText: 'Nominal: 48H Thermal Stress Contained',
  },
  className = '',
}) => {
  // Arc calculation for 270° radial gauge (r = 50, C = 314.16, 270° arc = 235.6)
  const totalArc = 235.6;
  const circumference = 314.16;
  const fillFraction = Math.min(Math.max(stageNumber / 4, 0.25), 1.0);
  const activeDash = (totalArc * fillFraction).toFixed(1);

  // Color config map
  const colorMap = {
    emerald: {
      arc: '#10b981',
      badgeBg: 'bg-emerald-500/10',
      badgeBorder: 'border-emerald-500/30',
      badgeText: 'text-emerald-400',
      glow: 'shadow-[0_0_12px_rgba(16,185,129,0.35)]',
    },
    amber: {
      arc: '#eab308',
      badgeBg: 'bg-amber-500/10',
      badgeBorder: 'border-amber-500/30',
      badgeText: 'text-amber-400',
      glow: 'shadow-[0_0_12px_rgba(234,179,8,0.35)]',
    },
    orange: {
      arc: '#f97316',
      badgeBg: 'bg-orange-500/10',
      badgeBorder: 'border-orange-500/30',
      badgeText: 'text-orange-400',
      glow: 'shadow-[0_0_12px_rgba(249,115,22,0.35)]',
    },
    red: {
      arc: '#ef4444',
      badgeBg: 'bg-red-500/15',
      badgeBorder: 'border-red-500/40',
      badgeText: 'text-red-400',
      glow: 'shadow-[0_0_12px_rgba(239,68,68,0.35)]',
    },
  };

  const activeTheme = colorMap[severityColor] || colorMap.amber;

  return (
    <section className={`w-full ${className}`}>
      <div
        id="alert-banner"
        className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-[#090D14] via-[#0c111c] to-[#0E131F] p-6 shadow-2xl backdrop-blur-xl transition-all duration-300"
      >
        <div className="grid grid-cols-12 gap-6 items-stretch">
          {/* ========================================================= */}
          {/* Left Col (col-span-3): Visual Gauge & Severity Level      */}
          {/* ========================================================= */}
          <div
            id="threat-level-col"
            className="col-span-12 md:col-span-4 lg:col-span-3 flex flex-col items-center justify-between rounded-lg border border-white/[0.06] bg-[#0b101c]/65 p-4"
          >
            {/* Radial Gauge Container */}
            <div className="flex flex-col items-center justify-center w-full flex-1">
              <div id="radar-ring" className="relative flex h-[130px] w-[130px] items-center justify-center">
                <svg className="h-full w-full overflow-visible" viewBox="0 0 130 130">
                  <defs>
                    <filter id="gauge-glow-react" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3.5" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>
                  {/* Track Arc (270 deg) */}
                  <circle
                    cx="65"
                    cy="65"
                    r="50"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth="8"
                    strokeDasharray="235.6 78.5"
                    strokeDashoffset="-39.25"
                    strokeLinecap="round"
                  />
                  {/* Active Dynamic Arc */}
                  <circle
                    id="gauge-arc"
                    cx="65"
                    cy="65"
                    r="50"
                    fill="none"
                    stroke={activeTheme.arc}
                    strokeWidth="8"
                    strokeDasharray={`${activeDash} ${circumference}`}
                    strokeDashoffset="-39.25"
                    strokeLinecap="round"
                    filter="url(#gauge-glow-react)"
                    className="transition-all duration-700 ease-out"
                  />
                  {/* Inner Ticks Guide */}
                  <circle
                    cx="65"
                    cy="65"
                    r="39"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.06)"
                    strokeWidth="1.2"
                    strokeDasharray="2 6"
                  />
                </svg>

                {/* Center Gauge Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none p-2">
                  <span
                    id="gauge-tier-kicker"
                    className="font-mono text-[0.62rem] font-bold uppercase tracking-wider text-zinc-500"
                  >
                    LEVEL {stageNumber} OF 4
                  </span>
                  <span
                    id="gauge-main-val"
                    className="font-mono text-xl font-extrabold text-white tracking-wide leading-tight drop-shadow"
                  >
                    STAGE {stageNumber}
                  </span>
                  <span id="gauge-sub-temp" className="font-mono text-xs font-semibold text-zinc-400 mt-0.5">
                    {metrics.heatIndex}
                  </span>
                </div>
              </div>
            </div>

            {/* Pinned Status Badge */}
            <div className="mt-3 flex w-full justify-center">
              <span
                id="threat-level-tag"
                className={`font-mono text-[0.72rem] font-bold px-3 py-1 rounded-full border whitespace-nowrap shadow-inner transition-colors ${activeTheme.badgeBg} ${activeTheme.badgeBorder} ${activeTheme.badgeText}`}
              >
                Stage {stageNumber}: {stageName}
              </span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* Center Col (col-span-5): Advisory Details & Horizon       */}
          {/* ========================================================= */}
          <div className="col-span-12 md:col-span-8 lg:col-span-5 flex flex-col justify-between gap-3 min-w-0">
            {/* Header Metadata Chips */}
            <div className="flex flex-wrap items-center gap-2">
              <div
                id="location-pill"
                className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/80 px-2.5 py-0.5 font-mono text-[0.72rem] text-zinc-300"
              >
                <MapPin className="h-3 w-3 text-zinc-400" />
                <span id="location-name">{locationName}</span>
              </div>

              <div
                id="time-pill"
                className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/80 px-2.5 py-0.5 font-mono text-[0.72rem] text-zinc-300"
              >
                <Clock className="h-3 w-3 text-zinc-400" />
                <span id="update-time">{liveTime}</span>
              </div>

              <div
                id="heatwave-badge"
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 font-mono text-[0.72rem] font-bold text-amber-400"
              >
                <Flame className="h-3 w-3 text-amber-500" />
                <span className="hw-status-inner">{streakDays}d Streak</span>
              </div>
            </div>

            {/* Advisory Headline & Impact Message */}
            <div className="flex flex-col gap-1">
              <h2
                id="alert-title"
                className="font-mono text-xl md:text-2xl font-extrabold uppercase tracking-wide text-white leading-snug"
              >
                {advisoryTitle}
              </h2>
              <p id="alert-message" className="text-sm text-zinc-400 leading-relaxed max-w-xl">
                {advisoryMessage}
              </p>
            </div>

            {/* 48H Operational Horizon Panel (Dark-Inset Card) */}
            <div
              id="hero-leadtime-strip"
              className="mt-1 rounded-lg border border-zinc-800/90 bg-zinc-900/60 p-3 backdrop-blur-md"
            >
              <div className="mb-2 flex items-center">
                <div
                  id="hero-leadtime-badge"
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[0.7rem] font-semibold ${
                    horizon.isCrisis
                      ? 'border border-red-500/40 bg-red-500/15 text-red-300'
                      : horizon.isEarlyWarning
                      ? 'border border-orange-500/40 bg-orange-500/15 text-orange-300'
                      : 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  }`}
                >
                  {horizon.isCrisis ? (
                    <AlertTriangle className="h-3 w-3 text-red-400" />
                  ) : horizon.isEarlyWarning ? (
                    <ShieldAlert className="h-3 w-3 text-orange-400" />
                  ) : (
                    <ShieldCheck className="h-3 w-3 text-emerald-400" />
                  )}
                  <span id="hero-leadtime-status">{horizon.statusText || 'Nominal: 48H Thermal Stress Contained'}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 border-t border-zinc-800/80 pt-2">
                <div className="flex flex-col">
                  <span className="font-mono text-[0.64rem] uppercase tracking-wider text-zinc-500">Peak</span>
                  <span id="hero-leadtime-peak" className="font-mono text-xs font-bold text-zinc-100">
                    {horizon.peakTemp} ({horizon.peakOffset})
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-mono text-[0.64rem] uppercase tracking-wider text-zinc-500">
                    Threshold Breach
                  </span>
                  <span id="hero-leadtime-window" className="font-mono text-xs font-bold text-zinc-100">
                    {horizon.thresholdBreach}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-mono text-[0.64rem] uppercase tracking-wider text-zinc-500">
                    Accumulated Burden
                  </span>
                  <span id="hero-leadtime-burden" className="font-mono text-xs font-bold text-zinc-100">
                    {horizon.accumulatedBurden}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* Right Col (col-span-4): Key Telemetry Metrics Grid (2x2)  */}
          {/* ========================================================= */}
          <div className="col-span-12 lg:col-span-4 grid grid-cols-2 gap-2.5 content-stretch">
            {/* Heat Index */}
            <div
              id="card-stat-hi"
              className="flex flex-col justify-between rounded-lg border border-white/[0.07] bg-slate-900/65 p-3 hover:border-white/15 hover:bg-slate-900/80 transition-colors"
            >
              <span className="font-mono text-[0.66rem] font-semibold uppercase tracking-wider text-zinc-500">
                HEAT INDEX
              </span>
              <span id="hero-stat-hi" className="font-mono text-2xl font-bold tracking-tight text-amber-400 mt-2">
                {metrics.heatIndex}
              </span>
            </div>

            {/* WBGT Stress */}
            <div
              id="card-stat-wbgt"
              className="flex flex-col justify-between rounded-lg border border-white/[0.07] bg-slate-900/65 p-3 hover:border-white/15 hover:bg-slate-900/80 transition-colors"
            >
              <span className="font-mono text-[0.66rem] font-semibold uppercase tracking-wider text-zinc-500">
                WBGT STRESS
              </span>
              <span id="hero-stat-wbgt" className="font-mono text-2xl font-bold tracking-tight text-sky-400 mt-2">
                {metrics.wbgtStress}
              </span>
            </div>

            {/* Projected Peak */}
            <div
              id="card-stat-peak"
              className="flex flex-col justify-between rounded-lg border border-white/[0.07] bg-slate-900/65 p-3 hover:border-white/15 hover:bg-slate-900/80 transition-colors"
            >
              <span className="font-mono text-[0.66rem] font-semibold uppercase tracking-wider text-zinc-500">
                PROJECTED PEAK
              </span>
              <span id="hero-stat-peak" className="font-mono text-2xl font-bold tracking-tight text-orange-400 mt-2">
                {metrics.projectedPeak}
              </span>
            </div>

            {/* Danger Horizon */}
            <div
              id="card-stat-horizon"
              className="flex flex-col justify-between rounded-lg border border-white/[0.07] bg-slate-900/65 p-3 hover:border-white/15 hover:bg-slate-900/80 transition-colors"
            >
              <span className="font-mono text-[0.66rem] font-semibold uppercase tracking-wider text-zinc-500">
                DANGER HORIZON
              </span>
              <span
                id="hero-stat-leadtime"
                className="font-mono text-2xl font-bold tracking-tight text-emerald-400 mt-2"
              >
                {metrics.dangerHorizon}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroStatusCard;
