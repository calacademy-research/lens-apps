# Getting Started

This guide walks you through building a web app that searches CAS specimens and displays the results. By the end, you'll have a working search page and a detail page — both running locally on your machine, pulling live data from the CAS collections database.

No prior web development experience is assumed. If you've written Python scripts or Jupyter notebooks, you have enough background.

## What you'll build

A small app with two pages:

1. **Search page** — type a query, see a table of matching specimens
2. **Detail page** — click a specimen to see its taxonomy, locality, collector, and images

The app calls the CAS Lens API for data but renders everything in your own layout. You control what it looks like.

## Before you start

You need two things installed on your computer:

### 1. Node.js

Node.js is the runtime that executes JavaScript outside a browser. It's to JavaScript what the Python interpreter is to Python.

Check if you already have it:

```bash
node --version
```

If you see `v18` or higher, you're good. If not, install it from [nodejs.org](https://nodejs.org/) — download the LTS (Long Term Support) version.

Node.js comes with **npm** (Node Package Manager), which is like `pip` for JavaScript. You'll use it to install libraries and run scripts.

### 2. A text editor

Any editor works. VS Code is popular for JavaScript/TypeScript because it has built-in syntax highlighting, error checking, and a terminal.

## Step 1: Create a new project

Open a terminal and run:

```bash
npm create vite@latest my-cas-app -- --template react-ts
```

This creates a new folder called `my-cas-app` with a starter project. Here's what it does:

- `npm create vite@latest` — runs the Vite project scaffolder (Vite is the development server, like Flask's dev server for Python)
- `my-cas-app` — the name of your project folder
- `--template react-ts` — use React with TypeScript (TypeScript is JavaScript with type annotations, like Python type hints)

Now move into the project and install its dependencies:

```bash
cd my-cas-app
npm install
```

`npm install` reads the `package.json` file (like `requirements.txt` in Python) and downloads everything the project needs into a `node_modules` folder. This folder is large — don't worry about it, don't check it into git, don't look inside it.

### Verify it works

```bash
npm run dev
```

You should see something like:

```
VITE v6.4.1  ready in 300 ms

  ➜  Local:   http://localhost:5173/
```

Open that URL in your browser. You'll see Vite's default starter page. Press `Ctrl+C` in the terminal to stop the server. You'll replace this page with your own code next.

## Step 2: Install the CAS Lens package

The CAS Lens package gives you an API client and helper functions. Install it along with two libraries it depends on:

```bash
npm install ../../cas-lens/frontend
npm install @tanstack/react-query react-router-dom
```

Here's what each package does:

| Package | What it does | Python equivalent |
|---------|-------------|-------------------|
| `@calacademy-research/cas-lens` | API client + helper hooks for CAS data | A custom library you import |
| `@tanstack/react-query` | Caches API responses, handles loading/error states | Like `requests-cache` + retry logic |
| `react-router-dom` | URL routing (different URLs show different pages) | Like Flask's `@app.route()` |

> **Note:** The first line installs from a local folder. Once the package is published to GitHub Packages, you'd replace it with `npm install @calacademy-research/cas-lens`.

## Step 3: Set up the API proxy

Your app needs to call the CAS API at `collections.calacademy.org`. But browsers block requests from `localhost` to other domains for security (this is called CORS — Cross-Origin Resource Sharing). The fix is a **proxy**: your dev server intercepts requests to `/api` and forwards them to the real server.

Open `vite.config.ts` (it already exists in your project) and replace its contents with:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // When your app requests /api/search, the dev server forwards it to
      // https://collections.calacademy.org/api/search and returns the response.
      // Your browser thinks it's talking to localhost — no CORS issues.
      '/api': {
        target: 'https://collections.calacademy.org',
        changeOrigin: true,
      },
      // Same for vector map tiles (if you build a map later)
      '/tiles': {
        target: 'https://collections.calacademy.org',
        changeOrigin: true,
      },
    },
  },
});
```

This is a development convenience. In production, you'd configure your web server (nginx, etc.) to handle the routing instead.

## Step 4: Write the search page

Now the actual code. Open `src/App.tsx` and replace everything in it with:

```tsx
// App.tsx — A simple specimen search app
//
// This file defines two things:
// 1. A Search component that calls the CAS API and shows results
// 2. An App component that wraps everything in the CAS Lens provider

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CASLensProvider, getApiClient } from '@calacademy-research/cas-lens';

// ---------------------------------------------------------------------------
// SEARCH COMPONENT
//
// This is a React component — a function that returns what the UI should
// look like. React calls it whenever the data changes and updates the screen.
//
// If you've used Jupyter widgets or Streamlit, it's the same idea:
// you declare what should be on screen based on the current state,
// and the framework handles rendering.
// ---------------------------------------------------------------------------

function Search() {
  // useState is how React tracks values that change over time.
  // query = current value, setQuery = function to update it.
  // Think of it like a variable that triggers a re-render when changed.
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');

  // useQuery fetches data from the API and caches it.
  // It handles loading states, errors, and re-fetching automatically.
  //
  // The equivalent Python would be:
  //   if submitted:
  //     response = requests.get('/api/search', params={'q': submitted, 'per_page': 10})
  //     data = response.json()
  const { data, isLoading, error } = useQuery({
    // queryKey identifies this request (used for caching)
    queryKey: ['search', submitted],
    // queryFn is the function that actually fetches the data
    queryFn: async () => {
      const client = getApiClient();
      const res = await client.get('/search', {
        params: { q: submitted, per_page: 10 },
      });
      return res.data;
    },
    // Don't fetch until the user has submitted a query
    enabled: submitted.length > 0,
  });

  // Everything below is JSX — it looks like HTML but it's JavaScript.
  // The curly braces {} embed JavaScript expressions into the markup.
  // style={{ }} is an inline CSS object (like style="..." in HTML).
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20, fontFamily: 'system-ui' }}>
      <h1>My Specimen Search</h1>

      {/* A form with an input and a button. onSubmit fires when the user
          presses Enter or clicks Search. e.preventDefault() stops the
          browser from reloading the page (default form behavior). */}
      <form onSubmit={(e) => { e.preventDefault(); setSubmitted(query); }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search specimens... try 'iris' or 'shark'"
          style={{ padding: 8, width: 300, marginRight: 8, fontSize: 15 }}
        />
        <button type="submit" style={{ padding: '8px 16px', fontSize: 15 }}>
          Search
        </button>
      </form>

      {/* Conditional rendering: show loading, error, or results.
          In Python this would be if/elif/else blocks. In JSX,
          {condition && <element>} renders the element only if condition is true. */}

      {isLoading && <p style={{ color: '#666' }}>Searching...</p>}

      {error && <p style={{ color: '#c00' }}>Error: {(error as Error).message}</p>}

      {data && (
        <div>
          <p style={{ color: '#666' }}>{data.total.toLocaleString()} specimens found</p>

          {/* .map() is like a Python list comprehension:
              [f"<li>{s.catalog_number}</li>" for s in data.results] */}
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {data.results.map((s: any) => (
              <li key={s.id} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
                <strong>{s.catalog_number}</strong>
                {' — '}
                <em>{s.scientific_name || 'Unknown'}</em>
                {s.taxon_family && ` (${s.taxon_family})`}
                {s.locality && (
                  <span style={{ color: '#666' }}> — {s.locality}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// APP COMPONENT
//
// CASLensProvider sets up the API connection. Every component inside it
// can call getApiClient() to make API requests.
//
// apiBase="/api" tells the client to send requests to /api/... which
// the Vite proxy forwards to collections.calacademy.org.
// ---------------------------------------------------------------------------

export default function App() {
  return (
    <CASLensProvider apiBase="/api">
      <Search />
    </CASLensProvider>
  );
}
```

### What this code does, line by line

1. **Imports** — pull in React hooks, the query library, and the CAS Lens client
2. **`useState`** — creates two pieces of state: `query` (what the user is typing) and `submitted` (what they've searched for)
3. **`useQuery`** — calls `/api/search` whenever `submitted` changes, caches the result
4. **JSX return** — renders a form, and conditionally shows loading/error/results
5. **`CASLensProvider`** — wraps the app and configures the API connection

## Step 5: Run it

```bash
npm run dev
```

Open `http://localhost:5173` in your browser. Type "iris" and press Enter. You should see a list of specimens from the CAS Botany collection.

If you see "Searching..." but no results appear, check that your `vite.config.ts` proxy is set up correctly. If you see a CORS error in the browser console, the proxy isn't working.

### What just happened

1. You typed "iris" and pressed Enter
2. Your React component called `setSubmitted('iris')`
3. React re-rendered the component, and `useQuery` saw that `submitted` changed
4. `useQuery` called `getApiClient().get('/search', { params: { q: 'iris' } })`
5. Vite's dev server proxied that request to `https://collections.calacademy.org/api/search?q=iris`
6. The API returned JSON with matching specimens
7. React re-rendered with the data, showing the list

## Step 6: Add a detail page

Now make the catalog numbers clickable. When clicked, they'll navigate to a new page in your app that shows the full specimen record.

This requires two changes:

1. Add routing — so different URLs show different components
2. Override the link builder — so specimen links point to your page

Replace `src/App.tsx` with this expanded version:

```tsx
// App.tsx — Search + detail page with link builder
//
// Demonstrates how to:
// 1. Use React Router for multiple pages
// 2. Override CAS Lens links to stay within your app
// 3. Fetch and display a single specimen record

import { useState } from 'react';
import { BrowserRouter, Routes, Route, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CASLensProvider, getApiClient, useLinkBuilder } from '@calacademy-research/cas-lens';

// ---------------------------------------------------------------------------
// SEARCH PAGE
// ---------------------------------------------------------------------------

function SearchPage() {
  // useLinkBuilder() returns link functions configured on the provider.
  // Because we set links={{ specimen: ... }} on CASLensProvider below,
  // links.specimen(id, collection) returns "/specimen/{id}" instead of
  // the default CAS Lens URL.
  const links = useLinkBuilder();

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
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20, fontFamily: 'system-ui' }}>
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
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {data.results.map((s: any) => (
            <li key={s.id} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
              {/* Link is a React Router component — it navigates within your
                  app without a full page reload (like a single-page app).
                  links.specimen() returns "/specimen/{id}" because of
                  the override we configured on CASLensProvider. */}
              <Link to={links.specimen(s.id, s.collection_code)}
                style={{ color: '#003262', fontWeight: 500 }}>
                {s.catalog_number}
              </Link>
              {' — '}
              <em>{s.scientific_name}</em>
              {s.locality && <span style={{ color: '#666' }}> — {s.locality}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// DETAIL PAGE
//
// This is YOUR page. You fetch the data and render it however you want.
// The CAS Lens package just gives you the API client — the layout,
// design, and content are entirely up to you.
// ---------------------------------------------------------------------------

function DetailPage() {
  // useParams() reads URL parameters. If the URL is /specimen/abc-123,
  // then id = "abc-123". This is set up by the <Route> below.
  const { id } = useParams<{ id: string }>();

  // Fetch the specimen record from the API
  const { data: specimen, isLoading } = useQuery({
    queryKey: ['specimen', id],
    queryFn: async () => {
      const client = getApiClient();
      const res = await client.get(`/specimens/${id}`);
      return res.data;
    },
  });

  if (isLoading) return <p style={{ padding: 20 }}>Loading...</p>;
  if (!specimen) return <p style={{ padding: 20 }}>Specimen not found</p>;

  // Render the specimen your way
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20, fontFamily: 'system-ui' }}>
      {/* Back link */}
      <Link to="/" style={{ color: '#003262' }}>&larr; Back to search</Link>

      <h1 style={{ marginTop: 12 }}>
        <em>{specimen.scientific_name || 'Unknown'}</em>
      </h1>

      <p style={{ color: '#666' }}>
        {specimen.collection_code?.toUpperCase()} {specimen.catalog_number}
      </p>

      {/* Show whatever fields you care about */}
      <table style={{ borderCollapse: 'collapse', marginTop: 16 }}>
        <tbody>
          {specimen.taxon_family && <Row label="Family" value={specimen.taxon_family} />}
          {specimen.taxon_order && <Row label="Order" value={specimen.taxon_order} />}
          {specimen.verbatim_collector && <Row label="Collector" value={specimen.verbatim_collector} />}
          {specimen.locality && <Row label="Locality" value={specimen.locality} />}
          {specimen.country && <Row label="Country" value={specimen.country} />}
          {specimen.year_collected && <Row label="Year" value={String(specimen.year_collected)} />}
        </tbody>
      </table>
    </div>
  );
}

// Helper component for table rows
function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td style={{ padding: '4px 16px 4px 0', fontWeight: 600, color: '#003262' }}>{label}</td>
      <td style={{ padding: '4px 0' }}>{value}</td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// APP ROOT
//
// Three things happen here:
//
// 1. BrowserRouter enables client-side routing (different URLs → different pages)
//
// 2. CASLensProvider sets up the API connection AND overrides specimen links.
//    The links prop says: "whenever something generates a specimen URL,
//    use /specimen/{id} instead of the default CAS Lens URL."
//    This is how clicks in the search results navigate to YOUR detail page.
//
// 3. Routes defines which component renders for which URL path.
// ---------------------------------------------------------------------------

export default function App() {
  return (
    <BrowserRouter>
      <CASLensProvider
        apiBase="/api"
        links={{
          // This one line is what makes specimen links stay in your app.
          // Without it, links.specimen() would return:
          //   https://collections.calacademy.org/ich/specimen/abc-123
          // With it, links.specimen() returns:
          //   /specimen/abc-123
          specimen: (id, _collection) => `/specimen/${id}`,
        }}
      >
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/specimen/:id" element={<DetailPage />} />
        </Routes>
      </CASLensProvider>
    </BrowserRouter>
  );
}
```

Run `npm run dev` again, search for "iris", and click a catalog number. You'll navigate to `/specimen/{uuid}` — a page in your app, showing data from the CAS API in your layout.

## What to read next

- **`search-tool/src/App.tsx`** in this repo — a more polished version of what you just built, with a sortable table, pagination, collection filter, and images on the detail page
- **[API Reference](api-reference.md)** — all available endpoints, hooks, types, and collection codes
- The other example apps in this repo — each one shows a different way to use CAS data

## Common issues

### "Searching..." appears but results never load

The proxy isn't forwarding requests. Check that `vite.config.ts` has the `/api` proxy configured, and that the target is `https://collections.calacademy.org`. Restart the dev server after editing the config (`Ctrl+C`, then `npm run dev`).

### "CORS error" in the browser console

Same cause — the proxy isn't set up. The browser is trying to reach `collections.calacademy.org` directly instead of going through the proxy. Make sure your API calls use `/api/...` (relative path), not `https://collections.calacademy.org/api/...` (absolute URL).

### "Module not found" when importing from `@calacademy-research/cas-lens`

The package isn't installed. Run `npm install ../../cas-lens/frontend` (adjust the path to wherever your cas-lens checkout is). If the package is published, run `npm install @calacademy-research/cas-lens` instead.

### The page is blank (white screen)

Open the browser developer tools (F12 or right-click → Inspect → Console tab). There's usually a JavaScript error message that explains what went wrong. Common causes:

- Missing import (typo in an import statement)
- Missing dependency (forgot to `npm install` something)
- Stale cache (`rm -rf node_modules/.vite` and restart the dev server)

## Glossary

| Term | What it means |
|------|--------------|
| **Component** | A function that returns UI markup. The building block of React apps. Like a class in object-oriented Python, but for visual elements. |
| **JSX/TSX** | HTML-like syntax that you write inside JavaScript. `<h1>Hello</h1>` in JSX becomes a JavaScript function call. `.tsx` = TypeScript + JSX. |
| **Hook** | A function that starts with `use` (like `useState`, `useQuery`). It lets components have state, side effects, or access to shared context. |
| **State** | Data that changes over time and causes the UI to re-render. Managed with `useState()`. |
| **Props** | Arguments passed to a component. `<Search query="iris" />` passes `query` as a prop. Like keyword arguments to a Python function. |
| **Provider** | A component that wraps other components and shares data with them. Like a context manager (`with`) in Python. |
| **npm** | Node Package Manager. Installs libraries (`npm install`) and runs scripts (`npm run dev`). Like `pip` + `Makefile`. |
| **Vite** | The development server. Serves your app locally, watches for file changes, and reloads the browser automatically. |
| **Proxy** | A middleman that forwards requests. Your dev server pretends to serve `/api` locally but actually fetches from `collections.calacademy.org`. |
| **CORS** | Cross-Origin Resource Sharing. A browser security policy that blocks requests to other domains. The proxy bypasses it during development. |
| **React Query** | A library that fetches, caches, and manages API data. Handles loading states, errors, retries, and cache invalidation. |
| **React Router** | A library that maps URL paths to components. `/` shows SearchPage, `/specimen/:id` shows DetailPage. |
