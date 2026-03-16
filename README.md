# Lens Apps

Example apps built on top of [CAS Lens](https://github.com/calacademy-research/cas-lens), the California Academy of Sciences collections platform.

## Why this exists

CAS Lens covers specimens, maps, stories, lesson plans, literature, expeditions, and more. Different groups at the institution will want to build focused tools around parts of that — a lesson plan finder for educators, a taxon-specific map for a research project, a dashboard for a department. These tools will have their own way of presenting the data, and they'll often need to layer on information that doesn't belong in CAS Lens itself because it doesn't fit the general-purpose model.

The API takes care of data islands — everything reads from the same live source, so there's nothing to sync. But data alone isn't that useful. The harder work is search state management, map rendering at scale, filter logic, pagination, URL routing. CAS Lens already has working code for all of that. This package lets you pull in as much or as little of it as you need.

## What you can use

**State management.** The hooks `useSearchQuery`, `useSearchFilters`, `useMapState`, and `usePaginationState` handle search, filtering, and pagination state. They deal with debouncing, page resets on filter changes, and query construction from structured conditions.

**Vector tiles.** The CAS tile server serves pre-clustered tiles for 1.4M+ specimens. The `map-explorer` app renders them with MapLibre GL in about 200 lines.

**Link routing.** The link builder lets you redirect entity links (specimens, stories, papers) to pages in your app instead of `collections.calacademy.org`. The `search-tool` shows this with a local specimen detail page.

Each example app uses a different combination. If you can write Python, you can read this code — same concepts, different language.

## What these apps look like

### search-tool — Specimen search with local detail pages

Search across 1.4 million specimens. Click any catalog number to see a detail page that lives within your app, not on the CAS website.

![Search results for "iris" showing a table of Botany specimens](docs/screenshots/search-results.png)

Click a specimen to see your own detail page with taxonomy, collection info, and images:

![Detail page showing an Iris herbarium sheet with taxonomy and locality](docs/screenshots/search-detail.png)

### map-explorer — Interactive map

All specimens plotted on a map using vector tiles. Click collection pills to filter by department.

![World map with collection filter pills](docs/screenshots/map-explorer.png)

### specimen-viewer — Specimen detail

Look up any specimen by UUID and see its full record — taxonomy, collector, locality, coordinates, images, and conservation status.

![Specimen detail page showing Latimeria chalumnae (Coelacanth)](docs/screenshots/specimen-viewer.png)

### stories-browser — Stories and narratives

Browse published stories from CAS — scientific narratives with images, themes, and editorial content.

![Grid of story cards with images and titles](docs/screenshots/stories-browser.png)

### lessons-browser — Lesson plans

Browse educational lesson plans from CAS, filterable by grade level and subject.

![Three lesson plan cards](docs/screenshots/lessons-browser.png)

### papers-browser — Scientific literature

Search and browse 1,300+ scientific papers published by CAS researchers, with DOI links.

![List of papers with titles, authors, years, and journals](docs/screenshots/papers-browser.png)

## Concepts for non-web developers

If you're coming from Python or another language, here's a quick orientation.

### What is React?

React is a JavaScript library for building user interfaces. Instead of generating HTML on a server (like Flask or Django templates), React runs in the browser and builds the page dynamically. You write **components** — functions that return what the UI should look like — and React keeps the screen in sync with your data.

```tsx
// A React component is just a function that returns markup
function Greeting({ name }) {
  return <h1>Hello, {name}</h1>;
}
```

### What is Vite?

Vite is the development server. It's the equivalent of `python -m http.server` but for React apps — it serves your code to the browser, watches for changes, and reloads automatically. You start it with `npm run dev`.

### What is an API call?

Same as in Python. The CAS API is a REST service at `collections.calacademy.org/api`. Instead of `requests.get()`, JavaScript uses `axios` or `fetch()`:

```python
# Python
response = requests.get('https://collections.calacademy.org/api/search', params={'q': 'iris'})
data = response.json()
```

```tsx
// JavaScript (what these apps do)
const client = getApiClient();
const response = await client.get('/search', { params: { q: 'iris' } });
const data = response.data;
```

### What is a "proxy"?

Browsers block requests from `localhost` to `collections.calacademy.org` for security reasons (this is called CORS). The proxy is a workaround: your dev server intercepts requests to `/api` and forwards them to the real server. Your code calls `/api/search` and the dev server turns that into `https://collections.calacademy.org/api/search` behind the scenes. This is configured in `vite.config.ts`.

### What is npm?

npm is the package manager for JavaScript — like `pip` for Python. `npm install` installs dependencies (like `pip install -r requirements.txt`), and `npm run dev` runs the development server.

### What is TypeScript?

TypeScript is JavaScript with type annotations. If you've used Python type hints (`def search(query: str) -> list[Specimen]:`), it's the same idea. The `.tsx` file extension means TypeScript + JSX (the HTML-like syntax React uses).

## How the apps work

Every app follows the same pattern:

1. **Wrap your app in `CASLensProvider`** — this sets up the API connection
2. **Pull in what you need** — data via `getApiClient()`, state via hooks, tiles via URL
3. **Render it your way** — your code, your layout, your design

```tsx
import { CASLensProvider, getApiClient } from '@calacademy-research/cas-lens';

export default function App() {
  return (
    <CASLensProvider apiBase="/api">
      <MyComponent />
    </CASLensProvider>
  );
}

function MyComponent() {
  // getApiClient() returns an HTTP client, like requests.Session() in Python
  const client = getApiClient();
  // Now call any CAS API endpoint
}
```

The same principle applies to behavior, not just data. Instead of reimplementing search state management or filter logic, you import `useSearchQuery()` and get the same logic the main app uses. When it's improved, your app gets the improvement.

### Link builder

When your app displays CAS data, you want clicks to navigate within your app — not to `collections.calacademy.org`. The `links` prop on `CASLensProvider` controls this:

```tsx
<CASLensProvider
  apiBase="/api"
  links={{
    // When anything in the app generates a specimen link,
    // use this URL pattern instead of the CAS default
    specimen: (id, collection) => `/my-page/${id}`,
  }}
>
```

The `search-tool` app demonstrates this end to end: search results link to a local detail page at `/specimen/:id` instead of the CAS website.

## Running an app

```bash
# 1. Clone this repo
git clone git@github.com:calacademy-research/lens-apps.git
cd lens-apps

# 2. Pick an app and install its dependencies
cd search-tool
npm install

# 3. Start the development server
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

Each app is independent. They don't share dependencies or state. You can run multiple apps at once on different ports.

## Project structure

```
lens-apps/
├── search-tool/          ← specimen search + local detail pages
│   ├── src/App.tsx        ← all the app code (one file)
│   ├── vite.config.ts     ← dev server config with API proxy
│   ├── package.json       ← dependencies
│   └── index.html         ← entry point
├── map-explorer/         ← interactive vector tile map
├── specimen-viewer/      ← specimen detail lookup
├── stories-browser/      ← CAS stories card grid
├── lessons-browser/      ← lesson plans card grid
├── papers-browser/       ← searchable literature list
└── docs/
    ├── getting-started.md ← build your first app from scratch
    ├── api-reference.md   ← all exports, endpoints, and types
    └── screenshots/       ← app screenshots
```

Each app is a single `App.tsx` file (80-250 lines) plus boilerplate config files. The `App.tsx` is the only file you need to read to understand what the app does.

## Available API endpoints

These are the CAS API endpoints the apps use. All return JSON.

| Endpoint | What it returns | Example app |
|----------|----------------|-------------|
| `/api/search?q=iris&per_page=25` | Specimen search results | search-tool |
| `/api/specimens/{uuid}` | Single specimen record | specimen-viewer, search-tool |
| `/api/stories?page=1&per_page=12` | Published stories | stories-browser |
| `/api/stories?content_type=lesson_plan` | Lesson plans | lessons-browser |
| `/api/literature?page=1&per_page=20&q=coral` | Scientific papers | papers-browser |
| `/api/collections` | List of all collections | any |
| `/tiles/{collection}/{z}/{x}/{y}.pbf` | Vector map tiles | map-explorer |

## Further reading

- [Getting Started](docs/getting-started.md) — build your first app from scratch, step by step
- [API Reference](docs/api-reference.md) — all exports, hooks, types, endpoints, and collection codes
- [CAS Lens](https://github.com/calacademy-research/cas-lens) — the main CAS Lens project this builds on
