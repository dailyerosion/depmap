# depmap

The Interactive Map for [https://dailyerosion.org/map/](https://dailyerosion.org/map/)

[![Build and Test](https://github.com/akrherz/depmap/workflows/Build%20and%20Test/badge.svg)](https://github.com/akrherz/depmap/actions)
[![codecov](https://codecov.io/gh/akrherz/depmap/branch/main/graph/badge.svg)](https://codecov.io/gh/akrherz/depmap)

## Development

### Installation

```bash
npm install
```

### Running the Development Server

```bash
npm start
```

### Testing

```bash
# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Building

```bash
npm run build
```

## Deployment to DEP production

The build script should place the tree into the `depmap-releases` repo and push it to the main branch. This push triggers a webhook at our hoster that then updates the website.
