/**
 * Map Explorer — Interactive specimen map.
 *
 * Demonstrates the <SpecimenMap> standalone component with collection
 * filtering and taxon search. Shows how to embed a CAS specimen map
 * in any React app with a few lines of code.
 */
import { useState } from 'react';
import { CASLensProvider, SpecimenMap } from '@calacademy-research/cas-lens';
import '@calacademy-research/cas-lens/styles';

const API_BASE = 'https://collections.calacademy.org/api';

const COLLECTIONS = [
  { code: null, label: 'All Collections' },
  { code: 'ich', label: 'Ichthyology' },
  { code: 'herp', label: 'Herpetology' },
  { code: 'orn', label: 'Ornithology' },
  { code: 'mam', label: 'Mammalogy' },
  { code: 'ent', label: 'Entomology' },
  { code: 'botany', label: 'Botany' },
  { code: 'iz', label: 'Invertebrate Zoology' },
] as const;

export default function App() {
  const [collection, setCollection] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedQuery(query);
  };

  return (
    <CASLensProvider apiBase={API_BASE}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        {/* Header */}
        <header style={{
          padding: '12px 20px',
          background: '#003262',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
            CAS Map Explorer
          </h1>

          {/* Search */}
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search specimens (e.g., Iris, shark, Galapagos)"
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: 'none',
                width: '320px',
                fontSize: '14px',
              }}
            />
            <button
              type="submit"
              style={{
                padding: '6px 16px',
                borderRadius: '4px',
                border: '1px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Search
            </button>
          </form>

          {/* Collection picker */}
          <select
            value={collection ?? ''}
            onChange={(e) => setCollection(e.target.value || null)}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: 'none',
              fontSize: '14px',
            }}
          >
            {COLLECTIONS.map((c) => (
              <option key={c.code ?? 'all'} value={c.code ?? ''}>
                {c.label}
              </option>
            ))}
          </select>
        </header>

        {/* Map */}
        <SpecimenMap
          query={submittedQuery || undefined}
          collection={collection}
          height="calc(100vh - 52px)"
        />
      </div>
    </CASLensProvider>
  );
}
