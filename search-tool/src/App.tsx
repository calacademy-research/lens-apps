/**
 * Search Tool — Specimen search with local detail pages.
 *
 * DEMONSTRATES THE LINK BUILDER PATTERN:
 *
 * When you embed CAS Lens modules in your own app, clicking a specimen
 * in the search results should navigate within YOUR app — not to
 * collections.calacademy.org. This example shows how:
 *
 *   1. Pass a `links` prop to <CASLensProvider> that maps entity types
 *      to your app's own routes.
 *
 *   2. Use useLinkBuilder() in any component to generate those URLs.
 *
 *   3. Build your own detail page that fetches data from the CAS API
 *      via getApiClient() and displays it however you want.
 *
 * The key line is:
 *
 *   links={{ specimen: (id, col) => `/specimen/${id}` }}
 *
 * This tells every CAS Lens component: "when you'd normally link to
 * a specimen, use this URL pattern instead."
 */
import { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CASLensProvider, getApiClient, useLinkBuilder } from '@calacademy-research/cas-lens';

// ---------------------------------------------------------------------------
// Types — just the fields we care about for this app
// ---------------------------------------------------------------------------

interface Specimen {
  id: string;
  catalog_number: string;
  collection_code: string;
  scientific_name: string | null;
  accepted_name: string | null;
  taxon_family: string | null;
  taxon_order: string | null;
  taxon_class: string | null;
  locality: string | null;
  country: string | null;
  state_province: string | null;
  latitude: number | null;
  longitude: number | null;
  verbatim_collector: string | null;
  year_collected: number | null;
  type_status: string | null;
  common_name: string | null;
  media: { url: string; type: string; label?: string }[];
}

interface SearchResponse {
  results: Specimen[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// ---------------------------------------------------------------------------
// LOCAL DETAIL PAGE
//
// This is YOUR page — not a CAS Lens component. It fetches a single
// specimen from the API and renders it in whatever format you want.
// This is what consumers build on top of the CAS data.
// ---------------------------------------------------------------------------

function SpecimenPage() {
  // Read the specimen ID from the URL (set up by React Router below)
  const { id } = useParams<{ id: string }>();

  // Fetch the specimen from the CAS API using the shared client
  const { data: s, isLoading, error } = useQuery<Specimen>({
    queryKey: ['specimen', id],
    queryFn: async () => {
      const client = getApiClient();
      const res = await client.get(`/specimens/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  if (isLoading) return <Page><p style={{ color: '#666' }}>Loading specimen...</p></Page>;
  if (error) return <Page><p style={{ color: '#c00' }}>Failed to load: {(error as Error).message}</p></Page>;
  if (!s) return <Page><p>Specimen not found</p></Page>;

  // Pick the first image if available
  const image = s.media?.find(m => m.type === 'image');

  // Render the specimen in OUR format — not the CAS Lens format.
  // This is the whole point: you control the presentation.
  return (
    <Page>
      {/* Back link to search results */}
      <Link to="/" style={{ color: '#003262', fontSize: '14px', textDecoration: 'none' }}>
        &larr; Back to search
      </Link>

      {/* Two-column layout: info + image */}
      <div style={{ display: 'flex', gap: '32px', marginTop: '16px', flexWrap: 'wrap' }}>

        {/* Left column: our custom card format */}
        <div style={{ flex: '1 1 400px' }}>
          {/* Big species name */}
          <h1 style={{ margin: '0 0 4px', fontSize: '28px', color: '#003262' }}>
            <em>{s.scientific_name || 'Unknown species'}</em>
          </h1>

          {/* Common name if available */}
          {s.common_name && (
            <p style={{ margin: '0 0 12px', fontSize: '16px', color: '#666' }}>{s.common_name}</p>
          )}

          {/* Badges */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <Badge color="#003262">{s.collection_code.toUpperCase()} {s.catalog_number}</Badge>
            {s.type_status && <Badge color="#92400e">{s.type_status}</Badge>}
            {s.year_collected && <Badge color="#065f46">Collected {s.year_collected}</Badge>}
          </div>

          {/* Key facts as a simple list — our custom layout */}
          <FactRow label="Family" value={s.taxon_family} />
          <FactRow label="Order" value={s.taxon_order} />
          <FactRow label="Class" value={s.taxon_class} />
          <FactRow label="Collector" value={s.verbatim_collector} />
          <FactRow label="Locality" value={s.locality} />
          <FactRow label="Country" value={[s.state_province, s.country].filter(Boolean).join(', ')} />
          {s.latitude != null && (
            <FactRow label="Coordinates" value={`${s.latitude.toFixed(4)}, ${s.longitude?.toFixed(4)}`} />
          )}
        </div>

        {/* Right column: image */}
        <div style={{ flex: '0 0 280px' }}>
          {image ? (
            <img
              src={image.url}
              alt={s.scientific_name || 'Specimen'}
              style={{ width: '100%', borderRadius: '8px', border: '1px solid #e0e0e0' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div style={{
              width: '100%', height: '200px', borderRadius: '8px',
              border: '2px dashed #ddd', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#ccc',
            }}>
              No image
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}

// ---------------------------------------------------------------------------
// SEARCH PAGE
//
// Uses useLinkBuilder() to generate specimen links. Because we passed
// `links={{ specimen: ... }}` to CASLensProvider, the links point to
// our local /specimen/:id route instead of collections.calacademy.org.
// ---------------------------------------------------------------------------

function SearchPage() {
  // useLinkBuilder() returns the link functions we configured on the provider.
  // When we call links.specimen(id, collection), it returns "/specimen/{id}"
  // instead of the default "https://collections.calacademy.org/..." URL.
  const links = useLinkBuilder();

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
      const params: Record<string, any> = { q: submittedQuery, page, per_page: perPage };
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

  const thStyle: React.CSSProperties = {
    padding: '8px 12px', textAlign: 'left', borderBottom: '2px solid #e0e0e0',
    fontSize: '13px', fontWeight: 600, color: '#003262', cursor: 'pointer',
    whiteSpace: 'nowrap', background: '#f8f9fa',
  };
  const tdStyle: React.CSSProperties = {
    padding: '6px 12px', borderBottom: '1px solid #eee', fontSize: '13px', verticalAlign: 'top',
  };

  return (
    <Page>
      <h1 style={{ color: '#003262', marginBottom: '4px' }}>CAS Specimen Search</h1>
      <p style={{ color: '#666', marginTop: 0 }}>
        Search across 1.4 million specimens — click any catalog number to see our local detail page
      </p>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input
          type="text" value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Scientific name, locality, collector..."
          style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #ccc', flex: 1, minWidth: '250px', fontSize: '15px' }}
        />
        <select value={collection ?? ''} onChange={(e) => { setCollection(e.target.value || null); setPage(1); }}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc' }}>
          <option value="">All Collections</option>
          <option value="ich">Ichthyology</option>
          <option value="herp">Herpetology</option>
          <option value="orn">Ornithology</option>
          <option value="botany">Botany</option>
          <option value="ent">Entomology</option>
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
                    <tr key={s.id}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f4ff')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}>
                      <td style={tdStyle}>
                        {/*
                         * THIS IS THE KEY LINE:
                         * links.specimen() returns "/specimen/{id}" because we
                         * configured it in the CASLensProvider below. Without
                         * the override, it would return a collections.calacademy.org URL.
                         *
                         * We use a React Router <Link> so clicking navigates
                         * within our app instead of opening a new tab.
                         */}
                        <Link to={links.specimen(s.id, s.collection_code)}
                          style={{ color: '#003262', textDecoration: 'none', fontWeight: 500 }}>
                          {s.catalog_number}
                        </Link>
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
    </Page>
  );
}

// ---------------------------------------------------------------------------
// HELPER COMPONENTS — tiny reusable bits for the detail page
// ---------------------------------------------------------------------------

/** Page wrapper — centers content with consistent padding */
function Page({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui' }}>
      {children}
    </div>
  );
}

/** A colored pill badge */
function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: '12px',
      fontSize: '12px', fontWeight: 600, color: 'white', background: color,
    }}>
      {children}
    </span>
  );
}

/** A label: value row for the detail page */
function FactRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: '12px' }}>
      <span style={{ fontWeight: 600, color: '#003262', fontSize: '13px', minWidth: '100px' }}>{label}</span>
      <span style={{ fontSize: '14px', color: '#333' }}>{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// APP ROOT
//
// The `links` prop is where the magic happens. It tells every CAS Lens
// component in this tree: "specimen links should go to /specimen/:id".
//
// Without this prop, links.specimen() would return the default:
//   https://collections.calacademy.org/{collection}/specimen/{id}
//
// With this prop, it returns:
//   /specimen/{id}
//
// That's it — one prop, and all specimen links in the app are local.
// ---------------------------------------------------------------------------

export default function App() {
  return (
    <BrowserRouter>
      <CASLensProvider
        apiBase="/api"
        links={{
          // Override specimen links to point to our local detail page.
          // The (id, _collection) args match the LinkBuilder.specimen signature.
          // We ignore collection here since our route only needs the UUID.
          specimen: (id, _collection) => `/specimen/${id}`,
        }}
      >
        <Routes>
          {/* Search results — the table uses links.specimen() for each row */}
          <Route path="/" element={<SearchPage />} />

          {/* Our local detail page — fetches from the API and renders our way */}
          <Route path="/specimen/:id" element={<SpecimenPage />} />
        </Routes>
      </CASLensProvider>
    </BrowserRouter>
  );
}
