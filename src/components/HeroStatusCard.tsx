import React from 'react';
import { MapPin, Clock, Flame, ShieldCheck, AlertTriangle } from 'lucide-react';

export interface TelemetryData {
  heatIndex: number;
  wbgt: number;
  projectedPeak: number;
  dangerHorizonHours: number | null; // null = clear 48h, 0 = active danger now, >0 = T-xh
}

export interface HorizonForecast {
  status: string;
  statusType: 'nominal' | 'warning' | 'danger';
  peakTemp: number;
  peakLeadHours: number;
  thresholdBreachText: string;
  accumulatedBurdenDegreeHours: number;
}

export interface HeroAlertData {
  stage: 1 | 2 | 3 | 4;
  title: string;
  subtitle: string;
  impactDescription: string;
  locationName: string;
  lastUpdated: string;
  streakDays?: number;
  telemetry: TelemetryData;
  horizon: HorizonForecast;
}

interface HeroStatusCardProps {
  data?: Partial<HeroAlertData>;
  className?: string;
}

// Default fallback data matching live Gandhinagar operational telemetry
const defaultHeroData: HeroAlertData = {
  stage: 2,
  title: 'STAGE 2: YELLOW HEAT ADVISORY',
  subtitle: 'Stage 2: Yellow Heat Advisory',
  impactDescription: 'Elevated thermal stress. Fatigue possible with prolonged outdoor exertion.',
  locationName: 'Gandhinagar, India',
  lastUpdated: 'Live: 20:20 IST',
  streakDays: 3,
  telemetry: {
    heatIndex: 35.3,
    wbgt: 27.1,
    projectedPeak: 37.6,
    dangerHorizonHours: null, // Clear 48h
  },
  horizon: {
    status: 'Nominal: 48H Thermal Stress Contained',
    statusType: 'nominal',
    peakTemp: 37.6,
    peakLeadHours: 38,
    thresholdBreachText: 'None in 48h',
    accumulatedBurdenDegreeHours: 0,
  },
};

const STAGE_THEMES = {
  1: {
    border: 'border-emerald-500/30',
    cardBg: 'from-zinc-950 via-emerald-950/20 to-zinc-950',
    arcColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.45)',
    textColor: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  },
  2: {
    border: 'border-amber-500/35',
    cardBg: 'from-zinc-950 via-amber-950/20 to-zinc-950',
    arcColor: '#eab308',
    glowColor: 'rgba(234, 179, 8, 0.45)',
    textColor: 'text-amber-400',
    badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
  },
  3: {
    border: 'border-orange-500/40',
    cardBg: 'from-zinc-950 via-orange-950/25 to-zinc-950',
    arcColor: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.5)',
    textColor: 'text-orange-400',
    badgeBg: 'bg-orange-500/12 border-orange-500/35 text-orange-400',
  },
  4: {
    border: 'border-red-500/45',
    cardBg: 'from-zinc-950 via-red-950/30 to-zinc-950',
    arcColor: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.55)',
    textColor: 'text-red-400',
    badgeBg: 'bg-red-500/15 border-red-500/40 text-red-400',
  },
};

export const HeroStatusCard: React.FC<HeroStatusCardProps> = ({ data = {}, className = '' }) => {
  const alertData: HeroAlertData = {
    ...defaultHeroData,
    ...data,
    telemetry: { ...defaultHeroData.telemetry, ...(data.telemetry || {}) },
    horizon: { ...defaultHeroData.horizon, ...(data.horizon || {}) },
  };

  const theme = STAGE_THEMES[alertData.stage] || STAGE_THEMES[2];

  // 270-degree radial gauge arc math (r = 50, C = 314.16, max 270 deg = 235.6)
  const maxArc = 235.6;
  const circumference = 314.16;
  const arcProgress = Math.min(Math.max(alertData.stage / 4, 0.25), 1.0);
  const activeArc = (maxArc * arcProgress).toFixed(1);

  // Danger horizon formatting
  const renderHorizonLeadTime = () => {
    const hours = alertData.telemetry.dangerHorizonHours;
    if (hours === 0) {
      return <span className="font-mono text-2xl font-bold tracking-tight text-red-400">ACTIVE</span>;
    }
    if (hours != null) {
      const isUrgent = hours <= 12;
      return (
        <span className={`font-mono text-2xl font-bold tracking-tight ${isUrgent ? 'text-orange-400' : 'text-sky-400'}`}>
          T-{hours}h
        </span>
      );
    }
    return <span className="font-mono text-2xl font-bold tracking-tight text-emerald-400">Clear 48h</span>;
  };

  return (
    <div
      id="alert-banner"
      className={`relative w-full overflow-hidden rounded-xl border bg-gradient-to-br p-6 shadow-2xl backdrop-blur-xl ${theme.border} ${theme.cardBg} ${className}`}
    >
      {/* 3-Column Responsive Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:items-stretch">
        {/* Left Col (col-span-3): Visual Gauge & Severity Level */}
        <div className="flex flex-col items-center justify-between gap-3 rounded-lg border border-white/5 bg-zinc-900/60 p-4 md:col-span-3">
          <div className="relative flex flex-1 items-center justify-center">
            {/* Radial SVG Meter */}
            <svg className="h-[130px] w-[130px]" viewBox="0 0 130 130">
              <defs>
                <filter id="arcGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              {/* Background Inactive Arc */}
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
              {/* Active Segment Arc */}
              <circle
                cx="65"
                cy="65"
                r="50"
                fill="none"
                stroke={theme.arcColor}
                strokeWidth="8"
                strokeDasharray={`${activeArc} ${circumference}`}
                strokeDashoffset="-39.25"
                strokeLinecap="round"
                filter="url(#arcGlow)"
                className="transition-all duration-700 ease-out"
              />
              {/* Subtle Concentric Tick Ring */}
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

            {/* Gauge Internal Readout */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                LEVEL {alertData.stage} OF 4
              </span>
              <span
                className={`font-mono text-xl font-extrabold tracking-wide ${theme.textColor} animate-pulse`}
                style={{ textShadow: `0 0 12px ${theme.glowColor}` }}
              >
                STAGE {alertData.stage}
              </span>
              <span className="mt-0.5 font-mono text-xs font-semibold text-zinc-400">
                {alertData.telemetry.heatIndex.toFixed(1)}°C
              </span>
            </div>
          </div>

          {/* Pinned Status Badge */}
          <span
            className={`inline-flex items-center justify-center rounded-full border px-3 py-1 font-mono text-xs font-bold tracking-wide transition-colors ${theme.badgeBg}`}
          >
            {alertData.subtitle}
          </span>
        </div>

        {/* Center Col (col-span-5): Advisory Details & Operational Horizon */}
        <div className="flex flex-col justify-between gap-3 md:col-span-5">
          {/* Header Row: Metadata Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-zinc-900/80 px-2.5 py-1 font-mono text-xs text-zinc-300">
              <MapPin className="h-3 w-3 text-zinc-400" />
              <span>{alertData.locationName}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-zinc-900/80 px-2.5 py-1 font-mono text-xs text-zinc-300">
              <Clock className="h-3 w-3 text-zinc-400" />
              <span>{alertData.lastUpdated}</span>
            </div>
            {alertData.streakDays != null && (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 font-mono text-xs font-semibold text-amber-400">
                <Flame className="h-3 w-3 text-amber-400" />
                <span>{alertData.streakDays}d Streak</span>
              </div>
            )}
          </div>

          {/* Title & Real-World Impact Description */}
          <div>
            <h2 className="text-2xl font-bold uppercase tracking-wide text-white">
              {alertData.title}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-zinc-400">
              {alertData.impactDescription}
            </p>
          </div>

          {/* 48H Horizon Panel (Dark-Inset Structured Card) */}
          <div className="flex flex-col gap-2.5 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 backdrop-blur-md">
            <div className="flex items-center">
              <div
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-xs font-semibold ${
                  alertData.horizon.statusType === 'danger'
                    ? 'border-red-500/40 bg-red-500/15 text-red-300'
                    : alertData.horizon.statusType === 'warning'
                    ? 'border-orange-500/40 bg-orange-500/15 text-orange-300'
                    : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                }`}
              >
                {alertData.horizon.statusType === 'danger' ? (
                  <Flame className="h-3.5 w-3.5" />
                ) : alertData.horizon.statusType === 'warning' ? (
                  <AlertTriangle className="h-3.5 w-3.5" />
                ) : (
                  <ShieldCheck className="h-3.5 w-3.5" />
                )}
                <span>{alertData.horizon.status}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-2">
              <div className="flex flex-col">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Peak
                </span>
                <span className="font-mono text-xs font-bold text-zinc-200">
                  {alertData.horizon.peakTemp.toFixed(1)}°C (+{alertData.horizon.peakLeadHours}h)
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Threshold Breach
                </span>
                <span className="font-mono text-xs font-bold text-zinc-200">
                  {alertData.horizon.thresholdBreachText}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Accumulated Burden
                </span>
                <span className="font-mono text-xs font-bold text-zinc-200">
                  {alertData.horizon.accumulatedBurdenDegreeHours} °C·hr
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col (col-span-4): Key Telemetry Metrics Grid (2x2) */}
        <div className="grid grid-cols-2 gap-2.5 md:col-span-4">
          {/* Heat Index */}
          <div className="flex flex-col justify-center rounded-lg border border-white/10 bg-slate-900/60 p-3.5 transition-colors hover:border-white/20 hover:bg-slate-900/80">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              HEAT INDEX
            </span>
            <span className="mt-1 font-mono text-2xl font-bold tracking-tight text-amber-400">
              {alertData.telemetry.heatIndex.toFixed(1)}°C
            </span>
          </div>

          {/* WBGT Stress */}
          <div className="flex flex-col justify-center rounded-lg border border-white/10 bg-slate-900/60 p-3.5 transition-colors hover:border-white/20 hover:bg-slate-900/80">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              WBGT STRESS
            </span>
            <span className="mt-1 font-mono text-2xl font-bold tracking-tight text-sky-400">
              {alertData.telemetry.wbgt.toFixed(1)}°C
            </span>
          </div>

          {/* Projected Peak */}
          <div className="flex flex-col justify-center rounded-lg border border-white/10 bg-slate-900/60 p-3.5 transition-colors hover:border-white/20 hover:bg-slate-900/80">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              PROJECTED PEAK
            </span>
            <span className="mt-1 font-mono text-2xl font-bold tracking-tight text-orange-400">
              {alertData.telemetry.projectedPeak.toFixed(1)}°C
            </span>
          </div>

          {/* Danger Horizon */}
          <div className="flex flex-col justify-center rounded-lg border border-white/10 bg-slate-900/60 p-3.5 transition-colors hover:border-white/20 hover:bg-slate-900/80">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              DANGER HORIZON
            </span>
            <div className="mt-1">{renderHorizonLeadTime()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroStatusCard;
