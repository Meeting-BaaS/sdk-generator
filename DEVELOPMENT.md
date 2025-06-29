# Meeting BaaS SDK Development

This document contains development and contribution guidelines for the Meeting BaaS SDK v5.0.0.

## Prerequisites

- Node.js 18+
- pnpm

## Setup

1. Clone the repository

```bash
git clone https://github.com/meeting-baas/sdk-generator.git
cd sdk-generator
```

2. Install dependencies

```bash
pnpm install
```

## Build Process

The SDK build process consists of several steps, each with a specific purpose:

### 1. OpenAPI Client Generation

```bash
# Generate TypeScript client from OpenAPI spec
pnpm openapi:generate
```

This step:

- Cleans the `src/generated/` directory
- Fetches the latest OpenAPI spec from `https://api.meetingbaas.com/openapi.json`
- Generates TypeScript client code using Orval
- Creates API functions, Zod schemas, and MSW mocks
- Outputs organized by API tags (default, calendars, webhooks)

### 2. SDK Build

```bash
pnpm build
```

This step:

- Compiles the SDK using tsup
- Generates CommonJS, ESM, and TypeScript declaration files
- Outputs to `dist/` directory
- Creates tree-shakeable bundles

### 3. Testing

```bash
# Run all tests
pnpm test

# Run unit tests only
pnpm test:unit

# Run integration tests only
pnpm test:integration

# Run tests with coverage
pnpm test:coverage

# Run tests with UI
pnpm test:ui
```

### 4. Code Quality

```bash
# Lint and format code
pnpm lint

# Fix formatting issues
pnpm lint:fix
```

### 5. Publishing

```bash
# Prepare for publishing (runs lint and build)
pnpm prepublishOnly
```

## Common Workflows

### Complete Development Workflow

For a complete development cycle from OpenAPI spec to published package:

```bash
# 1. Update OpenAPI client
pnpm openapi:rebuild

# 2. Build the SDK
pnpm build

# 3. Run tests
pnpm test

# 4. Check code quality
pnpm lint

# 5. Publish (if ready)
pnpm publish
```

### Quick Development Workflow

For making changes to the SDK wrapper:

```bash
# 1. Make your changes to src/node/
# 2. Build the SDK
pnpm build

# 3. Run tests
pnpm test

# 4. Check code quality
pnpm lint
```

### OpenAPI Schema Updates

When the OpenAPI spec changes:

```bash
# 1. Regenerate from latest spec
pnpm openapi:rebuild

# 2. Review generated changes
git diff src/generated/

# 3. Update SDK wrapper if needed
# 4. Build and test
pnpm build && pnpm test
```

## Project Structure

```text
src/
├── generated/          # Generated OpenAPI client
│   ├── api/           # Generated API functions
│   │   ├── calendars/ # Calendar API functions
│   │   ├── default/   # Default API functions
│   │   └── webhooks/  # Webhook API functions
│   └── schema/        # Generated TypeScript types
├── node/              # SDK wrapper implementation
│   ├── api.ts         # API wrapper functions
│   ├── client.ts      # Main client factory
│   └── types.d.ts     # Configuration types
└── index.ts           # Main entry point

dist/                  # Built output
├── index.js           # CommonJS bundle
├── index.mjs          # ES Module bundle
└── index.d.ts         # TypeScript declarations

test/                  # Test files
├── unit/              # Unit tests
├── integration/       # Integration tests
├── setup.ts           # Test setup
└── error-handling.test.ts # Error handling tests

scripts/
├── preprocess.js      # OpenAPI preprocessing
└── ...                # Other build scripts
```

## Architecture Overview

### Code Generation

The SDK uses **Orval** for code generation from the OpenAPI specification:

- **API Functions**: Generated TypeScript functions for each endpoint
- **Zod Schemas**: Generated validation schemas for all parameters
- **MSW Mocks**: Generated mock handlers for testing
- **TypeScript Types**: Generated types for all API models

### SDK Wrapper

The SDK wrapper (`src/node/`) provides:

- **Client Factory**: `createBaasClient()` function for creating clients
- **API Wrapper**: Generic wrapper functions with error handling
- **Type Safety**: Discriminated union responses for type-safe error handling
- **Validation**: Automatic Zod schema validation for all parameters

### Error Handling

All API methods return discriminated union responses:

```typescript
type ApiResponse<T> = 
  | { success: true; data: T; error?: never }
  | { success: false; error: ZodError | Error; data?: never }
```

This provides:

- Type-safe error handling
- Automatic parameter validation
- Consistent error responses
- No need for try/catch blocks

## Testing Strategy

### Unit Tests

Unit tests focus on:
- Client creation and configuration
- Parameter validation
- Error handling
- Individual method behavior

### Integration Tests

Integration tests focus on:
- End-to-end API calls
- Real API responses
- Error scenarios
- Complex workflows

### Mock Strategy

Tests use MSW (Mock Service Worker) to:
- Mock API responses
- Test error scenarios
- Provide consistent test data
- Avoid real API calls during testing

## Code Quality

### Linting

The project uses **Biome** for:
- Code formatting
- Linting
- Type checking
- Import sorting

### TypeScript

- Strict TypeScript configuration
- Generated types from OpenAPI spec
- Full type coverage
- No `any` types

## Contributing

We welcome contributions to the Meeting BaaS SDK! Please feel free to submit issues or pull requests.

### Development Guidelines

1. **Code Style**: Follow the existing TypeScript code style
2. **Testing**: Add tests for new features
3. **Documentation**: Update both README.md and DEVELOPMENT.md as needed
4. **Commits**: Use conventional commits format

### Pull Request Process

1. Create a feature branch
2. Make your changes
3. Run tests and build
4. Submit a pull request

### Before Submitting

Ensure your changes pass:

```bash
# Run all checks
pnpm lint
pnpm build
pnpm test
pnpm test:coverage
```

## Environment Variables

No environment variables are required for development. The SDK uses the public OpenAPI specification.

## Troubleshooting

### Build Issues

If you encounter build issues:

1. Clean and rebuild:
   ```bash
   pnpm clean
   pnpm openapi:rebuild
   pnpm build
   ```

2. Check TypeScript errors:
   ```bash
   pnpm lint
   ```

3. Verify generated code:
   ```bash
   ls src/generated/
   ```

### Test Issues

If tests are failing:

1. Check mock setup:
   ```bash
   pnpm test:unit
   ```

2. Verify API responses:
   ```bash
   pnpm test:integration
   ```

3. Check test coverage:
   ```bash
   pnpm test:coverage
   ```

### Troubleshooting Automation

If the automation fails:

1. **Check Workflow Logs**: Review the failed workflow run
2. **Verify API Changes**: Ensure the OpenAPI spec is accessible
3. **Test Locally**: Run `pnpm openapi:rebuild` to verify SDK generation
4. **Manual Trigger**: Use manual dispatch to retry the workflow

## License

[MIT](LICENSE)

## 🤖 Automated Updates

This SDK automatically stays up-to-date with the Meeting BaaS API through our automated workflow:

- **Daily Checks**: Monitors the API specification for changes
- **Auto-Generation**: Regenerates the SDK when changes are detected
- **Multi-Node Testing**: Tests across Node.js versions 18, 19, 20, 21, and 22
- **Auto-Publishing**: Publishes new versions when all tests pass

### How It Works

1. **Daily at 2 AM UTC**: GitHub Actions checks for API changes
2. **Change Detection**: Compares current vs. previous OpenAPI specification
3. **SDK Regeneration**: If changes detected, regenerates TypeScript client
4. **Comprehensive Testing**: Runs full test suite across multiple Node versions
5. **Auto-Publish**: If all tests pass, bumps version and publishes to npm

### Benefits

- **Always Current**: SDK automatically reflects latest API changes
- **Zero Maintenance**: No manual intervention required
- **Quality Assured**: Only publishes if all tests pass
- **Multi-Platform**: Ensures compatibility across Node.js versions

### Manual Trigger

You can manually trigger the update process:
1. Go to the [Actions tab](https://github.com/meeting-baas/sdk-generator/actions)
2. Select "Auto Update SDK" workflow
3. Click "Run workflow"

### Workflow Structure

The automation uses three GitHub Actions workflows:

#### 1. `test-sdk.yml` (Reusable)

- **Purpose**: Reusable testing workflow
- **Inputs**: 
  - `node-versions`: Array of Node.js versions to test
  - `upload-coverage`: Whether to upload coverage artifacts
- **Used by**: Both `test.yml` and `auto-update.yml`

#### 2. `test.yml` (Regular Testing)

- **Triggers**: PRs, pushes to main/develop, manual dispatch
- **Uses**: `test-sdk.yml` with full coverage upload

#### 3. `auto-update.yml` (Auto Updates)

- **Triggers**: Daily schedule, manual dispatch
- **Uses**: `test-sdk.yml` without coverage upload (faster)
- **Flow**: Check changes → Test → Bump version → Publish → Create release

### Setup Requirements

To enable automated updates, ensure these GitHub secrets are configured:

- `NPM_TOKEN`: NPM authentication token for publishing
- `GITHUB_TOKEN`: GitHub token (automatically provided)

### Monitoring

- **Workflow Status**: Check the [Actions tab](https://github.com/meeting-baas/sdk-generator/actions)
- **Release History**: View [releases](https://github.com/meeting-baas/sdk-generator/releases)
- **NPM Package**: Monitor [npm package](https://www.npmjs.com/package/@meeting-baas/sdk)

### Troubleshooting Automation

If the automation fails:

1. **Check Workflow Logs**: Review the failed workflow run
2. **Verify API Changes**: Ensure the OpenAPI spec is accessible
3. **Test Locally**: Run `pnpm openapi:rebuild` to verify SDK generation
4. **Manual Trigger**: Use manual dispatch to retry the workflow
