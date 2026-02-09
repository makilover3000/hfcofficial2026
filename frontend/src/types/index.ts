export type SiteState = 'normal' | 'elevated' | 'high_impact';

export type TabType = 'map' | 'orchestration' | 'council' | 'analytics';

export interface SiteProperties {
  id: string;
  name: string;
  state: SiteState;
  noise_level: number;
  dust_level: number;
  dust_suppression: number;
  contractor: string;
  status: string;
  agent_controlled: boolean;
}

export interface Site {
  type: 'Feature';
  id: string;
  properties: SiteProperties;
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
}

export interface SitesGeoJSON {
  type: 'FeatureCollection';
  features: Site[];
}

export interface EnvironmentData {
  pm25: number;
  temperature: number;
  humidity: number;
  wind_speed: number;
  wind_direction: string;
  rainfall: number;
  last_update: string;
}

export interface DistrictMetrics {
  max_noise: number;
  max_noise_site: string | null;
  total_pm25: number;
  baseline_pm25: number;
  construction_pm25: number;
  elevated_sites: number;
  high_impact_sites: number;
  affected_residents: number;
  risk_score: number;
  environment: EnvironmentData;
}

export type AgentType = 'perception' | 'risk' | 'control' | 'verification';

export interface AgentStatus {
  agent_type: AgentType;
  name: string;
  status: string;
  activity: number;
  current_action: string | null;
  last_update: string;
  alerts: string[];
}

export interface ActionLog {
  timestamp: string;
  agent: string;
  icon: string;
  type: string;
  site_id?: string;
  site_name?: string;
  message?: string;
  updates?: Record<string, any>;
  new_state?: string;
  action?: string;
  new_value?: number;
}

export interface WebSocketMessage {
  type: 'initial_state' | 'agent_update' | 'site_update' | 'environment_update' | 'demo_event' | 'alert_update' | 'coordination_signal';
  sites?: SitesGeoJSON;
  agents?: AgentStatus[];
  metrics?: DistrictMetrics;
  logs?: ActionLog[];
  site_id?: string;
  site?: SiteProperties;
  site_updates?: Record<string, Partial<SiteProperties>>;
  environment?: EnvironmentData;
  clusters?: Cluster[];
  alerts?: Alert[];
  demo?: DemoEvent;
  signal?: CoordinationSignal;
}

export interface SiteControl {
  noise_level?: number;
  dust_level?: number;
  dust_suppression?: number;
  agent_controlled?: boolean;
}

export interface Cluster {
  id: string;
  name: string;
  site_ids: string[];
  centroid: [number, number];
  severity: SiteState;
  sites_data: Array<{
    id: string;
    name: string;
    state: SiteState;
    noise_level: number;
    dust_level: number;
  }>;
}

export interface Alert {
  id: string;
  timestamp: string;
  severity: 'critical' | 'warning' | 'moderate' | 'info';
  cluster_name: string;
  recommendation: string;
  affected_blocks: string[];
  resident_count: number;
  status: 'pending' | 'approved' | 'overridden';
  decision_by?: string;
}

export interface DemoEvent {
  phase: 'spike' | 'detect' | 'coordinate' | 'mitigate' | 'verify' | 'complete';
  site_id?: string;
  demo_site_ids?: string[];
  cluster_center?: [number, number];
  before?: number;
  after?: number;
  reduction_pct?: number;
}

export interface CoordinationSignal {
  from_site_id: string;
  to_site_id: string;
  action: string;
  message: string;
}
