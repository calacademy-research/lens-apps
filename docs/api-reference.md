# API Reference

Everything exported by `@calacademy-research/cas-lens`.

---

## Provider

### CASLensProvider

Sets up the API connection, data caching, and link routing. Wrap your app in this.

```tsx
<CASLensProvider apiBase="/api" links={{ specimen: (id) => `/detail/${id}` }}>
  {children}
</CASLensProvider>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `apiBase` | `string` | required | API base URL (use `/api` with a Vite proxy) |
| `links` | `LinkBuilder` | CAS production URLs | Override entity link URLs (see below) |
| `config` | `ApiClientConfig` | — | Timeout, credential, and debug overrides |
| `queryClient` | `QueryClient` | internal | Your own React Query client, if you have one |

---

## Link Builder

### useLinkBuilder

Hook that returns link functions configured on the provider. Use it to generate entity URLs that stay within your app.

```tsx
import { useLinkBuilder } from '@calacademy-research/cas-lens';

function MyComponent() {
  const links = useLinkBuilder();

  // Returns "/detail/abc-123" if you configured specimen links,
  // or "https://collections.calacademy.org/ich/specimen/abc-123" by default
  const url = links.specimen('abc-123', 'ich');
}
```

### LinkBuilder interface

```typescript
interface LinkBuilder {
  specimen?: (id: string, collection: string) => string;
  story?: (slug: string) => string;
  lesson?: (slug: string) => string;
  literature?: (slug: string) => string;
  person?: (slug: string) => string;
  expedition?: (id: string) => string;
  taxon?: (id: string) => string;
  collection?: (code: string) => string;
}
```

Only set the ones you need. Missing keys fall back to `https://collections.calacademy.org/...`.

---

## API Client

### configureApiClient

Configure the API client before any calls (alternative to using CASLensProvider):

```tsx
import { configureApiClient } from '@calacademy-research/cas-lens';

configureApiClient({ baseURL: '/api', timeoutMs: 15000 });
```

### getApiClient

Get the axios instance for direct API calls:

```tsx
import { getApiClient } from '@calacademy-research/cas-lens';

const client = getApiClient();
const { data } = await client.get('/search', { params: { q: 'iris' } });
```

### getApiConfig

Read current configuration:

```tsx
import { getApiConfig } from '@calacademy-research/cas-lens';

const config = getApiConfig();
// config.baseURL, config.timeoutMs, etc.
```

### ApiClientConfig

```typescript
interface ApiClientConfig {
  baseURL?: string;           // default: '/api'
  timeoutMs?: number;         // default: 30000
  searchTimeoutMs?: number;   // default: 15000
  externalTimeoutMs?: number; // default: 60000
  withCredentials?: boolean;  // default: true
  debug?: boolean;            // default: true in dev
}
```

---

## Hooks

State management hooks that work standalone or inside the CAS Lens SearchProvider. For most external apps, use them standalone.

### useSearchQuery

Search mode, query text, and submit state.

```tsx
const {
  query, setQuery,
  submittedQuery,
  submitQuery,          // (q: string) => void
  effectiveQuery,       // computed query for API calls
  hasActiveSearch,      // boolean
  mode, setMode,        // 'express' | 'advanced' | 'allfields'
  advancedConditions,
  advancedMatchMode,
  submitAdvancedSearch,
} = useSearchQuery({ initialQuery: 'shark' });
```

### useSearchFilters

All filter state: collections, IUCN, type status, entity filters.

```tsx
const {
  hasCoords, setHasCoords,
  hasImages, setHasImages,
  excludedCollections, toggleExcludedCollection,
  iucnCategories, setIucnCategories,
  taxonFilter, setTaxonFilter,
  // ... and more
} = useSearchFilters();
```

### useMapState

Map viewport and bounding box.

```tsx
const {
  mapView, setMapView, resetMapView,
  boundingBox, setBoundingBox, clearBoundingBox,
  hasBoundingBox,
} = useMapState({ center: [-122.4, 37.8], zoom: 10 });
```

### usePaginationState

Page and sort state.

```tsx
const {
  page, setPage,
  sortField, sortOrder, setSortField,
} = usePaginationState();
```

---

## API Endpoints

These are the CAS Lens API endpoints used by the example apps. Call them via `getApiClient().get(path, { params })`.

### Specimens

| Endpoint | Method | Params | Returns |
|----------|--------|--------|---------|
| `/search` | GET | `q`, `collection`, `page`, `per_page`, `sort_by`, `has_images`, `has_coords`, `taxon_id` | `{ results: Specimen[], total, page, per_page, total_pages }` |
| `/specimens/{uuid}` | GET | — | `Specimen` |

### Stories

| Endpoint | Method | Params | Returns |
|----------|--------|--------|---------|
| `/stories` | GET | `page`, `per_page`, `content_type` | `{ stories: Story[], total, page, per_page }` |

Use `content_type=lesson_plan` to get only lesson plans.

### Literature

| Endpoint | Method | Params | Returns |
|----------|--------|--------|---------|
| `/literature` | GET | `page`, `per_page`, `q` | `{ items: Paper[], total, page, per_page, total_pages }` |

Note: literature returns `items`, not `results`.

### Collections

| Endpoint | Method | Returns |
|----------|--------|---------|
| `/collections` | GET | `Collection[]` |

### Vector Tiles

| Endpoint | Returns |
|----------|---------|
| `/tiles/{collection}/{z}/{x}/{y}.pbf` | Protobuf vector tile |

Use `all` as the collection for all specimens.

---

## Types

### Specimen

```typescript
interface Specimen {
  id: string;                          // UUID
  catalog_number: string;
  collection_code: string;             // 'ich', 'botany', etc.
  scientific_name: string | null;
  accepted_name: string | null;
  common_name: string | null;
  taxon_class: string | null;
  taxon_order: string | null;
  taxon_family: string | null;
  taxon_genus: string | null;
  taxon_species: string | null;
  type_status: string | null;          // 'Holotype', 'Paratype', etc.
  locality: string | null;
  country: string | null;
  state_province: string | null;
  latitude: number | null;
  longitude: number | null;
  verbatim_collector: string | null;
  year_collected: number | null;
  determined_by: string | null;
  iucn_category: string | null;        // 'CR', 'EN', 'VU', etc.
  media: MediaItem[];
}
```

### MediaItem

```typescript
interface MediaItem {
  url: string;
  type: 'image' | '3d_model';
  label?: string;
}
```

### BoundingBox

```typescript
interface BoundingBox {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
}
```

### MapViewState

```typescript
interface MapViewState {
  center: [number, number];  // [lng, lat]
  zoom: number;
  mapLayer?: 'street' | 'satellite';
}
```

### TaxonFilter

```typescript
interface TaxonFilter {
  taxon_id: string;   // UUID
  name: string;       // display name
  rank: string;       // 'family', 'order', etc.
}
```

---

## Collection Codes

| Code | Collection |
|------|------------|
| `ich` | Ichthyology |
| `herp` | Herpetology |
| `orn` | Ornithology |
| `mam` | Mammalogy |
| `ent` | Entomology |
| `botany` | Botany |
| `iz` | Invertebrate Zoology |
| `geo` | Geology |
| `anthro` | Anthropology |
| `antweb` | AntWeb |
