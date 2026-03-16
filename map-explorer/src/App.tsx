/**
 * Map Explorer — Interactive specimen map.
 *
 * Uses MapLibre GL directly with CAS vector tiles to display specimens.
 * Demonstrates how to build a custom map view using the CAS tile server
 * and API client.
 */
import { useState, useRef, useCallback } from 'react';
import { Map, Source, Layer, NavigationControl, ScaleControl, Popup } from '@vis.gl/react-maplibre';
import type { MapRef, MapMouseEvent } from '@vis.gl/react-maplibre';
import type { MapGeoJSONFeature } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { CASLensProvider, configureApiClient } from '@calacademy-research/cas-lens';

configureApiClient({ baseURL: '/api' });

const TILE_URL = '/tiles/{collection}/{z}/{x}/{y}.pbf';
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

const COLLECTIONS = [
  { code: 'all', label: 'All Collections', color: '#003262' },
  { code: 'ich', label: 'Ichthyology', color: '#0077B6' },
  { code: 'herp', label: 'Herpetology', color: '#7B2CBF' },
  { code: 'orn', label: 'Ornithology', color: '#9B2226' },
  { code: 'mam', label: 'Mammalogy', color: '#774936' },
  { code: 'ent', label: 'Entomology', color: '#E9C46A' },
  { code: 'botany', label: 'Botany', color: '#2D6A4F' },
  { code: 'iz', label: 'Invertebrate Zoology', color: '#E76F51' },
];

// Collection → dot color mapping for the vector tiles
const COLLECTION_COLOR_EXPR: any = [
  'match', ['get', 'collection_code'],
  'ich', '#0077B6',
  'herp', '#7B2CBF',
  'orn', '#9B2226',
  'mam', '#774936',
  'ent', '#E9C46A',
  'botany', '#2D6A4F',
  'iz', '#E76F51',
  'geo', '#6C757D',
  'anthro', '#264653',
  '#003262', // default
];

interface PopupInfo {
  lng: number;
  lat: number;
  name: string;
  collection: string;
  catalogNumber: string;
}

export default function App() {
  const [collection, setCollection] = useState('all');
  const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null);
  const mapRef = useRef<MapRef | null>(null);

  // Build the tile URL for the selected collection
  const tileSource = collection === 'all' ? 'all' : collection;
  const tilesUrl = TILE_URL.replace('{collection}', tileSource);

  const handleClick = useCallback((e: MapMouseEvent & { features?: MapGeoJSONFeature[] }) => {
    const feature = e.features?.[0];
    if (!feature) {
      setPopupInfo(null);
      return;
    }

    const props = feature.properties;
    // Check if it's a cluster
    if (props.cluster || props.count > 1) {
      // Zoom in on cluster click
      mapRef.current?.flyTo({ center: [e.lngLat.lng, e.lngLat.lat], zoom: (mapRef.current.getZoom() || 4) + 2 });
      return;
    }

    setPopupInfo({
      lng: e.lngLat.lng,
      lat: e.lngLat.lat,
      name: props.scientific_name || props.name || 'Unknown',
      collection: props.collection_code || '',
      catalogNumber: props.catalog_number || '',
    });
  }, []);

  return (
    <CASLensProvider apiBase="/api">
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        {/* Header */}
        <header style={{
          padding: '10px 20px',
          background: '#003262',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
            CAS Map Explorer
          </h1>

          {/* Collection picker */}
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {COLLECTIONS.map((c) => (
              <button
                key={c.code}
                onClick={() => setCollection(c.code)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  border: collection === c.code ? '2px solid white' : '1px solid rgba(255,255,255,0.3)',
                  background: collection === c.code ? c.color : 'transparent',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: collection === c.code ? 600 : 400,
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </header>

        {/* Map */}
        <div style={{ flex: 1 }}>
          <Map
            ref={mapRef}
            initialViewState={{ longitude: 0, latitude: 20, zoom: 2 }}
            style={{ width: '100%', height: '100%' }}
            mapStyle={MAP_STYLE}
            interactiveLayerIds={['specimen-clusters', 'specimen-points']}
            onClick={handleClick}
            cursor="pointer"
          >
            <NavigationControl position="top-right" />
            <ScaleControl position="bottom-left" />

            <Source
              key={`specimens-${collection}`}
              id={`specimens-${collection}`}
              type="vector"
              tiles={[`${window.location.origin}${tilesUrl}`]}
              minzoom={0}
              maxzoom={14}
            >
              {/* Cluster circles */}
              <Layer
                id="specimen-clusters"
                type="circle"
                source-layer="specimens"
                filter={['has', 'count']}
                paint={{
                  'circle-color': collection === 'all' ? '#003262' : (COLLECTIONS.find(c => c.code === collection)?.color || '#003262'),
                  'circle-radius': ['interpolate', ['linear'], ['get', 'count'], 1, 4, 100, 12, 10000, 20],
                  'circle-opacity': 0.8,
                  'circle-stroke-width': 1,
                  'circle-stroke-color': 'white',
                }}
              />

              {/* Cluster count labels */}
              <Layer
                id="specimen-cluster-count"
                type="symbol"
                source-layer="specimens"
                filter={['>', ['get', 'count'], 10]}
                layout={{
                  'text-field': ['to-string', ['get', 'count']],
                  'text-size': 11,
                }}
                paint={{
                  'text-color': 'white',
                }}
              />

              {/* Individual specimen points */}
              <Layer
                id="specimen-points"
                type="circle"
                source-layer="specimens"
                filter={['!', ['has', 'count']]}
                paint={{
                  'circle-color': collection === 'all' ? COLLECTION_COLOR_EXPR : (COLLECTIONS.find(c => c.code === collection)?.color || '#003262'),
                  'circle-radius': 4,
                  'circle-stroke-width': 1,
                  'circle-stroke-color': 'white',
                }}
              />
            </Source>

            {popupInfo && (
              <Popup
                longitude={popupInfo.lng}
                latitude={popupInfo.lat}
                closeButton={true}
                onClose={() => setPopupInfo(null)}
              >
                <div style={{ fontSize: '13px' }}>
                  <strong>{popupInfo.name}</strong>
                  <br />
                  <span style={{ color: '#666' }}>{popupInfo.collection.toUpperCase()} {popupInfo.catalogNumber}</span>
                </div>
              </Popup>
            )}
          </Map>
        </div>
      </div>
    </CASLensProvider>
  );
}
