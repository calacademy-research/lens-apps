/**
 * Search Tool — Specimen search with results table.
 *
 * Uses getApiClient() to call the search API directly and renders
 * results in an inline-styled table. Does not depend on Tailwind CSS.
 */
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CASLensProvider, getApiClient } from '@calacademy-research/cas-lens';

interface Specimen {
  id: string;
  catalog_number: string;
  collection_code: string;
  scientific_name: string | null;
  accepted_name: string | null;
  taxon_family: string | null;
  locality: string | null;
  country: string | null;
  year_collected: number | null;
  type_status: string | null;
}

interface SearchResponse {
  results: Specimen[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

function SearchInner() {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [collection, setCollection] = useState<string | null>(null);
  const [hasImages, setHasImages] = useState(false);
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const perPage = 25;

  const sortBy = sortField ? `${sortField}:${sortOrder}` : undefined;

  const { data, isLoading, error } = useQuery<SearchResponse>({
    queryKey: ['search', submittedQuery, collection, hasImages, page, sortBy],
    queryFn: async () => {
      const client = getApiClient();
      const params: Record<string, any> = {
        q: submittedQuery,
        page,
        per_page: perPage,
      };
      if (collection) params.collection = collection;
      if (hasImages) params.has_images = true;
      if (sortBy) params.sort_by = sortBy;
      const res = await client.get('/search', { params });
      return res.data;
    },
    enabled: submittedQuery.length > 0,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedQuery(query);
    setPage(1);
  };

  const handleSort = useCallback((field: string) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setPage(1);
  }, [sortField]);

  const totalPages = data ? Math.ceil(data.total / perPage) : 0;

  const thStyle = {
    padding: '8px 12px', textAlign: 'left' as const, borderBottom: '2px solid #e0e0e0',
    fontSize: '13px', fontWeight: 600, color: '#003262', cursor: 'pointer',
    whiteSpace: 'nowrap' as const, background: '#f8f9fa',
  };
  const tdStyle = {
    padding: '6px 12px', borderBottom: '1px solid #eee', fontSize: '13px', verticalAlign: 'top' as const,
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui' }}>
      <h1 style={{ color: '#003262', marginBottom: '4px' }}>CAS Specimen Search</h1>
      <p style={{ color: '#666', marginTop: 0 }}>
        Search across 1.4 million specimens from the California Academy of Sciences
      </p>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Scientific name, locality, collector..."
          style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #ccc', flex: 1, minWidth: '250px', fontSize: '15px' }}
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
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px' }}>
          <input type="checkbox" checked={hasImages} onChange={(e) => { setHasImages(e.target.checked); setPage(1); }} />
          Has images
        </label>
        <button type="submit" style={{
          padding: '8px 24px', borderRadius: '6px', border: 'none',
          background: '#003262', color: 'white', cursor: 'pointer', fontSize: '15px',
        }}>
          Search
        </button>
      </form>

      {isLoading && <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Searching...</div>}
      {error && <div style={{ padding: '40px', textAlign: 'center', color: '#c00' }}>Search failed: {(error as Error).message}</div>}

      {data && (
        <>
          <p style={{ color: '#666', margin: '0 0 12px', fontSize: '14px' }}>
            {data.total.toLocaleString()} specimen{data.total !== 1 ? 's' : ''} found
            {totalPages > 1 && ` — page ${page} of ${totalPages}`}
          </p>

          {data.results.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle} onClick={() => handleSort('catalog_number')}>
                      Catalog # {sortField === 'catalog_number' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th style={thStyle}>Collection</th>
                    <th style={thStyle} onClick={() => handleSort('scientific_name')}>
                      Scientific Name {sortField === 'scientific_name' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th style={thStyle}>Family</th>
                    <th style={thStyle}>Locality</th>
                    <th style={thStyle}>Country</th>
                    <th style={thStyle} onClick={() => handleSort('year_collected')}>
                      Year {sortField === 'year_collected' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th style={thStyle}>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {data.results.map((s) => (
                    <tr key={s.id} style={{ cursor: 'pointer' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f4ff')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                    >
                      <td style={tdStyle}>
                        <a href={`https://collections.calacademy.org/${s.collection_code}/specimen/${s.id}`}
                          target="_blank" rel="noopener noreferrer"
                          style={{ color: '#003262', textDecoration: 'none', fontWeight: 500 }}>
                          {s.catalog_number}
                        </a>
                      </td>
                      <td style={tdStyle}>{s.collection_code?.toUpperCase()}</td>
                      <td style={{ ...tdStyle, fontStyle: 'italic' }}>{s.scientific_name || '—'}</td>
                      <td style={tdStyle}>{s.taxon_family || '—'}</td>
                      <td style={tdStyle}>{s.locality || '—'}</td>
                      <td style={tdStyle}>{s.country || '—'}</td>
                      <td style={tdStyle}>{s.year_collected || '—'}</td>
                      <td style={tdStyle}>
                        {s.type_status && <span style={{ background: '#fef3c7', padding: '1px 6px', borderRadius: '4px', fontSize: '11px' }}>{s.type_status}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data.results.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
              No specimens found for "{submittedQuery}"
            </div>
          )}

          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '16px' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #ccc', cursor: page === 1 ? 'default' : 'pointer' }}>
                Previous
              </button>
              <span style={{ padding: '6px 12px', color: '#666' }}>{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #ccc', cursor: page === totalPages ? 'default' : 'pointer' }}>
                Next
              </button>
            </div>
          )}
        </>
      )}

      {!submittedQuery && (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: '#999' }}>
          Enter a search term to find specimens. Try "Iris", "Galapagos", or "Holotype".
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <CASLensProvider apiBase="/api">
      <SearchInner />
    </CASLensProvider>
  );
}
