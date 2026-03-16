/**
 * Stories Browser — Browse CAS stories and narratives.
 *
 * Demonstrates using getApiClient() from the cas-lens package
 * to call the stories API directly and render results in a card grid.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CASLensProvider, getApiClient } from '@calacademy-research/cas-lens';

interface Story {
  id: number;
  title: string;
  subtitle?: string;
  slug: string;
  featured_image_url?: string;
  themes?: string[];
  content_type?: string;
  created_at?: string;
}

interface StoriesResponse {
  stories: Story[];
  total: number;
  page: number;
  per_page: number;
}

function StoriesGrid() {
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery<StoriesResponse>({
    queryKey: ['stories', page],
    queryFn: async () => {
      const client = getApiClient();
      const res = await client.get('/stories', {
        params: { page, per_page: 12 },
      });
      return res.data;
    },
  });

  if (isLoading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Loading stories...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#c00' }}>
        Failed to load stories: {(error as Error).message}
      </div>
    );
  }

  const stories = data?.stories ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 12);

  return (
    <div>
      <p style={{ color: '#666', margin: '0 0 16px' }}>
        {total} stories found — page {page} of {totalPages}
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px',
      }}>
        {stories.map((story) => (
          <a
            key={story.id}
            href={`https://collections.calacademy.org/stories/${story.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              textDecoration: 'none',
              color: 'inherit',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              transition: 'box-shadow 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
          >
            {story.featured_image_url && (
              <img
                src={story.featured_image_url}
                alt={story.title}
                style={{ width: '100%', height: '180px', objectFit: 'cover' }}
              />
            )}
            {!story.featured_image_url && (
              <div style={{
                width: '100%', height: '180px', background: '#f0f0f0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#999', fontSize: '14px',
              }}>
                No image
              </div>
            )}
            <div style={{ padding: '12px 16px' }}>
              <h3 style={{ margin: '0 0 4px', fontSize: '16px', color: '#003262' }}>
                {story.title}
              </h3>
              {story.subtitle && (
                <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#666', lineHeight: '1.4' }}>
                  {story.subtitle}
                </p>
              )}
              {story.themes && story.themes.length > 0 && (
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {story.themes.map((theme) => (
                    <span
                      key={theme}
                      style={{
                        padding: '2px 8px', borderRadius: '12px', fontSize: '11px',
                        background: '#e8f0fe', color: '#1a73e8',
                      }}
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </a>
        ))}
      </div>

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
    </div>
  );
}

export default function App() {
  return (
    <CASLensProvider apiBase="/api">
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui' }}>
        <h1 style={{ color: '#003262', marginBottom: '4px' }}>CAS Stories</h1>
        <p style={{ color: '#666', marginTop: 0, marginBottom: '20px' }}>
          Browse stories and narratives from the California Academy of Sciences
        </p>
        <StoriesGrid />
      </div>
    </CASLensProvider>
  );
}
