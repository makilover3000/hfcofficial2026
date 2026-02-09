import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Play, RotateCcw, Zap, Shield, Eye, CheckCircle } from 'lucide-react';
import type { Cluster, DemoEvent, CoordinationSignal, SitesGeoJSON, SiteState } from '../types';

interface OrchestrationTabProps {
  clusters: Cluster[];
  demoEvent: DemoEvent | null;
  signals: CoordinationSignal[];
  sites: SitesGeoJSON | null;
  onStartDemo: () => void;
  onResetDemo: () => void;
}

const SEVERITY_COLORS: Record<string, string> = {
  normal: '#22c55e',
  elevated: '#eab308',
  high_impact: '#ef4444',
};

const SEVERITY_LABELS: Record<string, string> = {
  normal: 'Normal',
  elevated: 'Warning',
  high_impact: 'Critical',
};

const PHASE_INFO: Record<string, { label: string; icon: typeof Activity; color: string }> = {
  spike: { label: 'Noise Spike Detected', icon: Zap, color: 'text-red-400' },
  detect: { label: 'Perception Agent Alert', icon: Eye, color: 'text-amber-400' },
  coordinate: { label: 'Coordinating Response', icon: Activity, color: 'text-blue-400' },
  mitigate: { label: 'Mitigation Active', icon: Shield, color: 'text-violet-400' },
  verify: { label: 'Verification Complete', icon: CheckCircle, color: 'text-emerald-400' },
  complete: { label: 'Demo Complete', icon: CheckCircle, color: 'text-emerald-400' },
};

export function OrchestrationTab({ clusters, demoEvent, signals, sites, onStartDemo, onResetDemo }: OrchestrationTabProps) {
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);

  // Auto-select the affected cluster when demo is running
  const autoSelectedCluster = useMemo(() => {
    if (demoEvent && demoEvent.phase !== 'complete' && demoEvent.demo_site_ids?.length) {
      // Find the cluster that contains any of the demo sites
      const affected = clusters.find(c =>
        c.site_ids.some(id => demoEvent.demo_site_ids!.includes(id))
      );
      if (affected) return affected.id;
    }
    return null;
  }, [demoEvent, clusters]);

  const effectiveClusterId = autoSelectedCluster || selectedCluster;

  const selected = useMemo(
    () => clusters.find(c => c.id === effectiveClusterId) || clusters[0] || null,
    [clusters, effectiveClusterId]
  );

  // During demo, pull site data directly from sites GeoJSON using demo_site_ids
  // so we always show exactly the 3 demo sites regardless of cluster grouping
  const demoSites = useMemo(() => {
    if (!selected || !sites) return [];
    if (demoEvent && demoEvent.phase !== 'complete' && demoEvent.demo_site_ids?.length) {
      return demoEvent.demo_site_ids.map(id => {
        const feature = sites.features.find(f => f.properties.id === id);
        if (feature) {
          return {
            id: feature.properties.id,
            name: feature.properties.name,
            state: feature.properties.state,
            noise_level: feature.properties.noise_level,
            dust_level: feature.properties.dust_level,
          };
        }
        return null;
      }).filter(Boolean) as Array<{ id: string; name: string; state: SiteState; noise_level: number; dust_level: number }>;
    }
    return selected.sites_data.slice(0, 3);
  }, [selected, sites, demoEvent]);

  const phaseInfo = demoEvent ? PHASE_INFO[demoEvent.phase] : null;

  return (
    <div className="flex h-full bg-slate-950">
      {/* Left Panel - Cluster List */}
      <div className="w-64 border-r border-slate-700/50 flex flex-col">
        <div className="px-4 py-3 border-b border-slate-700/50">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Clusters</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {clusters.length === 0 && (
            <p className="text-xs text-slate-500 px-2 py-4">No clusters detected</p>
          )}
          {clusters.map(cluster => (
            <motion.button
              key={cluster.id}
              onClick={() => setSelectedCluster(cluster.id)}
              whileHover={{ scale: 1.01 }}
              className={`w-full text-left rounded-lg p-3 border transition-colors ${
                selected?.id === cluster.id || effectiveClusterId === cluster.id
                  ? 'bg-[#1e293b] border-blue-500/50'
                  : 'bg-[#1e293b]/50 border-slate-700/50 hover:border-slate-600'
              }`}
              style={{ borderLeftWidth: 4, borderLeftColor: SEVERITY_COLORS[cluster.severity] }}
            >
              <p className="text-sm font-medium text-white truncate">{cluster.name}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xs text-slate-400">{cluster.site_ids.length} sites</span>
                <span
                  className="text-xs px-1.5 py-0.5 rounded font-medium"
                  style={{
                    backgroundColor: `${SEVERITY_COLORS[cluster.severity]}20`,
                    color: SEVERITY_COLORS[cluster.severity]
                  }}
                >
                  {SEVERITY_LABELS[cluster.severity]}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Center Panel - SVG Diagram */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        {selected ? (
          <div className="w-full max-w-2xl">
            <svg viewBox="0 0 600 400" className="w-full h-auto">
              {/* Impact zones */}
              {demoSites.map((site, i) => {
                const cx = 150 + i * 150;
                const cy = 200;
                const isHighImpact = site.state === 'high_impact';
                const isElevated = site.state === 'elevated';
                return (
                  <g key={site.id}>
                    {/* Radiating impact zone */}
                    <circle
                      cx={cx} cy={cy} r={80}
                      fill={SEVERITY_COLORS[site.state]}
                      opacity={0.08}
                    >
                      {(isHighImpact || isElevated) && (
                        <animate attributeName="r" values="70;90;70" dur="2s" repeatCount="indefinite" />
                      )}
                    </circle>
                    <circle
                      cx={cx} cy={cy} r={50}
                      fill={SEVERITY_COLORS[site.state]}
                      opacity={0.15}
                    />
                    {/* Site circle */}
                    <circle
                      cx={cx} cy={cy} r={30}
                      fill={`${SEVERITY_COLORS[site.state]}40`}
                      stroke={SEVERITY_COLORS[site.state]}
                      strokeWidth={2}
                    >
                      {isHighImpact && (
                        <animate attributeName="stroke-width" values="2;4;2" dur="1s" repeatCount="indefinite" />
                      )}
                    </circle>
                    {/* Label */}
                    <text x={cx} y={cy - 5} textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
                      {String.fromCharCode(65 + i)}
                    </text>
                    <text x={cx} y={cy + 12} textAnchor="middle" fill="#94a3b8" fontSize="9">
                      {site.name}
                    </text>
                    {/* Noise value */}
                    <text x={cx} y={cy + 50} textAnchor="middle" fill={SEVERITY_COLORS[site.state]} fontSize="11" fontFamily="monospace">
                      {site.noise_level}dB
                    </text>

                    {/* HDB block squares */}
                    {[0, 1, 2].map(j => (
                      <rect
                        key={j}
                        x={cx - 40 + j * 30}
                        y={cy + 65}
                        width={20}
                        height={16}
                        rx={2}
                        fill="#374151"
                        stroke="#4b5563"
                        strokeWidth={1}
                      />
                    ))}
                    <text x={cx} y={cy + 95} textAnchor="middle" fill="#6b7280" fontSize="8">
                      HDB Blocks
                    </text>
                  </g>
                );
              })}

              {/* Connection lines between sites */}
              {demoSites.length >= 2 && (
                <>
                  <line x1={180} y1={200} x2={270} y2={200} stroke="#3b82f6" strokeWidth={1} strokeDasharray="4,4" opacity={0.3} />
                  {demoSites.length >= 3 && (
                    <line x1={330} y1={200} x2={420} y2={200} stroke="#3b82f6" strokeWidth={1} strokeDasharray="4,4" opacity={0.3} />
                  )}
                </>
              )}

              {/* SVG defs for glow filter */}
              <defs>
                <filter id="wave-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Spike phase — shockwave rings from Site A */}
              {demoEvent && demoEvent.phase === 'spike' && (
                <>
                  {[0, 0.5, 1].map((delay, i) => (
                    <circle key={`spike-${i}`} cx={150} cy={200} fill="none" stroke="#ef4444" strokeWidth={2} filter="url(#wave-glow)">
                      <animate attributeName="r" values="30;120" dur="2s" begin={`${delay}s`} repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.6;0" dur="2s" begin={`${delay}s`} repeatCount="indefinite" />
                    </circle>
                  ))}
                </>
              )}

              {/* Detect phase — scanning pulse from Site A */}
              {demoEvent && demoEvent.phase === 'detect' && (
                <>
                  {[0, 0.7, 1.4].map((delay, i) => (
                    <circle key={`detect-${i}`} cx={150} cy={200} fill="none" stroke="#eab308" strokeWidth={2} filter="url(#wave-glow)">
                      <animate attributeName="r" values="30;100" dur="2s" begin={`${delay}s`} repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.5;0" dur="2s" begin={`${delay}s`} repeatCount="indefinite" />
                    </circle>
                  ))}
                  {/* Scanning arc */}
                  <circle cx={150} cy={200} r={60} fill="none" stroke="#eab308" strokeWidth={1} strokeDasharray="20,60" opacity={0.4}>
                    <animateTransform attributeName="transform" type="rotate" from="0 150 200" to="360 150 200" dur="2s" repeatCount="indefinite" />
                  </circle>
                </>
              )}

              {/* Coordinate phase — expanding waves from A traveling to B and C */}
              {demoEvent && (demoEvent.phase === 'coordinate' || demoEvent.phase === 'mitigate') && demoSites.length >= 2 && (
                <>
                  {/* Wave rings expanding from A toward B */}
                  {[0, 0.6, 1.2].map((delay, i) => (
                    <circle key={`wave-ab-${i}`} cx={150} cy={200} fill="none" stroke="#3b82f6" strokeWidth={3} filter="url(#wave-glow)">
                      <animate attributeName="r" values="30;160" dur="2s" begin={`${delay}s`} repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.7;0" dur="2s" begin={`${delay}s`} repeatCount="indefinite" />
                    </circle>
                  ))}

                  {/* Wave rings expanding from A toward C (larger reach) */}
                  {demoSites.length >= 3 && [0.3, 0.9, 1.5].map((delay, i) => (
                    <circle key={`wave-ac-${i}`} cx={150} cy={200} fill="none" stroke="#60a5fa" strokeWidth={2} filter="url(#wave-glow)">
                      <animate attributeName="r" values="30;310" dur="3s" begin={`${delay}s`} repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.5;0" dur="3s" begin={`${delay}s`} repeatCount="indefinite" />
                    </circle>
                  ))}

                  {/* Receiving pulse at B */}
                  <circle cx={300} cy={200} fill="none" stroke="#3b82f6" strokeWidth={2} opacity={0.5}>
                    <animate attributeName="r" values="25;45;25" dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.5;0.1;0.5" dur="1.5s" repeatCount="indefinite" />
                  </circle>

                  {/* Receiving pulse at C */}
                  {demoSites.length >= 3 && (
                    <circle cx={450} cy={200} fill="none" stroke="#60a5fa" strokeWidth={2} opacity={0.5}>
                      <animate attributeName="r" values="25;45;25" dur="1.5s" begin="0.3s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.5;0.1;0.5" dur="1.5s" begin="0.3s" repeatCount="indefinite" />
                    </circle>
                  )}

                  {/* Connecting arc beams A→B and A→C */}
                  <path d="M150,200 Q225,140 300,200" fill="none" stroke="#3b82f6" strokeWidth={2} strokeDasharray="8,6" opacity={0.6}>
                    <animate attributeName="stroke-dashoffset" values="0;-28" dur="1s" repeatCount="indefinite" />
                  </path>
                  {demoSites.length >= 3 && (
                    <path d="M150,200 Q300,120 450,200" fill="none" stroke="#60a5fa" strokeWidth={2} strokeDasharray="8,6" opacity={0.5}>
                      <animate attributeName="stroke-dashoffset" values="0;-28" dur="1s" repeatCount="indefinite" />
                    </path>
                  )}
                </>
              )}

              {/* Verify phase — green success waves from all sites */}
              {demoEvent && demoEvent.phase === 'verify' && (
                <>
                  {demoSites.map((_, i) => {
                    const cx = 150 + i * 150;
                    return [0, 0.5, 1].map((delay, j) => (
                      <circle key={`verify-${i}-${j}`} cx={cx} cy={200} fill="none" stroke="#22c55e" strokeWidth={2} filter="url(#wave-glow)">
                        <animate attributeName="r" values="30;80" dur="2s" begin={`${delay}s`} repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.5;0" dur="2s" begin={`${delay}s`} repeatCount="indefinite" />
                      </circle>
                    ));
                  })}
                </>
              )}
            </svg>

            {/* Phase indicator */}
            <AnimatePresence mode="wait">
              {phaseInfo && (
                <motion.div
                  key={demoEvent?.phase}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="w-full flex justify-center mt-4"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#1e293b] border border-slate-700 ${phaseInfo.color}`}>
                      <phaseInfo.icon className="w-5 h-5" />
                      <span className="text-base font-semibold">{phaseInfo.label}</span>
                      {demoEvent?.reduction_pct && (
                        <span className="text-emerald-400 font-mono text-sm ml-2">
                          {demoEvent.before}dB → {demoEvent.after}dB ↓{demoEvent.reduction_pct}%
                        </span>
                      )}
                    </div>
                    <div className="px-3 py-1.5 rounded-md bg-cyan-500/10 border border-cyan-500/30">
                      <span className="text-xs text-cyan-400 font-medium">
                        Real-time cycle: ~1-2 hrs | Demo compressed to 18s
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <p className="text-slate-500">Select a cluster to view orchestration diagram</p>
        )}
      </div>

      {/* Right Panel - Detail & Controls */}
      <div className="w-72 border-l border-slate-700/50 flex flex-col">
        <div className="px-4 py-3 border-b border-slate-700/50">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Detail</h2>
        </div>

        {selected ? (
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* Cluster name */}
            <div className="bg-[#1e293b] rounded-lg p-3 border border-slate-700/50">
              <p className="text-xs text-slate-400 uppercase tracking-wider">Cluster</p>
              <p className="text-white font-medium mt-1">{selected.name}</p>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className="text-xs px-2 py-0.5 rounded font-medium"
                  style={{
                    backgroundColor: `${SEVERITY_COLORS[selected.severity]}20`,
                    color: SEVERITY_COLORS[selected.severity]
                  }}
                >
                  {SEVERITY_LABELS[selected.severity]}
                </span>
                <span className="text-xs text-slate-400">{selected.site_ids.length} sites</span>
              </div>
            </div>

            {/* Before/After (during demo) */}
            {demoEvent && demoEvent.phase === 'verify' && (
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
                  <p className="text-xs text-red-400">Before</p>
                  <p className="text-2xl font-mono font-bold text-red-400">{demoEvent.before}</p>
                  <p className="text-xs text-slate-500">dB</p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
                  <p className="text-xs text-emerald-400">After</p>
                  <p className="text-2xl font-mono font-bold text-emerald-400">{demoEvent.after}</p>
                  <p className="text-xs text-slate-500">dB</p>
                </div>
              </div>
            )}

            {/* Sites in cluster */}
            <div className="bg-[#1e293b] rounded-lg p-3 border border-slate-700/50">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Sites</p>
              <div className="space-y-2">
                {selected.sites_data.map(site => (
                  <div key={site.id} className="flex items-center justify-between">
                    <span className="text-sm text-white">{site.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400">{site.noise_level}dB</span>
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: SEVERITY_COLORS[site.state] }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Agent actions feed */}
            {signals.length > 0 && (
              <div className="bg-[#1e293b] rounded-lg p-3 border border-slate-700/50">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Agent Actions</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {signals.slice(-5).reverse().map((sig, i) => (
                    <div key={i} className="text-xs">
                      <span className="text-blue-400">{sig.action}</span>
                      <p className="text-slate-500 mt-0.5">{sig.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Demo buttons */}
            <div className="space-y-2 pt-2">
              <motion.button
                onClick={onStartDemo}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium text-sm shadow-lg shadow-blue-500/20"
              >
                <Play className="w-4 h-4" />
                Start Demo
              </motion.button>
              <motion.button
                onClick={onResetDemo}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-600 text-slate-300 font-medium text-sm hover:bg-slate-800"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Demo
              </motion.button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <p className="text-sm text-slate-500 text-center">No cluster selected</p>
          </div>
        )}
      </div>
    </div>
  );
}
