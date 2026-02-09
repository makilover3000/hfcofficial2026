import { useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Eye, AlertTriangle, Cpu, CheckCircle, Activity } from 'lucide-react';
import type { AgentStatus } from '../types';

const AGENT_ICONS: Record<string, React.ReactNode> = {
  perception: <Eye className="w-6 h-6" />,
  risk: <AlertTriangle className="w-6 h-6" />,
  control: <Cpu className="w-6 h-6" />,
  verification: <CheckCircle className="w-6 h-6" />,
};

const AGENT_COLORS: Record<string, string> = {
  perception: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30',
  risk: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  control: 'text-violet-400 bg-violet-400/10 border-violet-400/30',
  verification: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
};

const AGENT_GLOW: Record<string, string> = {
  perception: 'ring-2 ring-cyan-400/70 shadow-[0_0_15px_rgba(34,211,238,0.3)]',
  risk: 'ring-2 ring-amber-400/70 shadow-[0_0_15px_rgba(251,191,36,0.3)]',
  control: 'ring-2 ring-violet-400/70 shadow-[0_0_15px_rgba(167,139,250,0.3)]',
  verification: 'ring-2 ring-emerald-400/70 shadow-[0_0_15px_rgba(52,211,153,0.3)]',
};

/** Map demo phase to which agent is active (gets highlight + sorted to top) */
const PHASE_TO_ACTIVE_AGENT: Record<string, string> = {
  spike: 'perception',
  detect: 'risk',
  coordinate: 'control',
  mitigate: 'control',
  verify: 'verification',
};

const DEFAULT_ORDER = ['perception', 'risk', 'control', 'verification'];

interface AgentStatusPanelProps {
  agents: AgentStatus[];
  demoPhase?: string | null;
}

export function AgentStatusPanel({ agents, demoPhase }: AgentStatusPanelProps) {
  const activeAgentType = useMemo(() => {
    // During demo, use phase mapping
    if (demoPhase) return PHASE_TO_ACTIVE_AGENT[demoPhase] ?? null;

    // Outside demo, only shuffle when an agent is explicitly set to 'processing'
    // (triggered by Start Heavy Work or similar user actions)
    const processing = agents.find(a => a.status === 'processing');
    if (processing) return processing.agent_type;

    return null;
  }, [demoPhase, agents]);

  const sortedAgents = useMemo(() => {
    const defaultSort = [...agents].sort(
      (a, b) => DEFAULT_ORDER.indexOf(a.agent_type) - DEFAULT_ORDER.indexOf(b.agent_type)
    );

    if (!activeAgentType) return defaultSort;

    // Active agent goes to top, rest keep default order
    const top = defaultSort.filter((a) => a.agent_type === activeAgentType);
    const rest = defaultSort.filter((a) => a.agent_type !== activeAgentType);
    return [...top, ...rest];
  }, [agents, activeAgentType]);

  return (
    <div className="bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden flex flex-col h-full">
      <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-800/50">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">AI Agents</h3>
        </div>
      </div>

      <div className="p-3 flex-1 flex flex-col gap-2 overflow-y-auto">
        <LayoutGroup>
          <AnimatePresence mode="popLayout">
            {sortedAgents.map((agent, index) => {
              const isActive = agent.agent_type === activeAgentType;

              return (
                <motion.div
                  key={agent.agent_type}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{
                    layout: { type: 'spring', stiffness: 350, damping: 30 },
                    delay: index * 0.05,
                  }}
                  className={`p-4 rounded-lg border flex-1 relative overflow-hidden transition-shadow duration-300 ${
                    AGENT_COLORS[agent.agent_type]
                  } ${isActive ? `${AGENT_GLOW[agent.agent_type]} animate-pulse` : ''}`}
                >
                  {/* Activity indicator bar */}
                  <div className="absolute bottom-0 left-0 h-1 bg-current opacity-30 w-full">
                    <motion.div
                      className="h-full bg-current"
                      initial={{ width: 0 }}
                      animate={{ width: `${agent.activity}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-3 rounded-lg bg-black/30">
                      {AGENT_ICONS[agent.agent_type]}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm text-white">{agent.name}</h4>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`status-dot ${
                              agent.status === 'active'
                                ? 'active'
                                : agent.status === 'processing'
                                ? 'warning'
                                : ''
                            }`}
                          />
                          <span className="text-xs uppercase tracking-wide opacity-70">
                            {agent.status}
                          </span>
                        </div>
                      </div>

                      {agent.current_action && (
                        <div className="mt-1 overflow-hidden">
                          <p className="text-xs opacity-80 font-mono whitespace-nowrap animate-marquee">
                            {agent.current_action}
                          </p>
                        </div>
                      )}

                      {agent.alerts.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {agent.alerts.slice(0, 2).map((alert, i) => (
                            <div
                              key={i}
                              className="text-xs px-2 py-1 rounded bg-black/30 text-amber-300 overflow-hidden"
                            >
                              <span className="inline-block whitespace-nowrap animate-marquee">
                                {alert}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </LayoutGroup>

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
