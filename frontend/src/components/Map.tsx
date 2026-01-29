import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Site, SitesGeoJSON, SiteState } from '../types';

mapboxgl.accessToken = 'pk.eyJ1IjoibWFraWxvdmVyMzAwMCIsImEiOiJjbWt6aDBuZW4wMXUyM2ZwcnJ4OHdqdmU2In0.mS-NOlVsWu2lo78BNpnVkw';

const STATE_COLORS: Record<SiteState, string> = {
  normal: '#22c55e',
  elevated: '#eab308',
  high_impact: '#ef4444',
};

interface MapProps {
  sites: SitesGeoJSON | null;
  selectedSiteId: string | null;
  onSiteSelect: (site: Site | null) => void;
}

export function Map({ sites, selectedSiteId, onSiteSelect }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [103.8198, 1.3521], // Singapore center
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

  // Add/update sites layer
  useEffect(() => {
    if (!map.current || !loaded || !sites) {
      console.log('Map not ready:', { map: !!map.current, loaded, sites: !!sites });
      return;
    }

    console.log('Adding sites to map:', sites.features.length, 'features');

    const sourceId = 'construction-sites';
    const layerId = 'sites-fill';
    const outlineLayerId = 'sites-outline';
    const selectedLayerId = 'sites-selected';

    // Remove existing layers and source if they exist
    if (map.current.getLayer('site-circles')) map.current.removeLayer('site-circles');
    if (map.current.getSource('site-centroids')) map.current.removeSource('site-centroids');
    if (map.current.getLayer(selectedLayerId)) map.current.removeLayer(selectedLayerId);
    if (map.current.getLayer(outlineLayerId)) map.current.removeLayer(outlineLayerId);
    if (map.current.getLayer(layerId)) map.current.removeLayer(layerId);
    if (map.current.getSource(sourceId)) map.current.removeSource(sourceId);

    // Add source
    map.current.addSource(sourceId, {
      type: 'geojson',
      data: sites as unknown as GeoJSON.FeatureCollection,
    });

    // Fill layer with color based on state
    map.current.addLayer({
      id: layerId,
      type: 'fill',
      source: sourceId,
      paint: {
        'fill-color': [
          'match',
          ['get', 'state'],
          'normal', '#22c55e',      // Green
          'elevated', '#eab308',    // Yellow
          'high_impact', '#ef4444', // Red
          '#22c55e',
        ],
        'fill-opacity': 0.7,
      },
    });

    // Outline layer
    map.current.addLayer({
      id: outlineLayerId,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': '#ffffff',
        'line-width': 2,
      },
    });

    // Selected site highlight - thick blue border
    map.current.addLayer({
      id: selectedLayerId,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': '#3b82f6',
        'line-width': 6,
        'line-opacity': [
          'case',
          ['==', ['get', 'id'], selectedSiteId || ''],
          1,
          0,
        ],
      },
    });

    // Add circle markers at centroids for easier clicking
    const centroidFeatures = sites.features.map((feature) => {
      const coords = feature.geometry?.coordinates;
      if (coords && coords[0] && coords[0].length > 0) {
        // Calculate centroid
        let sumLng = 0, sumLat = 0, count = 0;
        coords[0].forEach((c: number[]) => {
          if (c.length >= 2) {
            sumLng += c[0];
            sumLat += c[1];
            count++;
          }
        });
        if (count > 0) {
          return {
            type: 'Feature' as const,
            properties: feature.properties,
            geometry: {
              type: 'Point' as const,
              coordinates: [sumLng / count, sumLat / count],
            },
          };
        }
      }
      return null;
    }).filter(Boolean);

    // Add centroid source
    map.current.addSource('site-centroids', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: centroidFeatures,
      } as GeoJSON.FeatureCollection,
    });

    // Circle markers for easier clicking
    map.current.addLayer({
      id: 'site-circles',
      type: 'circle',
      source: 'site-centroids',
      paint: {
        'circle-radius': 12,
        'circle-color': [
          'match',
          ['get', 'state'],
          'normal', '#22c55e',
          'elevated', '#eab308',
          'high_impact', '#ef4444',
          '#22c55e',
        ],
        'circle-stroke-width': 3,
        'circle-stroke-color': [
          'case',
          ['==', ['get', 'id'], selectedSiteId || ''],
          '#3b82f6',
          '#ffffff',
        ],
      },
    });

    // Click handler for polygons
    map.current.on('click', layerId, (e) => {
      console.log('Site clicked:', e.features);
      if (e.features && e.features[0]) {
        const feature = e.features[0] as unknown as Site;
        onSiteSelect(feature);
      }
    });

    // Click handler for circle markers (easier to click)
    map.current.on('click', 'site-circles', (e) => {
      console.log('Circle clicked:', e.features);
      if (e.features && e.features[0]) {
        // Find the original feature with full geometry
        const clickedId = e.features[0].properties?.id;
        const originalFeature = sites.features.find(f => f.properties.id === clickedId);
        if (originalFeature) {
          onSiteSelect(originalFeature as unknown as Site);
        }
      }
    });

    // Hover effects for polygons
    map.current.on('mouseenter', layerId, () => {
      if (map.current) map.current.getCanvas().style.cursor = 'pointer';
    });

    map.current.on('mouseleave', layerId, () => {
      if (map.current) map.current.getCanvas().style.cursor = '';
    });

    // Hover effects for circles
    map.current.on('mouseenter', 'site-circles', () => {
      if (map.current) map.current.getCanvas().style.cursor = 'pointer';
    });

    map.current.on('mouseleave', 'site-circles', () => {
      if (map.current) map.current.getCanvas().style.cursor = '';
    });

    // Auto-fit bounds to show all sites
    if (sites.features.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      let validCoords = 0;

      sites.features.forEach((feature) => {
        const coords = feature.geometry?.coordinates;
        if (coords && coords[0]) {
          coords[0].forEach((coord: number[]) => {
            if (coord.length >= 2) {
              bounds.extend([coord[0], coord[1]]);
              validCoords++;
            }
          });
        }
      });

      console.log('Valid coordinates found:', validCoords);
      console.log('Bounds:', bounds.toString());

      if (!bounds.isEmpty()) {
        map.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 15,
        });
      }
    }

  }, [loaded, sites]);

  // Update selected site highlight
  useEffect(() => {
    if (!map.current || !loaded) return;

    const selectedLayerId = 'sites-selected';
    if (map.current.getLayer(selectedLayerId)) {
      map.current.setPaintProperty(selectedLayerId, 'line-opacity', [
        'case',
        ['==', ['get', 'id'], selectedSiteId || ''],
        1,
        0,
      ]);
    }
  }, [selectedSiteId, loaded]);

  return (
    <div ref={mapContainer} className="w-full h-full" />
  );
}
