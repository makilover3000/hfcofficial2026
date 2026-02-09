import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, MapPin, Building2 } from 'lucide-react';

import { Map } from './components/Map';
import { ControlPanel } from './components/ControlPanel';
import { AgentStatusPanel } from './components/AgentStatusPanel';
import { MetricsBar } from './components/MetricsBar';
import { ActionLog } from './components/ActionLog';
import { TabBar } from './components/TabBar';
import { OrchestrationTab } from './components/OrchestrationTab';
import { TownCouncilTab } from './components/TownCouncilTab';
import { AnalyticsTab } from './components/AnalyticsTab';
import { WelcomeOverlay } from './components/WelcomeOverlay';
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
  SiteControl,
  TabType,
  Cluster,
  Alert,
  DemoEvent,
  CoordinationSignal
} from './types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function App() {
  const [sites, setSites] = useState<SitesGeoJSON | null>(null);
  const [selectedSite, setSelectedSite] = useState<SiteProperties | null>(null);
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [metrics, setMetrics] = useState<DistrictMetrics | null>(null);
  const [logs, setLogs] = useState<ActionLogType[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('map');
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [demoEvent, setDemoEvent] = useState<DemoEvent | null>(null);
  const [signals, setSignals] = useState<CoordinationSignal[]>([]);

  // Handle WebSocket messages — no deps to avoid stale closures
  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'initial_state':
        if (message.sites) setSites(message.sites);
        if (message.agents) setAgents(message.agents);
        if (message.metrics) setMetrics(message.metrics);
        if (message.logs) setLogs(message.logs);
        if (message.clusters) setClusters(message.clusters);
        if (message.alerts) setAlerts(message.alerts);
        break;

      case 'agent_update':
        if (message.agents) setAgents(message.agents);
        if (message.metrics) setMetrics(message.metrics);
        if (message.logs) setLogs(prev => [...message.logs!, ...prev].slice(0, 100));
        if (message.clusters) setClusters(message.clusters);

        if (message.site_updates) {
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

          setSelectedSite(prev => {
            if (!prev) return prev;
            const updates = message.site_updates![prev.id];
            return updates ? { ...prev, ...updates } : prev;
          });
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

          setSelectedSite(prev =>
            prev?.id === message.site_id ? (message.site as SiteProperties) : prev
          );
        }
        if (message.metrics) setMetrics(message.metrics);
        break;

      case 'environment_update':
        if (message.environment) {
          setMetrics(prev => prev ? { ...prev, environment: message.environment! } : null);
        }
        break;

      case 'demo_event':
        if (message.demo) setDemoEvent(message.demo);
        if (message.sites) setSites(message.sites);
        if (message.metrics) setMetrics(message.metrics);
        if (message.alerts) setAlerts(message.alerts);
        if (message.clusters) setClusters(message.clusters);
        if (message.logs) {
          setLogs(prev => {
            // Find new logs not already in the list (by timestamp+agent)
            const existingKeys = new Set(prev.map(l => `${l.timestamp}-${l.agent}-${l.type}`));
            const newLogs = message.logs!.filter(l => !existingKeys.has(`${l.timestamp}-${l.agent}-${l.type}`));
            return [...newLogs, ...prev].slice(0, 100);
          });
        }
        break;

      case 'alert_update':
        if (message.alerts) setAlerts(message.alerts);
        break;

      case 'coordination_signal':
        if (message.signal) {
          setSignals(prev => [...prev, message.signal!]);
        }
        break;
    }
  }, []);

  const { isConnected, sendControlUpdate } = useWebSocket(handleWebSocketMessage);

  // Fetch initial data
  useEffect(() => {
    if (!sites) {
      fetchSites()
        .then(data => setSites(data))
        .catch(err => console.error('Failed to fetch sites:', err));
    }
  }, [sites]);

  // Fetch initial alerts and clusters
  useEffect(() => {
    fetch(`${API_BASE}/alerts`).then(r => r.json()).then(setAlerts).catch(() => {});
    fetch(`${API_BASE}/clusters`).then(r => r.json()).then(setClusters).catch(() => {});
  }, []);

  const handleSiteSelect = useCallback((site: Site | null) => {
    if (site) {
      setSelectedSite(site.properties);
    } else {
      setSelectedSite(null);
    }
  }, []);

  const handleControlUpdate = useCallback((updates: SiteControl) => {
    if (selectedSite) {
      sendControlUpdate(selectedSite.id, updates);
      setSelectedSite(prev => prev ? { ...prev, ...updates } : null);
    }
  }, [selectedSite, sendControlUpdate]);

  const handleStartDemo = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/demo/start`, { method: 'POST' });
    } catch (e) {
      console.error('Failed to start demo:', e);
    }
  }, []);

  const handleResetDemo = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/demo/reset`, { method: 'POST' });
      setDemoEvent(null);
      setSignals([]);
    } catch (e) {
      console.error('Failed to reset demo:', e);
    }
  }, []);

  const handleApproveAlert = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/alerts/${id}/approve`, { method: 'POST' });
      const updated = await res.json();
      setAlerts(prev => prev.map(a => a.id === id ? updated : a));
    } catch (e) {
      console.error('Failed to approve alert:', e);
    }
  }, []);

  const handleOverrideAlert = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/alerts/${id}/override`, { method: 'POST' });
      const updated = await res.json();
      setAlerts(prev => prev.map(a => a.id === id ? updated : a));
    } catch (e) {
      console.error('Failed to override alert:', e);
    }
  }, []);

  const totalSites = sites?.features.length || 0;

  // During demo, hide noisy district_assessment logs so only agent action logs show
  const isDemoRunning = demoEvent && demoEvent.phase !== 'complete';
  const filteredLogs = isDemoRunning
    ? logs.filter(l => l.type !== 'district_assessment')
    : logs;

  return (
    <div className="h-screen w-screen flex flex-col bg-mission-darker overflow-hidden">
      {/* Welcome Overlay */}
      <WelcomeOverlay />

      {/* Top Metrics Bar */}
      <MetricsBar metrics={metrics} />

      {/* Tab Bar */}
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        <AnimatePresence mode="wait">
          {activeTab === 'map' && (
            <motion.div
              key="map"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex min-h-0"
            >
              {/* Left Panel - Action Log */}
              <div className="w-72 flex flex-col p-3 gap-3 bg-slate-950/50 border-r border-slate-700/50">
                <div className="flex-1 min-h-0">
                  <ActionLog logs={filteredLogs} />
                </div>
              </div>

              {/* Center - Map Area */}
              <div className="flex-1 relative">
                <Map
                  sites={sites}
                  selectedSiteId={selectedSite?.id || null}
                  onSiteSelect={handleSiteSelect}
                  demoEvent={demoEvent}
                  signals={signals}
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
                      <span className="text-cyan-400">UrbanPulse</span> AI
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                      Multi-Agent AI System for District-Wide Coordination
                    </p>
                  </motion.div>
                </div>

                {/* Start Demo Button */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                  <motion.button
                    onClick={handleStartDemo}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold shadow-lg shadow-blue-500/30 animate-pulse hover:animate-none"
                  >
                    Start Demo
                  </motion.button>
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
                <AgentStatusPanel agents={agents} demoPhase={demoEvent?.phase || null} />
              </div>
            </motion.div>
          )}

          {activeTab === 'orchestration' && (
            <motion.div
              key="orchestration"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 min-h-0"
            >
              <OrchestrationTab
                clusters={clusters}
                demoEvent={demoEvent}
                signals={signals}
                sites={sites}
                onStartDemo={handleStartDemo}
                onResetDemo={handleResetDemo}
              />
            </motion.div>
          )}

          {activeTab === 'council' && (
            <motion.div
              key="council"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 min-h-0"
            >
              <TownCouncilTab
                alerts={alerts}
                onApprove={handleApproveAlert}
                onOverride={handleOverrideAlert}
              />
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 min-h-0"
            >
              <AnalyticsTab clusters={clusters} metrics={metrics} totalSites={totalSites} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
