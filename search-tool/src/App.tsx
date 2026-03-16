/**
 * Search Tool — Specimen search with faceted results.
 *
 * Demonstrates the <SpecimenSearch> standalone component with
 * collection filtering and pagination. Shows how to build a
 * searchable specimen database interface in ~80 lines.
 */
import { useState } from 'react';
import { CASLensProvider, SpecimenSearch } from '@calacademy-research/cas-lens';
import '@calacademy-research/cas-lens/styles';

const API_BASE = 'https://collections.calacademy.org/api';

export default function App() {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [collection, setCollection] = useState<string | null>(null);
  const [hasImages, setHasImages] = useState(false);
  const [page, setPage] = useState(1);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedQuery(query);
    setPage(1);
  };

  return (
    <CASLensProvider apiBase={API_BASE}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui' }}>
        <h1 style={{ color: '#003262', marginBottom: '4px' }}>CAS Specimen Search</h1>
        <p style={{ color: '#666', marginTop: 0 }}>
          Search across 1.4 million specimens from the California Academy of Sciences
        </p>

        {/* Search form */}
        <form onSubmit={handleSearch} style={{
          display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap',
        }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Scientific name, locality, collector..."
            style={{
              padding: '8px 14px', borderRadius: '6px', border: '1px solid #ccc',
              flex: 1, minWidth: '250px', fontSize: '15px',
            }}
          />

          <select
            value={collection ?? ''}
            onChange={(e) => { setCollection(e.target.value || null); setPage(1); }}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc' }}
          >
            <option value="">All Collections</option>
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

          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px' }}>
            <input
              type="checkbox"
              checked={hasImages}
              onChange={(e) => { setHasImages(e.target.checked); setPage(1); }}
            />
            Has images
          </label>

          <button type="submit" style={{
            padding: '8px 24px', borderRadius: '6px', border: 'none',
            background: '#003262', color: 'white', cursor: 'pointer', fontSize: '15px',
          }}>
            Search
          </button>
        </form>

        {/* Results */}
        {submittedQuery ? (
          <SpecimenSearch
            query={submittedQuery}
            collection={collection}
            hasImages={hasImages}
            page={page}
            perPage={25}
            onPageChange={setPage}
          />
        ) : (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#999' }}>
            Enter a search term to find specimens.
            Try "Iris", "Galapagos", or "Holotype".
          </div>
        )}
      </div>
    </CASLensProvider>
  );
}
