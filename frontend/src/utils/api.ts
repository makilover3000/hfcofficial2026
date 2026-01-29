const API_BASE = 'http://localhost:8000';

export async function fetchSites() {
  const response = await fetch(`${API_BASE}/sites`);
  if (!response.ok) throw new Error('Failed to fetch sites');
  return response.json();
}

export async function fetchAgentStatus() {
  const response = await fetch(`${API_BASE}/agents/status`);
  if (!response.ok) throw new Error('Failed to fetch agent status');
  return response.json();
}

export async function fetchMetrics() {
  const response = await fetch(`${API_BASE}/metrics/district`);
  if (!response.ok) throw new Error('Failed to fetch metrics');
  return response.json();
}

export async function fetchLogs(count = 50) {
  const response = await fetch(`${API_BASE}/logs?count=${count}`);
  if (!response.ok) throw new Error('Failed to fetch logs');
  return response.json();
}

export async function controlSite(siteId: string, updates: Record<string, any>) {
  const response = await fetch(`${API_BASE}/sites/${siteId}/control`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error('Failed to control site');
  return response.json();
}
