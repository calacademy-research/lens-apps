# Getting Started with CAS Lens Components

This guide walks you through building a small app that displays CAS specimen data using pre-built components. No knowledge of the CAS Lens internals is required.

## What you get

The `@calacademy-research/cas-lens` package gives you React components that connect to the CAS collections API. You can drop them into any React app to display:

- **Specimen maps** — interactive vector tile maps with 1.4M+ specimens
- **Search results** — sortable, paginated tables of specimen records
- **Specimen detail pages** — full detail view with images, taxonomy, collector info, and maps

## Prerequisites

- Node.js 18+ and npm
- Basic familiarity with React (components, props, JSX)
- A GitHub account (for installing the package)

## Step 1: Create a new React project

```bash
npm create vite@latest my-cas-app -- --template react-ts
cd my-cas-app
```

## Step 2: Install the package

The package is hosted on GitHub Packages. You need a GitHub personal access token with `read:packages` scope.

Create a `.npmrc` file in your project root:

```
@calacademy-research:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Set the token in your environment:

```bash
export GITHUB_TOKEN=ghp_your_token_here
```

Install the package and its peer dependencies:

```bash
npm install @calacademy-research/cas-lens
npm install @tanstack/react-query react-router-dom
npm install maplibre-gl @vis.gl/react-maplibre    # for maps
npm install leaflet react-leaflet                  # for specimen detail
```

> **Local development alternative:** If the package isn't published yet, install directly from the cas-lens repo:
> ```bash
> npm install ../../cas-lens/frontend
> ```

## Step 3: Write your app

Replace `src/App.tsx` with:

```tsx
import { useState } from 'react';
import { CASLensProvider, SpecimenSearch } from '@calacademy-research/cas-lens';

const API = 'https://collections.calacademy.org/api';

export default function App() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');

  return (
    <CASLensProvider apiBase={API}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
        <h1>My Specimen Search</h1>

        <form onSubmit={(e) => { e.preventDefault(); setSubmitted(query); }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search specimens..."
            style={{ padding: 8, width: 300, marginRight: 8 }}
          />
          <button type="submit" style={{ padding: '8px 16px' }}>Search</button>
        </form>

        {submitted && (
          <SpecimenSearch query={submitted} perPage={20} />
        )}
      </div>
    </CASLensProvider>
  );
}
```

## Step 4: Run it

```bash
npm run dev
```

Open http://localhost:5173 and search for "shark" or "Iris".

That's it. You have a working specimen search app.

## Adding a map

To show specimens on a map instead of a table, swap `SpecimenSearch` for `SpecimenMap`:

```tsx
import { CASLensProvider, SpecimenMap } from '@calacademy-research/cas-lens';
import 'maplibre-gl/dist/maplibre-gl.css';

export default function App() {
  return (
    <CASLensProvider apiBase="https://collections.calacademy.org/api">
      <SpecimenMap
        collection="ich"
        center={[-122.4, 37.8]}
        zoom={5}
        height="100vh"
      />
    </CASLensProvider>
  );
}
```

This renders a full-page map centered on San Francisco showing all Ichthyology specimens.

## Showing a single specimen

To display a detail page for a specific specimen:

```tsx
import { CASLensProvider, SpecimenDetailView } from '@calacademy-research/cas-lens';
import 'leaflet/dist/leaflet.css';

export default function App() {
  return (
    <CASLensProvider apiBase="https://collections.calacademy.org/api">
      <SpecimenDetailView collection="ich" specimenId="246255" />
    </CASLensProvider>
  );
}
```

## Key concepts

### CASLensProvider

Every CAS Lens component must be wrapped in `<CASLensProvider>`. This sets up the API connection and data caching. You only need one, typically at the top of your app.

```tsx
<CASLensProvider apiBase="https://collections.calacademy.org/api">
  {/* your components here */}
</CASLensProvider>
```

The `apiBase` prop points to the CAS Lens API server.

### Props, not configuration files

All components are controlled via React props. There are no config files to write. Pass a `query` prop to search, a `collection` prop to filter — standard React patterns.

### Data fetching is handled for you

The components fetch data from the API automatically. You don't need to write fetch calls, manage loading states, or handle errors. The components do all of that internally.

If you need custom data fetching (for example, to build your own UI), you can use the hooks directly:

```tsx
import { useSearchQuery, useSearchFilters } from '@calacademy-research/cas-lens';
```

These hooks manage search state and can be used with or without a `SearchProvider`.

## Working examples

See the three example apps in this repo:

- `map-explorer/` — map with search bar and collection dropdown
- `search-tool/` — search form with results table and filtering
- `specimen-viewer/` — detail page viewer with specimen ID lookup
