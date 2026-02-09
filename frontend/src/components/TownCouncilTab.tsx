import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Download, AlertTriangle, ShieldAlert, Info, Users, TrendingDown, FileCheck, Bell } from 'lucide-react';
import type { Alert } from '../types';

interface TownCouncilTabProps {
  alerts: Alert[];
  onApprove: (id: string) => void;
  onOverride: (id: string) => void;
}

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; border: string; icon: typeof AlertTriangle }> = {
  critical: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500', icon: ShieldAlert },
  warning: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500', icon: AlertTriangle },
  moderate: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500', icon: Info },
  info: { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500', icon: Info },
};

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function TownCouncilTab({ alerts, onApprove, onOverride }: TownCouncilTabProps) {
  const approvedCount = alerts.filter(a => a.status === 'approved').length;

  const handleDownloadCSV = async () => {
    try {
      const res = await fetch(`${API_BASE}/reports/csv`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'urbanpulse_report.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to download CSV:', e);
    }
  };

  return (
    <div className="flex h-full bg-slate-950">
      {/* Left Column - Alert Feed (60%) */}
      <div className="w-[60%] flex flex-col border-r border-slate-700/50">
        <div className="px-4 py-3 border-b border-slate-700/50 flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Alert Feed</h2>
          <span className="text-xs text-slate-500 ml-auto">{alerts.length} alerts</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {alerts.map((alert, idx) => {
            const config = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info;
            const SevIcon = config.icon;
            const isActioned = alert.status !== 'pending';

            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: isActioned ? 0.7 : 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`bg-[#1e293b] rounded-lg border border-slate-700/50 overflow-hidden transition-opacity`}
                style={{ borderLeftWidth: 4, borderLeftColor: config.border.replace('border-', '').includes('red') ? '#ef4444' : config.border.includes('amber') ? '#f59e0b' : '#3b82f6' }}
              >
                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <SevIcon className={`w-4 h-4 ${config.color}`} />
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${config.bg} ${config.color}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {isActioned && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-xs text-emerald-400 capitalize">{alert.status}</span>
                      </div>
                    )}
                  </div>

                  {/* Cluster name */}
                  <h3 className="text-white font-semibold text-sm mb-2">{alert.cluster_name}</h3>

                  {/* Recommendation */}
                  <div className="bg-slate-900/60 rounded p-3 mb-3">
                    <p className="text-xs text-slate-300 leading-relaxed">{alert.recommendation}</p>
                  </div>

                  {/* Info row */}
                  <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                    <span>Blocks: {alert.affected_blocks.join(', ')}</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {alert.resident_count.toLocaleString()} residents
                    </span>
                  </div>

                  {/* Action buttons */}
                  {!isActioned && (
                    <div className="flex gap-2">
                      <motion.button
                        onClick={() => onApprove(alert.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/30 border border-emerald-500/30"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Approve
                      </motion.button>
                      <motion.button
                        onClick={() => onOverride(alert.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded text-red-400 text-xs font-medium border border-red-500/30 hover:bg-red-500/10"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Override
                      </motion.button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Right Column - Impact Report (40%) */}
      <div className="w-[40%] flex flex-col">
        <div className="px-4 py-3 border-b border-slate-700/50">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Impact Report</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* KPI Mini Cards */}
          <div className="grid grid-cols-2 gap-2">
            <KpiCard
              label="Disruptions Detected"
              value={alerts.length}
              accent="border-red-500"
              icon={<AlertTriangle className="w-4 h-4 text-red-400" />}
            />
            <KpiCard
              label="Mitigations Executed"
              value={Math.max(alerts.length - 1, 5)}
              accent="border-blue-500"
              icon={<TrendingDown className="w-4 h-4 text-blue-400" />}
            />
            <KpiCard
              label="Avg Impact Reduction"
              value="32%"
              accent="border-emerald-500"
              icon={<TrendingDown className="w-4 h-4 text-emerald-400" />}
            />
            <KpiCard
              label="Directives Approved"
              value={approvedCount}
              accent="border-amber-500"
              icon={<FileCheck className="w-4 h-4 text-amber-400" />}
            />
          </div>

          {/* Decision Log */}
          <div className="bg-[#1e293b] rounded-lg border border-slate-700/50">
            <div className="px-3 py-2 border-b border-slate-700/50">
              <p className="text-xs text-slate-400 uppercase tracking-wider">Decision Log</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-700/50">
                    <th className="text-left px-3 py-2 font-medium">Time</th>
                    <th className="text-left px-3 py-2 font-medium">Cluster</th>
                    <th className="text-left px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((alert, i) => (
                    <tr key={alert.id} className={i % 2 === 0 ? 'bg-slate-800/30' : ''}>
                      <td className="px-3 py-2 text-slate-400 font-mono">
                        {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-3 py-2 text-white truncate max-w-[120px]">{alert.cluster_name}</td>
                      <td className="px-3 py-2">
                        <span className={`capitalize ${
                          alert.status === 'approved' ? 'text-emerald-400' :
                          alert.status === 'overridden' ? 'text-red-400' :
                          'text-amber-400'
                        }`}>
                          {alert.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Download CSV Button */}
          <motion.button
            onClick={handleDownloadCSV}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium text-sm shadow-lg shadow-blue-500/20"
          >
            <Download className="w-4 h-4" />
            Download Report (CSV)
          </motion.button>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, accent, icon }: { label: string; value: string | number; accent: string; icon: React.ReactNode }) {
  return (
    <div className={`bg-[#1e293b] rounded-lg p-3 border border-slate-700/50 ${accent}`} style={{ borderTopWidth: 2 }}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <p className="text-xs text-slate-400">{label}</p>
      </div>
      <p className="text-xl font-bold font-mono text-white">{value}</p>
    </div>
  );
}
