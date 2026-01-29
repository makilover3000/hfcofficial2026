import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, Wind, Droplets, Bot, User } from 'lucide-react';
import type { SiteProperties, SiteControl } from '../types';

interface ControlPanelProps {
  site: SiteProperties | null;
  onClose: () => void;
  onControl: (updates: SiteControl) => void;
}

export function ControlPanel({ site, onClose, onControl }: ControlPanelProps) {
  const [noiseLevel, setNoiseLevel] = useState(45);
  const [dustLevel, setDustLevel] = useState(15);
  const [dustSuppression, setDustSuppression] = useState(50);
  const [agentControlled, setAgentControlled] = useState(true);

  useEffect(() => {
    if (site) {
      setNoiseLevel(site.noise_level);
      setDustLevel(site.dust_level);
      setDustSuppression(site.dust_suppression);
      setAgentControlled(site.agent_controlled);
    }
  }, [site]);

  const handleNoiseChange = (value: number) => {
    setNoiseLevel(value);
    onControl({ noise_level: value });
  };

  const handleDustChange = (value: number) => {
    setDustLevel(value);
    onControl({ dust_level: value });
  };

  const handleSuppressionChange = (value: number) => {
    setDustSuppression(value);
    onControl({ dust_suppression: value });
  };

  const handleAgentControlToggle = () => {
    const newValue = !agentControlled;
    setAgentControlled(newValue);
    onControl({ agent_controlled: newValue });
  };

  const getNoiseColor = (level: number) => {
    if (level > 85) return 'bg-red-500';
    if (level > 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getDustColor = (level: number) => {
    if (level > 50) return 'bg-red-500';
    if (level > 35) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStateLabel = (state: string) => {
    switch (state) {
      case 'high_impact': return { text: 'HIGH IMPACT', color: 'bg-red-500' };
      case 'elevated': return { text: 'ELEVATED', color: 'bg-yellow-500' };
      default: return { text: 'NORMAL', color: 'bg-green-500' };
    }
  };

  return (
    <AnimatePresence>
      {site && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="absolute top-4 right-4 w-96 bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-10"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-700 bg-slate-800/50">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-white truncate">{site.name || 'Unknown Site'}</h2>
                <p className="text-sm text-slate-400 truncate mt-1">{site.contractor || 'No contractor info'}</p>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-slate-700 rounded-lg transition-colors ml-2"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <span className={`px-2 py-1 rounded text-xs font-bold text-white ${getStateLabel(site.state).color}`}>
                {getStateLabel(site.state).text}
              </span>
              <span className="text-xs text-slate-500">{site.status}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="p-4 space-y-6">
            {/* Agent Control Toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-2">
                {agentControlled ? (
                  <Bot className="w-5 h-5 text-cyan-400" />
                ) : (
                  <User className="w-5 h-5 text-orange-400" />
                )}
                <span className="text-sm text-white">
                  {agentControlled ? 'AI Controlled' : 'Manual Control'}
                </span>
              </div>
              <button
                onClick={handleAgentControlToggle}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  agentControlled ? 'bg-cyan-500' : 'bg-orange-500'
                }`}
              >
                <motion.div
                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
                  animate={{ left: agentControlled ? 28 : 4 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </div>

            {/* Noise Level */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-300">Pile-Driving Intensity</span>
                </div>
                <span className={`text-sm font-mono font-bold ${noiseLevel > 85 ? 'text-red-400' : noiseLevel > 75 ? 'text-yellow-400' : 'text-green-400'}`}>
                  {noiseLevel.toFixed(0)} dB
                </span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min="40"
                  max="100"
                  step="1"
                  value={noiseLevel}
                  onChange={(e) => handleNoiseChange(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div
                  className={`absolute top-0 left-0 h-2 rounded-lg pointer-events-none ${getNoiseColor(noiseLevel)}`}
                  style={{ width: `${((noiseLevel - 40) / 60) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>40 dB</span>
                <span className="text-yellow-500">75 dB</span>
                <span className="text-red-500">100 dB</span>
              </div>
            </div>

            {/* Dust Level */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wind className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-300">Excavation Dust</span>
                </div>
                <span className={`text-sm font-mono font-bold ${dustLevel > 50 ? 'text-red-400' : dustLevel > 35 ? 'text-yellow-400' : 'text-green-400'}`}>
                  {dustLevel.toFixed(0)} µg/m³
                </span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={dustLevel}
                  onChange={(e) => handleDustChange(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div
                  className={`absolute top-0 left-0 h-2 rounded-lg pointer-events-none ${getDustColor(dustLevel)}`}
                  style={{ width: `${dustLevel}%` }}
                />
              </div>
            </div>

            {/* Dust Suppression */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-slate-300">Dust Suppression</span>
                </div>
                <span className="text-sm font-mono font-bold text-cyan-400">
                  {dustSuppression.toFixed(0)}%
                </span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={dustSuppression}
                  onChange={(e) => handleSuppressionChange(Number(e.target.value))}
                  disabled={agentControlled}
                  className={`w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider ${agentControlled ? 'opacity-50' : ''}`}
                />
                <div
                  className="absolute top-0 left-0 h-2 rounded-lg pointer-events-none bg-cyan-500"
                  style={{ width: `${dustSuppression}%` }}
                />
              </div>
              {agentControlled && (
                <p className="text-xs text-cyan-400/70">AI agent is controlling dust suppression</p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => {
                  handleNoiseChange(90);
                  handleDustChange(60);
                }}
                className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-sm text-red-400 transition-colors"
              >
                Start Heavy Work
              </button>
              <button
                onClick={() => {
                  handleNoiseChange(45);
                  handleDustChange(15);
                }}
                className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-sm text-green-400 transition-colors"
              >
                Reset to Normal
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
