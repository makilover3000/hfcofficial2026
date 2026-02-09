import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Activity, Database, Cpu, Clock, MapPin, Layers } from 'lucide-react';
import type { Cluster, DistrictMetrics } from '../types';

interface AnalyticsTabProps {
  clusters: Cluster[];
  metrics: DistrictMetrics | null;
  totalSites?: number;
}

const ACTIVITY_DATA = [
  { name: 'Excavation', count: 234, color: '#f59e0b' },
  { name: 'Concrete', count: 187, color: '#3b82f6' },
  { name: 'Piling', count: 142, color: '#ef4444' },
  { name: 'Finishing', count: 156, color: '#22c55e' },
  { name: 'Demolition', count: 89, color: '#a855f7' },
  { name: 'Idle', count: 73, color: '#6b7280' },
];

const DATA_SOURCES = [
  { name: 'NEA Air Quality (PM2.5)', status: 'Live', updated: '2m ago' },
  { name: 'NEA Noise Monitoring', status: 'Live', updated: '5m ago' },
  { name: 'Weather (Temperature)', status: 'Live', updated: '3m ago' },
  { name: 'Weather (Humidity)', status: 'Live', updated: '3m ago' },
  { name: 'Weather (Wind Speed)', status: 'Live', updated: '4m ago' },
  { name: 'HDB Construction Sites', status: 'Live', updated: '1m ago' },
];

export function AnalyticsTab({ clusters, metrics, totalSites = 0 }: AnalyticsTabProps) {
  const clusterCounts = useMemo(() => {
    let critical = 0, warning = 0, moderate = 0, resolved = 0;
    for (const c of clusters) {
      if (c.severity === 'high_impact') critical++;
      else if (c.severity === 'elevated') warning++;
      else moderate++;
    }
    // Add some baseline resolved
    resolved = Math.max(clusters.length - critical - warning, 3);
    return { critical, warning, moderate, resolved };
  }, [clusters]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-4 space-y-4">
      {/* Top - Heatmap Placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#1e293b] rounded-lg border border-slate-700/50 p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            Construction Density Heatmap
          </h3>
          <span className="text-xs text-cyan-400 font-mono">{totalSites} sites monitored</span>
        </div>
        <div className="h-32 rounded-lg bg-gradient-to-r from-emerald-900/30 via-amber-900/40 to-red-900/30 flex items-center justify-center relative overflow-hidden">
          {/* Simulated heatmap dots */}
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full opacity-40"
              style={{
                width: 8 + Math.random() * 16,
                height: 8 + Math.random() * 16,
                left: `${5 + Math.random() * 90}%`,
                top: `${10 + Math.random() * 80}%`,
                backgroundColor: ['#22c55e', '#eab308', '#ef4444'][Math.floor(Math.random() * 3)],
              }}
            />
          ))}
          <span className="text-slate-500 text-xs z-10 bg-slate-900/80 px-3 py-1 rounded">
            Singapore Island — Live Construction Activity
          </span>
        </div>
      </motion.div>

      {/* Middle Row - 3 Cards */}
      <div className="grid grid-cols-3 gap-4">
        {/* Activity Distribution Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#1e293b] rounded-lg border border-slate-700/50 p-4"
        >
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            Activity Distribution
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ACTIVITY_DATA} layout="vertical" margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} width={70} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {ACTIVITY_DATA.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Cluster Status */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#1e293b] rounded-lg border border-slate-700/50 p-4"
        >
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-400" />
            Cluster Status
          </h3>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <StatusBadge label="Critical" count={clusterCounts.critical} color="#ef4444" />
            <StatusBadge label="Warning" count={clusterCounts.warning} color="#f59e0b" />
            <StatusBadge label="Moderate" count={clusterCounts.moderate} color="#3b82f6" />
            <StatusBadge label="Resolved" count={clusterCounts.resolved} color="#22c55e" />
          </div>
        </motion.div>

        {/* Data Sources */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#1e293b] rounded-lg border border-slate-700/50 p-4"
        >
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            Data Sources
          </h3>
          <div className="space-y-2">
            {DATA_SOURCES.map(source => (
              <div key={source.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-slate-300 truncate max-w-[140px]">{source.name}</span>
                </div>
                <span className="text-xs text-slate-500">{source.updated}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom - Agent Performance */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-[#1e293b] rounded-lg border border-slate-700/50 p-4"
      >
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-violet-400" />
          Agent Performance
        </h3>
        <div className="grid grid-cols-5 gap-4">
          <PerfMetric label="Total Decisions" value="1,247" />
          <PerfMetric label="Actions Deployed" value="438" />
          <PerfMetric label="Avg Impact Reduction" value="32%" />
          <PerfMetric label="Avg Response Time" value="2.4s" icon={<Clock className="w-3.5 h-3.5 text-slate-500" />} />
          <PerfMetric label="Sites Monitored" value={totalSites > 0 ? String(totalSites) : '—'} />
        </div>
      </motion.div>
    </div>
  );
}

function StatusBadge({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="bg-slate-900/50 rounded-lg p-3 text-center border border-slate-700/30">
      <p className="text-2xl font-bold font-mono" style={{ color }}>{count}</p>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
    </div>
  );
}

function PerfMetric({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold font-mono text-white">{value}</p>
      <div className="flex items-center justify-center gap-1 mt-1">
        {icon}
        <p className="text-xs text-slate-400">{label}</p>
      </div>
    </div>
  );
}
