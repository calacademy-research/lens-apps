# CAS Lens Example Apps

Six example apps showing how to use CAS collections data in your own React projects.

Each app is a standalone Vite + React project in its own directory. They pull data from the CAS Lens API and render it independently — no knowledge of the CAS Lens codebase is needed.

## Apps

| App | What it does | Approach |
|-----|-------------|----------|
| `search-tool/` | Specimen search with local detail pages | API client + link builder override |
| `map-explorer/` | Interactive specimen map with collection pills | MapLibre GL + CAS vector tiles |
| `specimen-viewer/` | Specimen detail with taxonomy, locality, images | API client + custom rendering |
| `stories-browser/` | Story cards with images and themes | API client + card grid |
| `lessons-browser/` | Lesson plan cards | API client + card grid |
| `papers-browser/` | Searchable literature list with DOI links | API client + search input |

The `search-tool` is the most complete example. It demonstrates the **link builder pattern**: clicking a specimen in the search results navigates to a local detail page within the app, not to `collections.calacademy.org`. This is the pattern for building your own UI on top of CAS data.

## Running an app

```bash
cd search-tool     # or any app directory
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

## How it works

Each app uses two things from the `@calacademy-research/cas-lens` package:

1. **`CASLensProvider`** — sets up the API connection
2. **`getApiClient()`** — returns an axios instance pointed at the CAS API

The apps call API endpoints directly (`/api/search`, `/api/stories`, `/api/literature`, `/api/specimens/{id}`) and render the results with their own inline-styled components. No Tailwind, no CAS Lens UI components, no framework lock-in.

The Vite dev server proxies `/api` and `/tiles` requests to `collections.calacademy.org` to avoid CORS issues during development. See `vite.config.ts` in any app for the proxy setup.

## Link builder

When you embed CAS data in your own app, you want links to stay within your app — not navigate to `collections.calacademy.org`. The `links` prop on `CASLensProvider` handles this:

```tsx
<CASLensProvider
  apiBase="/api"
  links={{
    specimen: (id, collection) => `/my-detail-page/${id}`,
    story: (slug) => `/my-stories/${slug}`,
  }}
>
```

Any component that calls `useLinkBuilder()` will generate URLs using your functions instead of the defaults. See `search-tool/src/App.tsx` for a working example with a local specimen detail page.

## Before the package is published

These apps currently install `@calacademy-research/cas-lens` as a `file:` dependency pointing at the local `cas-lens/frontend` directory. Once the package is published to GitHub Packages, change the dependency in `package.json` to:

```json
"@calacademy-research/cas-lens": "^0.1.0"
```

And add a `.npmrc` with your GitHub token:

```
@calacademy-research:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

## Docs

- [Getting Started](docs/getting-started.md) — build your first app from scratch
- [API Reference](docs/api-reference.md) — all exports, hooks, types, and API endpoints
