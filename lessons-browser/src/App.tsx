/**
 * Lessons Browser — Browse CAS lesson plans.
 *
 * Demonstrates using getApiClient() from the cas-lens package
 * to call the stories API filtered by content_type=lesson_plan.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CASLensProvider, getApiClient } from '@calacademy-research/cas-lens';

interface LessonPlan {
  id: number;
  title: string;
  subtitle?: string;
  slug: string;
  featured_image_url?: string;
  grade_levels?: string[];
  subjects?: string[];
  themes?: string[];
  content_type?: string;
}

interface LessonsResponse {
  stories: LessonPlan[];
  total: number;
  page: number;
  per_page: number;
}

function LessonsGrid() {
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery<LessonsResponse>({
    queryKey: ['lessons', page],
    queryFn: async () => {
      const client = getApiClient();
      const res = await client.get('/stories', {
        params: { page, per_page: 12, content_type: 'lesson_plan' },
      });
      return res.data;
    },
  });

  if (isLoading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Loading lesson plans...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#c00' }}>
        Failed to load lesson plans: {(error as Error).message}
      </div>
    );
  }

  const lessons = data?.stories ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 12);

  if (lessons.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
        No lesson plans found.
      </div>
    );
  }

  return (
    <div>
      <p style={{ color: '#666', margin: '0 0 16px' }}>
        {total} lesson plans found — page {page} of {totalPages}
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px',
      }}>
        {lessons.map((lesson) => (
          <a
            key={lesson.id}
            href={`https://collections.calacademy.org/stories/${lesson.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              textDecoration: 'none',
              color: 'inherit',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              transition: 'box-shadow 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
          >
            <h3 style={{ margin: 0, fontSize: '16px', color: '#003262' }}>
              {lesson.title}
            </h3>
            {lesson.subtitle && (
              <p style={{ margin: 0, fontSize: '13px', color: '#666', lineHeight: '1.4' }}>
                {lesson.subtitle}
              </p>
            )}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
              {lesson.grade_levels && lesson.grade_levels.length > 0 && (
                lesson.grade_levels.map((grade) => (
                  <span
                    key={grade}
                    style={{
                      padding: '2px 8px', borderRadius: '12px', fontSize: '11px',
                      background: '#e8f5e9', color: '#2e7d32',
                    }}
                  >
                    {grade}
                  </span>
                ))
              )}
              {lesson.subjects && lesson.subjects.length > 0 && (
                lesson.subjects.map((subject) => (
                  <span
                    key={subject}
                    style={{
                      padding: '2px 8px', borderRadius: '12px', fontSize: '11px',
                      background: '#fff3e0', color: '#e65100',
                    }}
                  >
                    {subject}
                  </span>
                ))
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
        <h1 style={{ color: '#003262', marginBottom: '4px' }}>CAS Lesson Plans</h1>
        <p style={{ color: '#666', marginTop: 0, marginBottom: '20px' }}>
          Browse lesson plans from the California Academy of Sciences
        </p>
        <LessonsGrid />
      </div>
    </CASLensProvider>
  );
}
