/**
 * Specimen Viewer — Detail page for individual specimens.
 *
 * Demonstrates the <SpecimenDetailView> standalone component.
 * Shows how to embed a full specimen detail page (with map, images,
 * taxonomy, collector links, and editorial content) in any React app.
 *
 * The viewer includes a simple lookup form so you can enter any
 * specimen ID and view it.
 */
import { useState } from 'react';
import { CASLensProvider, SpecimenDetailView } from '@calacademy-research/cas-lens';
import 'leaflet/dist/leaflet.css';

const API_BASE = '/api';

// Specimen UUIDs — the API uses UUIDs, not catalog numbers
const EXAMPLES = [
  { collection: 'ich', id: '367565b1-257d-11ed-aace-005056be1b7a', label: 'Coelacanth (ICH 210288)' },
  { collection: 'ich', id: '348b88d1-257d-11ed-aace-005056be1b7a', label: 'Shark (ICH 53961)' },
  { collection: 'herp', id: '38b73cc3-257d-11ed-aace-005056be1b7a', label: 'HERP 100030' },
  { collection: 'botany', id: '3d38f1e9-257d-11ed-aace-005056be1b7a', label: 'BOT 100010' },
];

export default function App() {
  const [collection, setCollection] = useState('ich');
  const [specimenId, setSpecimenId] = useState('367565b1-257d-11ed-aace-005056be1b7a');
  const [viewing, setViewing] = useState({ collection: 'ich', id: '367565b1-257d-11ed-aace-005056be1b7a' });

  const handleView = (e: React.FormEvent) => {
    e.preventDefault();
    setViewing({ collection, id: specimenId });
  };

  return (
    <CASLensProvider apiBase={API_BASE}>
      <div style={{ fontFamily: 'system-ui' }}>
        {/* Header with lookup form */}
        <header style={{
          padding: '12px 20px',
          background: '#003262',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 600, marginRight: '8px' }}>
            Specimen Viewer
          </h1>

          <form onSubmit={handleView} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              value={collection}
              onChange={(e) => setCollection(e.target.value)}
              style={{ padding: '5px 8px', borderRadius: '4px', border: 'none' }}
            >
              <option value="ich">Ichthyology</option>
              <option value="herp">Herpetology</option>
              <option value="orn">Ornithology</option>
              <option value="mam">Mammalogy</option>
              <option value="ent">Entomology</option>
              <option value="botany">Botany</option>
              <option value="iz">Invertebrate Zoology</option>
              <option value="geo">Geology</option>
              <option value="anthro">Anthropology</option>
            </select>

            <input
              type="text"
              value={specimenId}
              onChange={(e) => setSpecimenId(e.target.value)}
              placeholder="Specimen ID"
              style={{
                padding: '5px 10px', borderRadius: '4px', border: 'none',
                width: '120px',
              }}
            />

            <button type="submit" style={{
              padding: '5px 14px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.3)',
              background: 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer',
            }}>
              View
            </button>
          </form>

          {/* Quick examples */}
          <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
            {EXAMPLES.map((ex) => (
              <button
                key={`${ex.collection}-${ex.id}`}
                onClick={() => {
                  setCollection(ex.collection);
                  setSpecimenId(ex.id);
                  setViewing({ collection: ex.collection, id: ex.id });
                }}
                style={{
                  padding: '4px 10px', borderRadius: '4px', fontSize: '12px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: viewing.collection === ex.collection && viewing.id === ex.id
                    ? 'rgba(255,255,255,0.2)' : 'transparent',
                  color: 'white', cursor: 'pointer',
                }}
              >
                {ex.label}
              </button>
            ))}
          </div>
        </header>

        {/* Specimen detail */}
        <SpecimenDetailView
          key={`${viewing.collection}-${viewing.id}`}
          collection={viewing.collection}
          specimenId={viewing.id}
        />
      </div>
    </CASLensProvider>
  );
}
