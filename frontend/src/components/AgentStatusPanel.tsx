import { motion } from 'framer-motion';
import { Eye, AlertTriangle, Cpu, CheckCircle, Activity } from 'lucide-react';
import type { AgentStatus } from '../types';

const AGENT_ICONS: Record<string, React.ReactNode> = {
  perception: <Eye className="w-5 h-5" />,
  risk: <AlertTriangle className="w-5 h-5" />,
  control: <Cpu className="w-5 h-5" />,
  verification: <CheckCircle className="w-5 h-5" />,
};

const AGENT_COLORS: Record<string, string> = {
  perception: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30',
  risk: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  control: 'text-violet-400 bg-violet-400/10 border-violet-400/30',
  verification: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
};

interface AgentStatusPanelProps {
  agents: AgentStatus[];
}

export function AgentStatusPanel({ agents }: AgentStatusPanelProps) {
  return (
    <div className="bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-800/50">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">AI Agents</h3>
        </div>
      </div>

      <div className="p-3 space-y-2">
        {agents.map((agent, index) => (
          <motion.div
            key={agent.agent_type}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-3 rounded-lg border ${AGENT_COLORS[agent.agent_type]} relative overflow-hidden`}
          >
            {/* Activity indicator bar */}
            <div className="absolute bottom-0 left-0 h-1 bg-current opacity-30">
              <motion.div
                className="h-full bg-current"
                initial={{ width: 0 }}
                animate={{ width: `${agent.activity}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-black/30">
                {AGENT_ICONS[agent.agent_type]}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm text-white">{agent.name}</h4>
                  <div className="flex items-center gap-1.5">
                    <span className={`status-dot ${agent.status === 'active' ? 'active' : agent.status === 'processing' ? 'warning' : ''}`} />
                    <span className="text-xs uppercase tracking-wide opacity-70">{agent.status}</span>
                  </div>
                </div>

                {agent.current_action && (
                  <p className="text-xs mt-1 opacity-80 truncate font-mono">
                    {agent.current_action}
                  </p>
                )}

                {agent.alerts.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {agent.alerts.slice(0, 2).map((alert, i) => (
                      <div key={i} className="text-xs px-2 py-1 rounded bg-black/30 text-amber-300 truncate">
                        {alert}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}

        {agents.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Waiting for agents...</p>
          </div>
        )}
      </div>
    </div>
  );
}
