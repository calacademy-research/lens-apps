/**
 * Papers Browser — Browse CAS literature and papers.
 *
 * Demonstrates using getApiClient() from the cas-lens package
 * to call the literature API with search support.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CASLensProvider, getApiClient } from '@calacademy-research/cas-lens';

interface Paper {
  id: number;
  title: string;
  authors?: string;
  year?: number;
  journal?: string;
  doi?: string;
  url?: string;
}

interface LiteratureResponse {
  results: Paper[];
  total: number;
  page: number;
  per_page: number;
}

function PapersList() {
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 20;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(searchInput);
    setPage(1);
  };

  const { data, isLoading, error } = useQuery<LiteratureResponse>({
    queryKey: ['literature', query, page],
    queryFn: async () => {
      const client = getApiClient();
      const params: Record<string, string | number> = { page, per_page: perPage };
      if (query) params.q = query;
      const res = await client.get('/literature', { params });
      return res.data;
    },
  });

  // API returns 'items' not 'results'
  const papers = (data as any)?.items ?? data?.results ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / perPage);

  return (
    <div>
      {/* Search form */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search papers by title, author, keyword..."
          style={{
            padding: '8px 14px', borderRadius: '6px', border: '1px solid #ccc',
            flex: 1, fontSize: '15px',
          }}
        />
        <button type="submit" style={{
          padding: '8px 24px', borderRadius: '6px', border: 'none',
          background: '#003262', color: 'white', cursor: 'pointer', fontSize: '15px',
        }}>
          Search
        </button>
      </form>

      {isLoading && (
        <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Loading papers...</div>
      )}

      {error && (
        <div style={{ padding: '40px', textAlign: 'center', color: '#c00' }}>
          Failed to load papers: {(error as Error).message}
        </div>
      )}

      {!isLoading && !error && (
        <>
          <p style={{ color: '#666', margin: '0 0 12px' }}>
            {total} papers found{query ? ` for "${query}"` : ''} — page {page} of {Math.max(1, totalPages)}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
            {papers.map((paper) => {
              const link = paper.doi
                ? `https://doi.org/${paper.doi}`
                : paper.url || null;

              return (
                <div
                  key={paper.id}
                  style={{
                    padding: '12px 16px',
                    background: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    {link ? (
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: '15px', color: '#003262', fontWeight: 500 }}
                      >
                        {paper.title}
                      </a>
                    ) : (
                      <span style={{ fontSize: '15px', color: '#003262', fontWeight: 500 }}>
                        {paper.title}
                      </span>
                    )}
                    {paper.year && (
                      <span style={{ fontSize: '13px', color: '#999', whiteSpace: 'nowrap' }}>
                        ({paper.year})
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '13px', color: '#666' }}>
                    {paper.authors && <span>{paper.authors}</span>}
                    {paper.authors && paper.journal && <span> — </span>}
                    {paper.journal && <em>{paper.journal}</em>}
                  </div>
                </div>
              );
            })}
          </div>

          {papers.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
              No papers found{query ? ` for "${query}"` : ''}.
            </div>
          )}

          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '24px' }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: '8px 16px', borderRadius: '6px', border: '1px solid #ccc',
                  background: page === 1 ? '#f5f5f5' : 'white', cursor: page === 1 ? 'default' : 'pointer',
                }}
              >
                Previous
              </button>
              <span style={{ padding: '8px 12px', color: '#666' }}>
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: '8px 16px', borderRadius: '6px', border: '1px solid #ccc',
                  background: page === totalPages ? '#f5f5f5' : 'white',
                  cursor: page === totalPages ? 'default' : 'pointer',
                }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    // To override links in your own app, pass a `links` prop:
    // <CASLensProvider apiBase="/api" links={{ literature: (slug) => `/papers/${slug}` }}>
    // Note: DOI links are external and are not affected by the link builder.
    <CASLensProvider apiBase="/api">
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui' }}>
        <h1 style={{ color: '#003262', marginBottom: '4px' }}>CAS Papers</h1>
        <p style={{ color: '#666', marginTop: 0, marginBottom: '20px' }}>
          Browse scientific literature from the California Academy of Sciences
        </p>
        <PapersList />
      </div>
    </CASLensProvider>
  );
}
