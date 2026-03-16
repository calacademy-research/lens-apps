/**
 * Specimen Viewer — Detail page for individual specimens.
 *
 * Uses getApiClient() to fetch specimen data directly and renders
 * with inline styles. Does not depend on Tailwind CSS.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CASLensProvider, getApiClient } from '@calacademy-research/cas-lens';

const API_BASE = '/api';

interface MediaItem {
  url: string;
  type: string;
  label?: string;
}

interface Specimen {
  id: string;
  catalog_number: string;
  collection_code: string;
  scientific_name: string | null;
  accepted_name: string | null;
  taxon_class: string | null;
  taxon_order: string | null;
  taxon_family: string | null;
  taxon_genus: string | null;
  taxon_species: string | null;
  type_status: string | null;
  locality: string | null;
  country: string | null;
  state_province: string | null;
  latitude: number | null;
  longitude: number | null;
  verbatim_collector: string | null;
  year_collected: number | null;
  determined_by: string | null;
  media: MediaItem[];
  common_name?: string | null;
  iucn_category?: string | null;
}

// Specimen UUIDs
const EXAMPLES = [
  { collection: 'ich', id: '367565b1-257d-11ed-aace-005056be1b7a', label: 'Coelacanth' },
  { collection: 'ich', id: '348b88d1-257d-11ed-aace-005056be1b7a', label: 'Shark' },
  { collection: 'herp', id: '38b73cc3-257d-11ed-aace-005056be1b7a', label: 'HERP' },
  { collection: 'botany', id: '3d38f1e9-257d-11ed-aace-005056be1b7a', label: 'BOT' },
];

function SpecimenDetail({ specimenId }: { specimenId: string }) {
  const { data: specimen, isLoading, error } = useQuery<Specimen>({
    queryKey: ['specimen', specimenId],
    queryFn: async () => {
      const client = getApiClient();
      const res = await client.get(`/specimens/${specimenId}`);
      return res.data;
    },
    enabled: !!specimenId,
  });

  if (isLoading) return <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Loading specimen...</div>;
  if (error) return <div style={{ padding: '40px', textAlign: 'center', color: '#c00' }}>Failed to load: {(error as Error).message}</div>;
  if (!specimen) return <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Specimen not found</div>;

  const images = specimen.media?.filter(m => m.type === 'image') || [];
  const labelStyle = { fontWeight: 600, color: '#003262', fontSize: '13px', minWidth: '140px', display: 'inline-block' } as const;
  const valueStyle = { fontSize: '14px', color: '#333' } as const;
  const rowStyle = { padding: '6px 0', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: '8px' } as const;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', color: '#999', marginBottom: '4px' }}>
          {specimen.collection_code?.toUpperCase()} &middot; {specimen.catalog_number}
        </div>
        <h2 style={{ margin: '0 0 4px', color: '#003262', fontSize: '24px' }}>
          <em>{specimen.scientific_name || 'Unknown'}</em>
        </h2>
        {specimen.common_name && (
          <div style={{ fontSize: '15px', color: '#666' }}>{specimen.common_name}</div>
        )}
        {specimen.type_status && (
          <span style={{ display: 'inline-block', marginTop: '6px', background: '#fef3c7', padding: '2px 10px', borderRadius: '4px', fontSize: '13px', fontWeight: 600 }}>
            {specimen.type_status}
          </span>
        )}
        {specimen.iucn_category && (
          <span style={{ display: 'inline-block', marginTop: '6px', marginLeft: '8px', background: '#fee2e2', padding: '2px 10px', borderRadius: '4px', fontSize: '13px', fontWeight: 600, color: '#991b1b' }}>
            IUCN: {specimen.iucn_category}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {/* Left: details */}
        <div style={{ flex: '1 1 400px' }}>
          <h3 style={{ color: '#003262', borderBottom: '2px solid #003262', paddingBottom: '6px', fontSize: '16px' }}>Taxonomy</h3>
          <div style={rowStyle}><span style={labelStyle}>Scientific Name</span><span style={{ ...valueStyle, fontStyle: 'italic' }}>{specimen.scientific_name || '—'}</span></div>
          {specimen.accepted_name && specimen.accepted_name !== specimen.scientific_name && (
            <div style={rowStyle}><span style={labelStyle}>Accepted Name</span><span style={{ ...valueStyle, fontStyle: 'italic' }}>{specimen.accepted_name}</span></div>
          )}
          <div style={rowStyle}><span style={labelStyle}>Class</span><span style={valueStyle}>{specimen.taxon_class || '—'}</span></div>
          <div style={rowStyle}><span style={labelStyle}>Order</span><span style={valueStyle}>{specimen.taxon_order || '—'}</span></div>
          <div style={rowStyle}><span style={labelStyle}>Family</span><span style={valueStyle}>{specimen.taxon_family || '—'}</span></div>

          <h3 style={{ color: '#003262', borderBottom: '2px solid #003262', paddingBottom: '6px', fontSize: '16px', marginTop: '24px' }}>Collection</h3>
          <div style={rowStyle}><span style={labelStyle}>Catalog Number</span><span style={valueStyle}>{specimen.catalog_number}</span></div>
          <div style={rowStyle}><span style={labelStyle}>Collection</span><span style={valueStyle}>{specimen.collection_code?.toUpperCase()}</span></div>
          {specimen.verbatim_collector && <div style={rowStyle}><span style={labelStyle}>Collector</span><span style={valueStyle}>{specimen.verbatim_collector}</span></div>}
          {specimen.year_collected && <div style={rowStyle}><span style={labelStyle}>Year Collected</span><span style={valueStyle}>{specimen.year_collected}</span></div>}
          {specimen.determined_by && <div style={rowStyle}><span style={labelStyle}>Determined By</span><span style={valueStyle}>{specimen.determined_by}</span></div>}

          <h3 style={{ color: '#003262', borderBottom: '2px solid #003262', paddingBottom: '6px', fontSize: '16px', marginTop: '24px' }}>Locality</h3>
          <div style={rowStyle}><span style={labelStyle}>Locality</span><span style={valueStyle}>{specimen.locality || '—'}</span></div>
          <div style={rowStyle}><span style={labelStyle}>Country</span><span style={valueStyle}>{specimen.country || '—'}</span></div>
          {specimen.state_province && <div style={rowStyle}><span style={labelStyle}>State/Province</span><span style={valueStyle}>{specimen.state_province}</span></div>}
          {specimen.latitude != null && (
            <div style={rowStyle}><span style={labelStyle}>Coordinates</span><span style={valueStyle}>{specimen.latitude.toFixed(4)}, {specimen.longitude?.toFixed(4)}</span></div>
          )}
        </div>

        {/* Right: images */}
        <div style={{ flex: '0 0 300px' }}>
          {images.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {images.slice(0, 4).map((img, i) => (
                <div key={i} style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #e0e0e0' }}>
                  <img
                    src={img.url}
                    alt={img.label || specimen.scientific_name || 'Specimen'}
                    style={{ width: '100%', display: 'block' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  {img.label && <div style={{ padding: '6px 10px', fontSize: '12px', color: '#666', background: '#f8f9fa' }}>{img.label}</div>}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#ccc', border: '2px dashed #e0e0e0', borderRadius: '8px' }}>
              No images available
            </div>
          )}
        </div>
      </div>

      {/* Link to full detail on CAS Lens */}
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <a
          href={`https://collections.calacademy.org/${specimen.collection_code}/specimen/${specimen.id}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#003262', fontSize: '14px' }}
        >
          View full detail on CAS Lens &rarr;
        </a>
      </div>
    </div>
  );
}

export default function App() {
  const [collection, setCollection] = useState('ich');
  const [specimenId, setSpecimenId] = useState('367565b1-257d-11ed-aace-005056be1b7a');
  const [viewing, setViewing] = useState('367565b1-257d-11ed-aace-005056be1b7a');

  const handleView = (e: React.FormEvent) => {
    e.preventDefault();
    setViewing(specimenId);
  };

  return (
    <CASLensProvider apiBase={API_BASE}>
      <div style={{ fontFamily: 'system-ui' }}>
        <header style={{
          padding: '10px 20px', background: '#003262', color: 'white',
          display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
        }}>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 600, marginRight: '8px' }}>Specimen Viewer</h1>

          <form onSubmit={handleView} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <select value={collection} onChange={(e) => setCollection(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', fontSize: '13px' }}>
              <option value="ich">Ichthyology</option>
              <option value="herp">Herpetology</option>
              <option value="orn">Ornithology</option>
              <option value="botany">Botany</option>
              <option value="ent">Entomology</option>
              <option value="iz">Invertebrate Zoology</option>
            </select>
            <input type="text" value={specimenId} onChange={(e) => setSpecimenId(e.target.value)}
              placeholder="Specimen UUID" style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', width: '280px', fontSize: '13px' }} />
            <button type="submit" style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontSize: '13px' }}>
              View
            </button>
          </form>

          <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
            {EXAMPLES.map((ex) => (
              <button key={ex.id} onClick={() => { setCollection(ex.collection); setSpecimenId(ex.id); setViewing(ex.id); }}
                style={{
                  padding: '3px 8px', borderRadius: '4px', fontSize: '11px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: viewing === ex.id ? 'rgba(255,255,255,0.2)' : 'transparent',
                  color: 'white', cursor: 'pointer',
                }}>
                {ex.label}
              </button>
            ))}
          </div>
        </header>

        <SpecimenDetail key={viewing} specimenId={viewing} />
      </div>
    </CASLensProvider>
  );
}
