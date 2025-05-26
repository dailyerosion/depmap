# Test Configuration Documentation

## Test Structure

The test suite is organized using Vitest with the following structure:

```
src/test/
├── setup.js                 # Global test setup and mocks
├── *.test.js                # Individual test files
└── __fixtures__/            # Test fixtures and mock data (future)
```

## Test Categories

### Unit Tests
- `state.test.js` - State management system
- `dateUtils.test.js` - Date utility functions
- `constants.test.js` - Application constants validation
- `bootstrapComponents.test.js` - Bootstrap component initialization
- `toaster.test.js` - Toast notification system
- `urlHandler.test.js` - URL parameter handling

### Integration Tests
- `main.test.js` - Main application integration

## Coverage Thresholds

The project maintains the following minimum coverage thresholds:
- **Branches**: 60%
- **Functions**: 60%
- **Lines**: 60%
- **Statements**: 60%

## Test Commands

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui

# Run specific test file
npx vitest src/test/state.test.js

# Run tests in watch mode
npx vitest --watch
```

## Mocking Strategy

### External Dependencies
- **Bootstrap**: Mocked to return mock component instances
- **OpenLayers**: Mocked for map-related functionality
- **DOM APIs**: Mocked using jsdom environment with custom implementations

### Internal Modules
- **State management**: Mocked to control state during tests
- **Network requests**: Mocked using Vitest's `vi.fn()`

## Test File Naming

- Test files should end with `.test.js`
- Test files should be located in `src/test/`
- Test file names should match the module they're testing

## Writing New Tests

When adding new functionality:

1. Create corresponding test file in `src/test/`
2. Mock external dependencies
3. Test both success and error cases
4. Maintain or improve coverage thresholds
5. Update this documentation if needed

## CI/CD Integration

Tests run automatically on:
- Push to main branch
- Pull request creation/updates
- Coverage reports are uploaded to Codecov

## Debugging Tests

```bash
# Run single test in debug mode
npx vitest --run --reporter=verbose src/test/specific.test.js

# View coverage report
npm run test:coverage && open coverage/index.html
```
