# Contributing to @wave-av/sdk

Thanks for your interest in contributing to the WAVE TypeScript SDK.

## Getting started

1. Fork this repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes
4. Run type check: `pnpm type-check`
5. Run tests: `pnpm test`
6. Commit with a descriptive message
7. Open a pull request against `main`

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Type check
pnpm type-check

# Generate types
pnpm build:types
```

## Code standards

- TypeScript strict mode (no `any`, no `@ts-ignore`)
- All API methods must have JSDoc with permission requirements
- All public types must be exported from the package root
- Error handling must use `WaveError` hierarchy
- All external API calls must support retry and rate limiting

## Pull request guidelines

- One logical change per PR
- Update docs if adding new API modules
- All CI checks must pass before merge

## Reporting issues

- Use GitHub Issues for bugs and feature requests
- For security issues, see [SECURITY.md](SECURITY.md)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
