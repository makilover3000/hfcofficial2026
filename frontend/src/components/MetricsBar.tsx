import { motion } from 'framer-motion';
import { Volume2, Wind, Thermometer, Droplets, Users, AlertCircle, CloudRain, Github } from 'lucide-react';
import type { DistrictMetrics } from '../types';

interface MetricsBarProps {
  metrics: DistrictMetrics | null;
}

export function MetricsBar({ metrics }: MetricsBarProps) {
  if (!metrics) {
    return (
      <div className="h-14 bg-slate-900/90 backdrop-blur-sm border-b border-slate-700/50 flex items-center justify-center">
        <span className="text-slate-500 text-sm">Loading metrics...</span>
      </div>
    );
  }

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-red-400';
    if (score >= 40) return 'text-amber-400';
    return 'text-emerald-400';
  };

  const getNoiseColor = (level: number) => {
    if (level > 85) return 'text-red-400';
    if (level > 75) return 'text-amber-400';
    return 'text-emerald-400';
  };

  const getPM25Color = (level: number) => {
    if (level > 50) return 'text-red-400';
    if (level > 35) return 'text-amber-400';
    return 'text-emerald-400';
  };

  return (
    <div className="h-14 bg-slate-900/90 backdrop-blur-sm border-b border-slate-700/50 px-4 flex items-center justify-between">
      <div className="flex items-center gap-6 overflow-x-auto">
        {/* UrbanPulse AI Logo */}
        <motion.div
          className="flex items-center gap-2.5 shrink-0"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <svg width="32" height="32" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Outer ring with glow */}
            <circle cx="18" cy="18" r="16.5" stroke="url(#upRingGrad)" strokeWidth="1.2" opacity="0.5" />
            <circle cx="18" cy="18" r="14" fill="url(#upBgGrad)" />
            {/* City skyline silhouette */}
            <path d="M9 24 L9 18 L11 18 L11 16 L13 16 L13 14 L15 14 L15 12 L17 12 L17 10 L19 10 L19 12 L21 12 L21 14 L23 14 L23 17 L25 17 L25 19 L27 19 L27 24 Z" fill="url(#upSkylineGrad)" opacity="0.35" />
            {/* Pulse wave */}
            <path d="M7 20 L11 20 L13 15 L15.5 23 L18 13 L20.5 22 L23 17 L25 20 L29 20" stroke="url(#upPulseGrad)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            {/* Center glow dot */}
            <circle cx="18" cy="17.5" r="2" fill="url(#upDotGrad)" />
            <circle cx="18" cy="17.5" r="3.5" fill="none" stroke="#22d3ee" strokeWidth="0.6" opacity="0.3" />
            <defs>
              <radialGradient id="upBgGrad" cx="18" cy="18" r="14" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#0e2a3a" />
                <stop offset="100%" stopColor="#0a1628" />
              </radialGradient>
              <linearGradient id="upRingGrad" x1="2" y1="2" x2="34" y2="34">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
              <linearGradient id="upSkylineGrad" x1="18" y1="10" x2="18" y2="24">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#1e40af" />
              </linearGradient>
              <linearGradient id="upPulseGrad" x1="7" y1="18" x2="29" y2="18">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
                <stop offset="30%" stopColor="#22d3ee" />
                <stop offset="50%" stopColor="#38bdf8" />
                <stop offset="70%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#818cf8" stopOpacity="0.4" />
              </linearGradient>
              <radialGradient id="upDotGrad" cx="18" cy="17.5" r="2" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#67e8f9" />
                <stop offset="100%" stopColor="#22d3ee" />
              </radialGradient>
            </defs>
          </svg>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight leading-none">
              <span className="text-cyan-400">Urban</span><span className="text-blue-400">Pulse</span>
            </span>
            <span className="text-[9px] text-slate-500 font-semibold tracking-[0.2em] leading-none mt-0.5 uppercase">ai system</span>
          </div>
        </motion.div>

        <div className="w-px h-8 bg-slate-700" />

        {/* Risk Score */}
        <motion.div
          className="flex items-center gap-2 shrink-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <AlertCircle className={`w-4 h-4 ${getRiskColor(metrics.risk_score)}`} />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Risk</span>
            <span className={`text-sm font-bold font-mono ${getRiskColor(metrics.risk_score)}`}>
              {metrics.risk_score.toFixed(0)}
            </span>
          </div>
        </motion.div>

        <div className="w-px h-8 bg-slate-700" />

        {/* Max Noise */}
        <div className="flex items-center gap-2 shrink-0">
          <Volume2 className={`w-4 h-4 ${getNoiseColor(metrics.max_noise)}`} />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Max Noise</span>
            <span className={`text-sm font-bold font-mono ${getNoiseColor(metrics.max_noise)}`}>
              {metrics.max_noise.toFixed(0)} dB
            </span>
          </div>
        </div>

        {/* PM2.5 */}
        <div className="flex items-center gap-2 shrink-0">
          <Wind className={`w-4 h-4 ${getPM25Color(metrics.total_pm25)}`} />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">PM2.5</span>
            <span className={`text-sm font-bold font-mono ${getPM25Color(metrics.total_pm25)}`}>
              {metrics.total_pm25.toFixed(0)} ug/m3
            </span>
          </div>
        </div>

        <div className="w-px h-8 bg-slate-700" />

        {/* Site Status */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-xs text-slate-400">
              <span className="font-bold text-amber-400">{metrics.elevated_sites}</span> elevated
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-xs text-slate-400">
              <span className="font-bold text-red-400">{metrics.high_impact_sites}</span> high
            </span>
          </div>
        </div>

        <div className="w-px h-8 bg-slate-700" />

        {/* Affected Residents */}
        <div className="flex items-center gap-2 shrink-0">
          <Users className="w-4 h-4 text-cyan-400" />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Affected</span>
            <span className="text-sm font-bold font-mono text-cyan-400">
              {metrics.affected_residents.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="w-px h-8 bg-slate-700" />

        {/* Weather */}
        {metrics.environment && (
          <>
            <div className="flex items-center gap-2 shrink-0">
              <Thermometer className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-mono text-slate-300">
                {metrics.environment.temperature.toFixed(1)}C
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Droplets className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-mono text-slate-300">
                {metrics.environment.humidity.toFixed(0)}%
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <CloudRain className="w-4 h-4 text-blue-300" />
              <span className="text-sm font-mono text-slate-300">
                {metrics.environment.rainfall.toFixed(1)}mm
              </span>
            </div>
          </>
        )}
      </div>

      {/* GitHub Credit */}
      <a
        href="https://github.com/makilover3000"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 shrink-0 ml-4 px-4 py-2 rounded-xl border border-slate-700/40 hover:border-cyan-500/40 bg-gradient-to-r from-slate-800/60 to-slate-800/30 hover:from-slate-800/80 hover:to-slate-700/40 transition-all group"
      >
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Github className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider leading-none">Built by</span>
          <span className="text-sm text-slate-300 group-hover:text-white transition-colors font-semibold tracking-tight leading-none mt-1">makilover3000</span>
        </div>
      </a>
    </div>
  );
}
