import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Site, SitesGeoJSON, DemoEvent, CoordinationSignal } from '../types';
import { WaveCanvas } from './WaveCanvas';

mapboxgl.accessToken = 'pk.eyJ1IjoibWFrZW5kcmFoZmN3aW5uZXIiLCJhIjoiY21sYXJ5aWRqMGd0aTNocTRqZDhwdDYzMSJ9.Do6QbiYADp5KgQVH5CMD1A';

interface MapProps {
  sites: SitesGeoJSON | null;
  selectedSiteId: string | null;
  onSiteSelect: (site: Site | null) => void;
  demoEvent?: DemoEvent | null;
  signals?: CoordinationSignal[];
}

// Extract the outer ring from any geometry type (Polygon or MultiPolygon)
function getOuterRing(geometry: { type: string; coordinates: any }): number[][] | null {
  if (!geometry?.coordinates) return null;
  if (geometry.type === 'Polygon') {
    return geometry.coordinates[0] as number[][];
  }
  if (geometry.type === 'MultiPolygon') {
    // Use the first polygon's outer ring
    return geometry.coordinates[0]?.[0] as number[][] ?? null;
  }
  return null;
}

function getCentroidFromRing(ring: number[][]): [number, number] | null {
  if (!ring || ring.length === 0) return null;
  let sumLng = 0, sumLat = 0, count = 0;
  for (const c of ring) {
    if (c.length >= 2 && typeof c[0] === 'number' && typeof c[1] === 'number') {
      sumLng += c[0];
      sumLat += c[1];
      count++;
    }
  }
  return count > 0 ? [sumLng / count, sumLat / count] : null;
}

export function Map({ sites, selectedSiteId, onSiteSelect, demoEvent, signals = [] }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [sitePositions, setSitePositions] = useState<globalThis.Map<string, { x: number; y: number }>>(new globalThis.Map());
  const initialBoundsSet = useRef(false);
  const preDemoView = useRef<{ center: [number, number]; zoom: number } | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [103.8198, 1.3521],
      zoom: 11,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setLoaded(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Fly to demo area on demo start, zoom back out on complete
  useEffect(() => {
    if (!map.current || !demoEvent) return;

    if (demoEvent.phase === 'spike') {
      // Save current view so we can return to it after demo
      const center = map.current.getCenter();
      preDemoView.current = {
        center: [center.lng, center.lat],
        zoom: map.current.getZoom(),
      };
      // Zoom into demo cluster dynamically
      const flyTarget = demoEvent.cluster_center || [103.8454, 1.3691];
      map.current.flyTo({
        center: flyTarget as [number, number],
        zoom: 15,
        duration: 2000,
      });
    }

    if (demoEvent.phase === 'complete' && preDemoView.current) {
      // Return to the view before the demo started
      map.current.flyTo({
        center: preDemoView.current.center,
        zoom: preDemoView.current.zoom,
        duration: 2000,
      });
      preDemoView.current = null;
    }
  }, [demoEvent]);

  // Update site positions for wave canvas
  useEffect(() => {
    if (!map.current || !loaded || !sites) return;

    const updatePositions = () => {
      const newPositions = new globalThis.Map<string, { x: number; y: number }>();
      sites.features.forEach(feature => {
        const ring = getOuterRing(feature.geometry);
        const centroid = ring ? getCentroidFromRing(ring) : null;
        if (centroid && map.current) {
          const point = map.current.project(centroid);
          newPositions.set(feature.properties.id, { x: point.x, y: point.y });
        }
      });
      setSitePositions(newPositions);
    };

    updatePositions();
    map.current.on('move', updatePositions);
    map.current.on('zoom', updatePositions);

    return () => {
      map.current?.off('move', updatePositions);
      map.current?.off('zoom', updatePositions);
    };
  }, [loaded, sites]);

  // Add/update sites layer
  useEffect(() => {
    if (!map.current || !loaded || !sites) return;

    const LAYERS_TO_REMOVE = [
      'site-circles', 'site-glow-mid', 'site-glow-outer',
      'sites-selected', 'sites-outline', 'sites-fill', 'sites-heatmap',
      'sites-glow',
    ];
    const SOURCES_TO_REMOVE = ['construction-sites', 'site-centroids'];

    LAYERS_TO_REMOVE.forEach(id => {
      if (map.current!.getLayer(id)) map.current!.removeLayer(id);
    });
    SOURCES_TO_REMOVE.forEach(id => {
      if (map.current!.getSource(id)) map.current!.removeSource(id);
    });

    // Polygon source for actual site shapes
    map.current.addSource('construction-sites', {
      type: 'geojson',
      data: sites as unknown as GeoJSON.FeatureCollection,
    });

    // Centroid points for the glow aura behind each site
    const centroidFeatures = sites.features.map((feature) => {
      const ring = getOuterRing(feature.geometry);
      const centroid = ring ? getCentroidFromRing(ring) : null;
      if (centroid) {
        return {
          type: 'Feature' as const,
          properties: { ...feature.properties },
          geometry: { type: 'Point' as const, coordinates: centroid },
        };
      }
      return null;
    }).filter(Boolean);

    map.current.addSource('site-centroids', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: centroidFeatures } as GeoJSON.FeatureCollection,
    });

    // Layer 1: Soft glow aura behind each site (blurred circle at centroid)
    map.current.addLayer({
      id: 'sites-glow',
      type: 'circle',
      source: 'site-centroids',
      paint: {
        'circle-radius': [
          'interpolate', ['linear'], ['zoom'],
          10, ['case', ['==', ['get', 'state'], 'high_impact'], 18, ['==', ['get', 'state'], 'elevated'], 15, 12],
          13, ['case', ['==', ['get', 'state'], 'high_impact'], 40, ['==', ['get', 'state'], 'elevated'], 32, 25],
          16, ['case', ['==', ['get', 'state'], 'high_impact'], 70, ['==', ['get', 'state'], 'elevated'], 55, 40],
          18, ['case', ['==', ['get', 'state'], 'high_impact'], 90, ['==', ['get', 'state'], 'elevated'], 70, 50],
        ],
        'circle-color': [
          'match', ['get', 'state'],
          'normal', '#22c55e',
          'elevated', '#eab308',
          'high_impact', '#ef4444',
          '#22c55e',
        ],
        'circle-blur': 0.8,
        'circle-opacity': [
          'match', ['get', 'state'],
          'high_impact', 0.55,
          'elevated', 0.45,
          0.3,
        ],
      },
    });

    // Layer 2: Filled polygon shapes — each site distinctly visible
    map.current.addLayer({
      id: 'sites-fill',
      type: 'fill',
      source: 'construction-sites',
      paint: {
        'fill-color': [
          'match', ['get', 'state'],
          'normal', '#22c55e',
          'elevated', '#eab308',
          'high_impact', '#ef4444',
          '#22c55e',
        ],
        'fill-opacity': 0.75,
      },
    });

    // Layer 3: Bright outline for each site polygon
    map.current.addLayer({
      id: 'sites-outline',
      type: 'line',
      source: 'construction-sites',
      paint: {
        'line-color': [
          'match', ['get', 'state'],
          'normal', '#4ade80',
          'elevated', '#facc15',
          'high_impact', '#f87171',
          '#4ade80',
        ],
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          10, 1.5,
          14, 3,
          18, 4,
        ],
        'line-opacity': 0.9,
      },
    });

    // Layer 4: Selection highlight
    map.current.addLayer({
      id: 'sites-selected',
      type: 'line',
      source: 'construction-sites',
      paint: {
        'line-color': '#60a5fa',
        'line-width': 5,
        'line-opacity': [
          'case',
          ['==', ['get', 'id'], selectedSiteId || ''],
          1, 0,
        ],
      },
    });

    // Helper: compute centroid of a feature
    const getFeatureCentroid = (feature: any): [number, number] | null => {
      const ring = getOuterRing(feature.geometry);
      return ring ? getCentroidFromRing(ring) : null;
    };

    // Click on polygon — select + fly to it
    const handleSiteClick = (e: mapboxgl.MapLayerMouseEvent) => {
      if (!e.features || !e.features[0] || !map.current) return;
      const clickedId = e.features[0].properties?.id;
      const originalFeature = sites.features.find(f => f.properties.id === clickedId);
      if (!originalFeature) return;

      onSiteSelect(originalFeature as unknown as Site);

      const center = getFeatureCentroid(originalFeature);
      if (center) {
        map.current.flyTo({ center, zoom: 17, duration: 1200 });
      }
    };

    map.current.on('click', 'sites-fill', handleSiteClick);
    map.current.on('click', 'sites-glow', handleSiteClick);

    // Hover cursor
    map.current.on('mouseenter', 'sites-fill', () => { if (map.current) map.current.getCanvas().style.cursor = 'pointer'; });
    map.current.on('mouseleave', 'sites-fill', () => { if (map.current) map.current.getCanvas().style.cursor = ''; });
    map.current.on('mouseenter', 'sites-glow', () => { if (map.current) map.current.getCanvas().style.cursor = 'pointer'; });
    map.current.on('mouseleave', 'sites-glow', () => { if (map.current) map.current.getCanvas().style.cursor = ''; });

    // Auto-fit bounds only on first load
    if (!initialBoundsSet.current && sites.features.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      sites.features.forEach((feature) => {
        const ring = getOuterRing(feature.geometry);
        if (ring) {
          ring.forEach((coord: number[]) => {
            if (coord.length >= 2 && typeof coord[0] === 'number' && typeof coord[1] === 'number') {
              bounds.extend([coord[0], coord[1]]);
            }
          });
        }
      });
      if (!bounds.isEmpty()) {
        map.current.fitBounds(bounds, { padding: 50, maxZoom: 15 });
        initialBoundsSet.current = true;
      }
    }
  }, [loaded, sites]);

  // Update selected site highlight
  useEffect(() => {
    if (!map.current || !loaded) return;
    if (map.current.getLayer('sites-selected')) {
      map.current.setPaintProperty('sites-selected', 'line-opacity', [
        'case', ['==', ['get', 'id'], selectedSiteId || ''], 1, 0,
      ]);
    }
  }, [selectedSiteId, loaded]);

  // Demo cluster highlight — show a pulsing boundary around coordinated sites
  useEffect(() => {
    if (!map.current || !loaded || !sites) return;

    const demoIds = demoEvent?.demo_site_ids || [];
    const isActive = demoEvent && demoEvent.phase !== 'complete' && demoIds.length > 0;

    // Remove existing demo layers
    ['demo-cluster-boundary', 'demo-cluster-fill', 'demo-site-labels'].forEach(id => {
      if (map.current!.getLayer(id)) map.current!.removeLayer(id);
    });
    if (map.current.getSource('demo-cluster')) map.current.removeSource('demo-cluster');
    if (map.current.getSource('demo-labels')) map.current.removeSource('demo-labels');

    if (!isActive) return;

    // Compute centroids of demo sites
    const demoCentroids: { id: string; lng: number; lat: number }[] = [];
    demoIds.forEach((id) => {
      const feature = sites.features.find(f => f.properties.id === id);
      if (!feature) return;
      const ring = getOuterRing(feature.geometry);
      const centroid = ring ? getCentroidFromRing(ring) : null;
      if (centroid) {
        demoCentroids.push({ id, lng: centroid[0], lat: centroid[1] });
      }
    });

    if (demoCentroids.length < 2) return;

    // Create a convex-hull-like polygon around the demo sites (with padding)
    const centerLng = demoCentroids.reduce((s, c) => s + c.lng, 0) / demoCentroids.length;
    const centerLat = demoCentroids.reduce((s, c) => s + c.lat, 0) / demoCentroids.length;
    const padding = 0.003; // ~300m padding around cluster
    const points = demoCentroids.map(c => {
      const dx = c.lng - centerLng;
      const dy = c.lat - centerLat;
      const dist = Math.sqrt(dx * dx + dy * dy) + padding;
      const angle = Math.atan2(dy, dx);
      return [centerLng + dist * Math.cos(angle), centerLat + dist * Math.sin(angle)];
    });

    // Generate a smooth circle/ellipse around the cluster
    const maxDist = Math.max(...demoCentroids.map(c => {
      const dx = c.lng - centerLng;
      const dy = c.lat - centerLat;
      return Math.sqrt(dx * dx + dy * dy);
    })) + padding;

    const ellipsePoints: number[][] = [];
    for (let i = 0; i < 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      ellipsePoints.push([
        centerLng + maxDist * 1.3 * Math.cos(angle),
        centerLat + maxDist * 1.1 * Math.sin(angle),
      ]);
    }
    ellipsePoints.push(ellipsePoints[0]); // close the ring

    // Phase colors
    const phaseColor = demoEvent.phase === 'spike' ? '#ef4444'
      : demoEvent.phase === 'detect' ? '#eab308'
      : demoEvent.phase === 'verify' ? '#22c55e'
      : '#3b82f6';

    map.current.addSource('demo-cluster', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: { type: 'Polygon', coordinates: [ellipsePoints] },
      } as GeoJSON.Feature,
    });

    // Soft fill
    map.current.addLayer({
      id: 'demo-cluster-fill',
      type: 'fill',
      source: 'demo-cluster',
      paint: {
        'fill-color': phaseColor,
        'fill-opacity': 0.08,
      },
    }, 'sites-glow'); // insert below glow layer

    // Dashed boundary
    map.current.addLayer({
      id: 'demo-cluster-boundary',
      type: 'line',
      source: 'demo-cluster',
      paint: {
        'line-color': phaseColor,
        'line-width': 2,
        'line-dasharray': [4, 4],
        'line-opacity': 0.6,
      },
    });

    // Labels for demo sites (A, B, C)
    const labelFeatures = demoCentroids.map((c, i) => ({
      type: 'Feature' as const,
      properties: { label: String.fromCharCode(65 + i) },
      geometry: { type: 'Point' as const, coordinates: [c.lng, c.lat - 0.0008] },
    }));

    map.current.addSource('demo-labels', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: labelFeatures } as GeoJSON.FeatureCollection,
    });

    map.current.addLayer({
      id: 'demo-site-labels',
      type: 'symbol',
      source: 'demo-labels',
      layout: {
        'text-field': ['concat', 'Site ', ['get', 'label']],
        'text-size': 13,
        'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
        'text-anchor': 'top',
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': '#000000',
        'text-halo-width': 1.5,
      },
    });
  }, [demoEvent, loaded, sites]);

  // Pulse animation — glow breathes in and out
  useEffect(() => {
    if (!map.current || !loaded) return;
    let animFrame: number;
    const animate = () => {
      if (!map.current || !map.current.getLayer('sites-glow')) {
        animFrame = requestAnimationFrame(animate);
        return;
      }
      const t = (Math.sin(Date.now() / 800) + 1) / 2; // 0..1
      map.current.setPaintProperty('sites-glow', 'circle-opacity', [
        'match', ['get', 'state'],
        'high_impact', 0.35 + t * 0.3,
        'elevated', 0.25 + t * 0.25,
        0.15 + t * 0.15,
      ]);
      animFrame = requestAnimationFrame(animate);
    };
    animFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame);
  }, [loaded]);

  return (
    <div ref={mapContainer} className="w-full h-full relative">
      <WaveCanvas signals={signals} sitePositions={sitePositions} />
    </div>
  );
}
