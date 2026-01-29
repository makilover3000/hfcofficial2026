import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, ChevronRight } from 'lucide-react';
import type { ActionLog as ActionLogType } from '../types';

interface ActionLogProps {
  logs: ActionLogType[];
}

export function ActionLog({ logs }: ActionLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [logs.length]);

  const getLogColor = (type: string, agent: string) => {
    if (agent === 'User') return 'border-orange-500/50 bg-orange-500/5';
    switch (type) {
      case 'threshold_breach':
      case 'high_impact':
        return 'border-red-500/50 bg-red-500/5';
      case 'state_change':
        return 'border-amber-500/50 bg-amber-500/5';
      case 'control_action':
      case 'dust_suppression':
        return 'border-violet-500/50 bg-violet-500/5';
      case 'verification':
      case 'effectiveness':
        return 'border-emerald-500/50 bg-emerald-500/5';
      default:
        return 'border-cyan-500/50 bg-cyan-500/5';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const formatLogMessage = (log: ActionLogType) => {
    if (log.message) return log.message;

    if (log.type === 'user_control') {
      const updates = Object.entries(log.updates || {})
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      return `Manual adjustment: ${updates}`;
    }

    if (log.type === 'threshold_breach') {
      return `Detected threshold breach at ${log.site_name}`;
    }

    if (log.type === 'state_change') {
      return `${log.site_name} -> ${log.new_state?.toUpperCase()}`;
    }

    if (log.type === 'control_action' || log.type === 'dust_suppression') {
      return `${log.action} at ${log.site_name}${log.new_value ? ` (${log.new_value}%)` : ''}`;
    }

    return log.type.replace(/_/g, ' ');
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden flex flex-col h-full">
      <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-800/50 shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Action Log</h3>
          <span className="text-xs text-slate-500 ml-auto">{logs.length} events</span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-1.5 min-h-0">
        <AnimatePresence initial={false}>
          {logs.map((log, index) => (
            <motion.div
              key={`${log.timestamp}-${index}`}
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className={`px-3 py-2 rounded-lg border-l-2 ${getLogColor(log.type, log.agent)}`}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg shrink-0">{log.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">{log.agent}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {formatTime(log.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                    {formatLogMessage(log)}
                  </p>
                  {log.site_name && log.type !== 'user_control' && (
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500">
                      <ChevronRight className="w-3 h-3" />
                      <span>{log.site_name}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {logs.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No actions yet</p>
            <p className="text-xs mt-1">Adjust site controls to see AI responses</p>
          </div>
        )}
      </div>
    </div>
  );
}
