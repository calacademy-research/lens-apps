# CAS Lens Example Apps

Three example apps demonstrating how to use `@calacademy-research/cas-lens` standalone components.

## Apps

| App | Description | Components used |
|-----|-------------|-----------------|
| `map-explorer/` | Interactive specimen map with collection filtering | `<SpecimenMap>` |
| `search-tool/` | Searchable specimen table with pagination | `<SpecimenSearch>` |
| `specimen-viewer/` | Detail page for a single specimen | `<SpecimenDetailView>` |

## Setup

Each app is an independent Vite + React project. To run any of them:

```bash
cd map-explorer   # or search-tool, specimen-viewer
npm install
npm run dev
```

Then open http://localhost:5173.

## Prerequisites

These apps consume `@calacademy-research/cas-lens` from GitHub Packages. To install it, you need a GitHub token with `read:packages` scope.

Create a `.npmrc` in the app directory (already included):

```
@calacademy-research:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Set the token:

```bash
export GITHUB_TOKEN=ghp_your_token_here
```

## Local development (before package is published)

To develop against a local copy of cas-lens instead of the published package:

```bash
# In the cas-lens repo
cd frontend
npm run build:lib

# In the example app
npm install ../../cas-lens/frontend
```

This installs the local build as a file dependency.
