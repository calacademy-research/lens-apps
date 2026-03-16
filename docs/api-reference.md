# CAS Lens Module Reference

Complete reference for all components, hooks, and types exported by `@calacademy-research/cas-lens`.

---

## Components

### CASLensProvider

Top-level provider that configures the API connection and data caching. Must wrap all other CAS Lens components.

```tsx
<CASLensProvider apiBase="https://collections.calacademy.org/api">
  {children}
</CASLensProvider>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `apiBase` | `string` | — | Base URL of the CAS Lens API |
| `config` | `ApiClientConfig` | — | Additional API config (timeouts, credentials, debug) |
| `queryClient` | `QueryClient` | internal | Custom React Query client, if your app already has one |

If your app already uses `@tanstack/react-query`, pass your existing `QueryClient` to avoid duplicate providers:

```tsx
<CASLensProvider apiBase="/api" queryClient={myQueryClient}>
```

---

### SpecimenMap

Interactive vector tile map displaying CAS specimens with clustering. Supports 1.4M+ specimens with smooth interaction.

```tsx
<SpecimenMap
  query="Actinopterygii"
  collection="ich"
  center={[-122.4, 37.8]}
  zoom={8}
  height="600px"
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `query` | `string` | — | Search query to filter specimens |
| `collection` | `string \| null` | `null` | Collection code (e.g., `'ich'`, `'botany'`). `null` = all |
| `center` | `[number, number]` | `[20, 0]` | Initial map center `[lng, lat]` |
| `zoom` | `number` | `2` | Initial zoom level |
| `height` | `string` | `'100vh'` | CSS height for the map container |
| `hasCoords` | `boolean` | `false` | Only show specimens with GPS coordinates |
| `hasImages` | `boolean` | `false` | Only show specimens with images |
| `excludedCollections` | `string[]` | `[]` | Collection codes to hide |
| `taxonId` | `string` | — | Taxon UUID for hierarchical filtering |
| `taxonName` | `string` | — | Display name for taxon filter |
| `taxonRank` | `string` | — | Rank label (e.g., `'family'`) |
| `onSpecimenClick` | `(id, collection) => void` | — | Callback when a specimen is clicked |
| `className` | `string` | — | Additional CSS classes |

**Requires:** `maplibre-gl` and `@vis.gl/react-maplibre` as peer dependencies. Import the MapLibre CSS in your app:

```tsx
import 'maplibre-gl/dist/maplibre-gl.css';
```

---

### SpecimenSearch

Searchable, sortable, paginated table of specimen records. Handles data fetching internally.

```tsx
<SpecimenSearch
  query="Iris"
  collection="botany"
  perPage={25}
  onPageChange={(page) => console.log('Page:', page)}
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `query` | `string` | — | Search query (required) |
| `collection` | `string \| null` | `null` | Collection code filter |
| `hasCoords` | `boolean` | `false` | Only show georeferenced specimens |
| `hasImages` | `boolean` | `false` | Only show specimens with images |
| `excludedCollections` | `string[]` | `[]` | Collection codes to exclude |
| `page` | `number` | `1` | Current page |
| `perPage` | `number` | `50` | Results per page |
| `onPageChange` | `(page: number) => void` | — | Called when user navigates pages |
| `onSpecimenClick` | `(specimen: Specimen) => void` | — | Called when a row is clicked |
| `taxonId` | `string` | — | Taxon UUID filter |
| `className` | `string` | — | Additional CSS classes |

---

### SpecimenDetailView

Full specimen detail page: images, map, taxonomy, collector links, editorial content, literature, and related stories.

```tsx
<SpecimenDetailView collection="ich" specimenId="246255" />
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `collection` | `string` | — | Collection code (required) |
| `specimenId` | `string` | — | Specimen ID (required) |
| `className` | `string` | — | Additional CSS classes |

**Requires:** `leaflet` and `react-leaflet` as peer dependencies. Import the Leaflet CSS:

```tsx
import 'leaflet/dist/leaflet.css';
```

---

## Hooks

These hooks can be used to build custom UI. Each works in two modes:
- **Inside SearchProvider:** delegates to the shared context
- **Standalone:** manages its own local state

### useSearchQuery

Search query and mode state.

```tsx
const {
  mode,            // 'express' | 'advanced' | 'allfields'
  setMode,
  query,           // current input text
  setQuery,
  submittedQuery,  // last submitted query
  submitQuery,     // (query: string) => void
  effectiveQuery,  // computed query string for API calls
  hasActiveSearch,  // boolean — is there an active search?
  advancedConditions,
  advancedMatchMode,
  advancedSubmitted,
  submitAdvancedSearch,
} = useSearchQuery({ initialQuery: 'shark' });
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialQuery` | `string` | `''` | Pre-populated query |
| `initialMode` | `SearchMode` | `'express'` | Initial search mode |

---

### useSearchFilters

All specimen filter state: collections, IUCN categories, type statuses, entity filters.

```tsx
const {
  hasCoords, setHasCoords,
  hasImages, setHasImages,
  excludedCollections, toggleExcludedCollection, setExcludedCollections, clearExcludedCollections,
  iucnCategories, setIucnCategories, clearIucnCategories,
  nsImperiled, setNsImperiled,
  typeStatuses, setTypeStatuses, clearTypeStatuses,
  taxonFilter, setTaxonFilter, clearTaxonFilter,
  expeditionFilter, setExpeditionFilter, clearExpeditionFilter,
  listFilter, setListFilter, clearListFilter,
  speciesFilter, setSpeciesFilter, clearSpeciesFilter,
  // boolean flags
  hasExcludedCollections, hasExpeditionFilter, hasListFilter,
  hasSpeciesFilter, hasTaxonFilter,
  // debounced version for API calls (300ms delay)
  debouncedExcludedCollections,
} = useSearchFilters({ excludedCollections: ['geo'] });
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `excludedCollections` | `string[]` | `[]` | Initial exclusions |
| `iucnCategories` | `string[]` | `[]` | Initial IUCN filter |
| `typeStatuses` | `string[]` | `[]` | Initial type status filter |
| `taxonFilter` | `TaxonFilter \| null` | `null` | Initial taxon filter |

---

### useMapState

Map viewport and bounding box state.

```tsx
const {
  mapView,          // { center: [lng, lat], zoom, mapLayer? }
  setMapView,
  resetMapView,
  boundingBox,      // BoundingBox | null
  setBoundingBox,
  clearBoundingBox,
  hasBoundingBox,
  viewportFromShareLink,
  clearViewportFromShareLink,
} = useMapState({ center: [-122.4, 37.8], zoom: 10 });
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `center` | `[number, number]` | `[20, 0]` | Initial center `[lng, lat]` |
| `zoom` | `number` | `2` | Initial zoom |
| `mapLayer` | `'street' \| 'satellite'` | `'street'` | Base layer |

---

### usePaginationState

Page and sort state.

```tsx
const {
  page,         // current page number
  setPage,
  sortField,    // column name or null
  sortOrder,    // 'asc' | 'desc'
  setSortField, // (field, order) => void — also resets page to 1
} = usePaginationState({ initialPage: 1 });
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialPage` | `number` | `1` | Starting page |
| `initialSortField` | `string \| null` | `null` | Default sort column |
| `initialSortOrder` | `'asc' \| 'desc'` | `'asc'` | Default sort direction |

---

## API Configuration

### configureApiClient

Configure the API client programmatically (alternative to `CASLensProvider`):

```tsx
import { configureApiClient } from '@calacademy-research/cas-lens';

configureApiClient({
  baseURL: 'https://collections.calacademy.org/api',
  timeoutMs: 30000,
  withCredentials: false,
});
```

### getApiClient

Get the underlying axios instance for custom API calls:

```tsx
import { getApiClient } from '@calacademy-research/cas-lens';

const client = getApiClient();
const response = await client.get('/collections');
```

### getApiConfig

Read the current resolved configuration:

```tsx
import { getApiConfig } from '@calacademy-research/cas-lens';

const config = getApiConfig();
console.log(config.baseURL, config.timeoutMs);
```

---

## Types

### Specimen

Core specimen record.

```typescript
interface Specimen {
  id: string;
  catalog_number: string;
  collection_code: string;
  scientific_name: string | null;
  accepted_name: string | null;
  taxon_class: string | null;
  taxon_order: string | null;
  taxon_family: string | null;
  taxon_genus: string | null;
  taxon_species: string | null;
  type_status: string | null;
  locality: string | null;
  country: string | null;
  state_province: string | null;
  latitude: number | null;
  longitude: number | null;
  verbatim_collector: string | null;
  year_collected: number | null;
  media: MediaItem[];
  // ... and many more fields
}
```

### Collection

```typescript
interface Collection {
  id: string;
  code: string;
  name: string;
  specimen_count: number;
}
```

### SearchResponse

```typescript
interface SearchResponse {
  query: string;
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  results: Specimen[];
  facets: SearchFacets | null;
  search_time_ms: number;
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
  name: string;       // e.g., "Formicidae"
  rank: string;       // e.g., "family"
}
```

### ApiClientConfig

```typescript
interface ApiClientConfig {
  baseURL?: string;
  timeoutMs?: number;          // default: 30000
  searchTimeoutMs?: number;    // default: 15000
  externalTimeoutMs?: number;  // default: 60000
  withCredentials?: boolean;   // default: true
  debug?: boolean;             // default: true in dev
}
```

---

## Collection codes

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

---

## Peer dependencies

These must be installed by the consuming app:

| Package | Version | Required for |
|---------|---------|-------------|
| `react` | ^18 | All components |
| `react-dom` | ^18 | All components |
| `react-router-dom` | ^6 | SpecimenMap, SpecimenDetailView |
| `@tanstack/react-query` | ^5 | All components (data caching) |
| `maplibre-gl` | ^5 | SpecimenMap |
| `@vis.gl/react-maplibre` | ^8 | SpecimenMap |
| `leaflet` | ^1.9 | SpecimenDetailView |
| `react-leaflet` | ^4 | SpecimenDetailView |

If you only use `SpecimenSearch`, you only need react, react-dom, and @tanstack/react-query.
