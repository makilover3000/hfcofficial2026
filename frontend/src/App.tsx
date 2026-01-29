import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, MapPin, Building2 } from 'lucide-react';

import { Map } from './components/Map';
import { ControlPanel } from './components/ControlPanel';
import { AgentStatusPanel } from './components/AgentStatusPanel';
import { MetricsBar } from './components/MetricsBar';
import { ActionLog } from './components/ActionLog';
import { useWebSocket } from './hooks/useWebSocket';
import { fetchSites } from './utils/api';

import type {
  Site,
  SiteProperties,
  SitesGeoJSON,
  AgentStatus,
  DistrictMetrics,
  ActionLog as ActionLogType,
  WebSocketMessage,
  SiteControl
} from './types';

function App() {
  const [sites, setSites] = useState<SitesGeoJSON | null>(null);
  const [selectedSite, setSelectedSite] = useState<SiteProperties | null>(null);
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [metrics, setMetrics] = useState<DistrictMetrics | null>(null);
  const [logs, setLogs] = useState<ActionLogType[]>([]);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'initial_state':
        if (message.sites) setSites(message.sites);
        if (message.agents) setAgents(message.agents);
        if (message.metrics) setMetrics(message.metrics);
        if (message.logs) setLogs(message.logs);
        break;

      case 'agent_update':
        if (message.agents) setAgents(message.agents);
        if (message.metrics) setMetrics(message.metrics);
        if (message.logs) setLogs(prev => [...message.logs!, ...prev].slice(0, 100));

        // Update sites if there are site_updates
        if (message.site_updates && sites) {
          setSites(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              features: prev.features.map(feature => {
                const updates = message.site_updates![feature.properties.id];
                if (updates) {
                  return {
                    ...feature,
                    properties: { ...feature.properties, ...updates }
                  };
                }
                return feature;
              })
            };
          });

          // Update selected site if it was modified
          if (selectedSite && message.site_updates[selectedSite.id]) {
            setSelectedSite(prev => prev ? { ...prev, ...message.site_updates![prev.id] } : null);
          }
        }
        break;

      case 'site_update':
        if (message.site_id && message.site) {
          setSites(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              features: prev.features.map(feature =>
                feature.properties.id === message.site_id
                  ? { ...feature, properties: message.site as SiteProperties }
                  : feature
              )
            };
          });

          if (selectedSite?.id === message.site_id) {
            setSelectedSite(message.site as SiteProperties);
          }
        }
        if (message.metrics) setMetrics(message.metrics);
        break;

      case 'environment_update':
        if (message.environment && metrics) {
          setMetrics(prev => prev ? { ...prev, environment: message.environment! } : null);
        }
        break;
    }
  }, [sites, selectedSite, metrics]);

  const { isConnected, sendControlUpdate } = useWebSocket(handleWebSocketMessage);

  // Initial fetch fallback
  useEffect(() => {
    if (!sites) {
      fetchSites()
        .then(data => setSites(data))
        .catch(err => console.error('Failed to fetch sites:', err));
    }
  }, [sites]);

  // Handle site selection from map
  const handleSiteSelect = useCallback((site: Site | null) => {
    if (site) {
      setSelectedSite(site.properties);
    } else {
      setSelectedSite(null);
    }
  }, []);

  // Handle control panel updates
  const handleControlUpdate = useCallback((updates: SiteControl) => {
    if (selectedSite) {
      sendControlUpdate(selectedSite.id, updates);
      // Optimistic update
      setSelectedSite(prev => prev ? { ...prev, ...updates } : null);
    }
  }, [selectedSite, sendControlUpdate]);

  const totalSites = sites?.features.length || 0;

  return (
    <div className="h-screen w-screen flex flex-col bg-mission-darker overflow-hidden">
      {/* Top Metrics Bar */}
      <MetricsBar metrics={metrics} />

      {/* Main Content - 3 Column Layout */}
      <div className="flex-1 flex min-h-0">
        {/* Left Panel - Action Log */}
        <div className="w-72 flex flex-col p-3 gap-3 bg-slate-950/50 border-r border-slate-700/50">
          <div className="flex-1 min-h-0">
            <ActionLog logs={logs} />
          </div>
        </div>

        {/* Center - Map Area */}
        <div className="flex-1 relative">
          <Map
            sites={sites}
            selectedSiteId={selectedSite?.id || null}
            onSiteSelect={handleSiteSelect}
          />

          {/* Connection Status */}
          <div className="absolute top-4 left-4 z-10">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-sm border ${
                isConnected
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}
            >
              {isConnected ? (
                <Wifi className="w-4 h-4" />
              ) : (
                <WifiOff className="w-4 h-4" />
              )}
              <span className="text-xs font-semibold uppercase tracking-wider">
                {isConnected ? 'Connected' : 'Reconnecting...'}
              </span>
            </motion.div>
          </div>

          {/* Site Count */}
          <div className="absolute bottom-4 left-4 z-10">
            <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-slate-900/90 backdrop-blur-sm border border-slate-700/50">
              <Building2 className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Construction Sites</p>
                <p className="text-lg font-bold text-white font-mono">{totalSites}</p>
              </div>
            </div>
          </div>

          {/* Title Overlay */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <h1 className="text-xl font-bold text-white tracking-tight">
                <span className="text-cyan-400">HDB</span> Construction Orchestration
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Multi-Agent AI System for District-Wide Coordination
              </p>
            </motion.div>
          </div>

          {/* Control Panel */}
          <ControlPanel
            site={selectedSite}
            onClose={() => setSelectedSite(null)}
            onControl={handleControlUpdate}
          />

          {/* Click hint when no site selected */}
          <AnimatePresence>
            {!selectedSite && sites && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute bottom-4 right-4 z-10"
              >
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900/90 backdrop-blur-sm border border-cyan-500/30 text-cyan-400">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">Click a site to control</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Panel - AI Agents */}
        <div className="w-72 flex flex-col p-3 gap-3 bg-slate-950/50 border-l border-slate-700/50">
          <AgentStatusPanel agents={agents} />
        </div>
      </div>
    </div>
  );
}

export default App;
