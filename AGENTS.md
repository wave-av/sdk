# AGENTS.md — wave-av/sdk

Agent contract for this repo. Inherits the org default (<https://github.com/wave-av/.github/blob/main/AGENTS.md>) and the [repo-governance standard](https://github.com/wave-av/wave-foundation/blob/master/frameworks/repo-governance/governance-matrix.md).

## Build and test

See `README.md` for setup. Run the repo's lint / typecheck / test before opening a PR, and fix what you broke.

## Rules

- Branch and open a PR; never push to the default branch. All required gates must pass before merge.
- No secrets in commits — secret-scan is a required gate and will block.
- Conventional Commit titles; update `CHANGELOG.md` (`Unreleased`) for user-facing changes.
- Match the existing code conventions; keep files focused (~200-500 lines).

## Security

Report vulnerabilities via the [Security Policy](https://github.com/wave-av/.github/blob/main/SECURITY.md) (security@wave.online) — never in a public issue.

## Cursor Cloud specific instructions

- This repo is a **pure TypeScript SDK library** (`@wave-av/sdk`) — there is no long-running server/app to launch. "Running it" means building the package and consuming it. Dev/lint/test/build commands live in `package.json` `scripts`.
- **Use npm, not pnpm.** The lockfile is `package-lock.json` and CI uses `npm ci`. `CONTRIBUTING.md` references `pnpm` and a `build:types` script that do not exist here — ignore those; the real scripts are `build`, `dev`, `lint`, `test`, `type-check`.
- `npm run dev` is a `tsup` watch build (rebuilds `dist/` on change), not a dev server. `npm run build` emits both CJS (`dist/*.js`) and ESM (`dist/*.mjs`) plus `.d.ts` types.
- The SDK talks to the WAVE API over HTTPS (`https://api.wave.online`); no API key or backend is available in this environment. To exercise it end to end, point `baseUrl` at a local mock HTTP server and drive `new Wave({ apiKey, baseUrl })` (e.g. `wave.pipeline.create()` / `wave.voice.synthesize()`) — the base `WaveClient` handles auth headers, retries, and error typing (`WaveError`).
- `zod` is a peer dependency but is pinned as a dev dependency (v4.x) so type-check/tests resolve it; `@opentelemetry/api` is an optional peer (telemetry is opt-in).
