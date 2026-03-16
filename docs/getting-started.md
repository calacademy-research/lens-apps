# Getting Started

Build a small app that searches CAS specimens and shows detail pages — all within your own app, using your own layout.

## What you need

- Node.js 18+
- Basic React knowledge (components, props, hooks)

## Step 1: Create a project

```bash
npm create vite@latest my-cas-app -- --template react-ts
cd my-cas-app
```

## Step 2: Install dependencies

```bash
# The CAS Lens package (from local build until published)
npm install ../../cas-lens/frontend

# Required peer dependencies
npm install @tanstack/react-query react-router-dom
```

If you're building a map app, also install:
```bash
npm install maplibre-gl @vis.gl/react-maplibre
```

## Step 3: Set up the API proxy

The CAS API is at `collections.calacademy.org`. To avoid CORS issues during development, add a proxy to `vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://collections.calacademy.org',
        changeOrigin: true,
      },
      '/tiles': {
        target: 'https://collections.calacademy.org',
        changeOrigin: true,
      },
    },
  },
});
```

This lets your app call `/api/search` and have it forwarded to the production API.

## Step 4: Write your app

Replace `src/App.tsx`:

```tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CASLensProvider, getApiClient } from '@calacademy-research/cas-lens';

// A simple specimen search that calls the API directly.
// You control the rendering — there's no CAS Lens UI to work around.

function Search() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['search', submitted],
    queryFn: async () => {
      const client = getApiClient();
      const res = await client.get('/search', {
        params: { q: submitted, per_page: 10 },
      });
      return res.data;
    },
    enabled: submitted.length > 0,
  });

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <h1>My Specimen Search</h1>

      <form onSubmit={(e) => { e.preventDefault(); setSubmitted(query); }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search specimens..."
          style={{ padding: 8, width: 300, marginRight: 8 }}
        />
        <button type="submit">Search</button>
      </form>

      {isLoading && <p>Searching...</p>}

      {data && (
        <div>
          <p>{data.total} results</p>
          <ul>
            {data.results.map((s: any) => (
              <li key={s.id}>
                <strong>{s.catalog_number}</strong> — <em>{s.scientific_name}</em>
                {s.locality && ` — ${s.locality}`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <CASLensProvider apiBase="/api">
      <Search />
    </CASLensProvider>
  );
}
```

## Step 5: Run it

```bash
npm run dev
```

Search for "iris" or "shark". Results come from the CAS API and render in your layout.

## Next: add a local detail page

The `search-tool` example in this repo shows the full pattern:

1. Add React Router routes
2. Pass a `links` prop to `CASLensProvider` to redirect specimen links to your local route
3. Build a detail page that fetches from `/api/specimens/{id}` and renders your way

The key is the link override:

```tsx
<CASLensProvider
  apiBase="/api"
  links={{
    // Clicking a specimen anywhere in the app goes to YOUR route
    specimen: (id, _collection) => `/specimen/${id}`,
  }}
>
  <Routes>
    <Route path="/" element={<SearchPage />} />
    <Route path="/specimen/:id" element={<MyDetailPage />} />
  </Routes>
</CASLensProvider>
```

Inside `MyDetailPage`, fetch the specimen and render it however you want:

```tsx
function MyDetailPage() {
  const { id } = useParams();

  const { data } = useQuery({
    queryKey: ['specimen', id],
    queryFn: async () => {
      const client = getApiClient();
      const res = await client.get(`/specimens/${id}`);
      return res.data;
    },
  });

  if (!data) return <p>Loading...</p>;

  return (
    <div>
      <h1>{data.scientific_name}</h1>
      <p>{data.locality}, {data.country}</p>
    </div>
  );
}
```

See `search-tool/src/App.tsx` for the complete working version.

## Available API endpoints

These are the endpoints the example apps use. Call them via `getApiClient().get(path)`.

| Endpoint | Returns | Used by |
|----------|---------|---------|
| `/search?q=&per_page=` | Specimen search results | search-tool |
| `/specimens/{uuid}` | Single specimen detail | specimen-viewer, search-tool |
| `/stories?page=&per_page=` | Published stories | stories-browser |
| `/stories?content_type=lesson_plan` | Lesson plans | lessons-browser |
| `/literature?page=&per_page=&q=` | Literature/papers | papers-browser |
| `/collections` | All collections | any app |

## Available link builder types

When you pass `links` to `CASLensProvider`, you can override URLs for these entity types:

| Key | Signature | Default |
|-----|-----------|---------|
| `specimen` | `(id: string, collection: string) => string` | `https://collections.calacademy.org/{collection}/specimen/{id}` |
| `story` | `(slug: string) => string` | `https://collections.calacademy.org/stories/{slug}` |
| `lesson` | `(slug: string) => string` | `https://collections.calacademy.org/stories/{slug}` |
| `literature` | `(slug: string) => string` | `https://collections.calacademy.org/literature/{slug}` |
| `person` | `(slug: string) => string` | `https://collections.calacademy.org/people/{slug}` |
| `expedition` | `(id: string) => string` | `https://collections.calacademy.org/expedition/{id}` |
| `taxon` | `(id: string) => string` | `https://collections.calacademy.org/taxon/{id}` |
| `collection` | `(code: string) => string` | `https://collections.calacademy.org/{code}` |

Only override the ones you need. Unset types fall back to the CAS Lens production URLs.
