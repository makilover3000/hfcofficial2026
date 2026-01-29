import { motion } from 'framer-motion';
import { Volume2, Wind, Thermometer, Droplets, Users, AlertCircle, CloudRain } from 'lucide-react';
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
    <div className="h-14 bg-slate-900/90 backdrop-blur-sm border-b border-slate-700/50 px-4 flex items-center">
      <div className="flex items-center gap-6 overflow-x-auto">
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
    </div>
  );
}
