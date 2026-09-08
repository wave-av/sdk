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

## Agent-authored pull requests

This repo accepts PRs opened by an AI coding agent (e.g. a Cursor Cloud Agent session), scoped today
to docs/config-only changes. These carry the same review bar as a person-authored PR — never relaxed
because CI is green or the diff is small — plus a few controls specific to agent authorship:

- **Reviewer:** Jake (repo owner) reads and approves every agent-authored PR before merge.
- **Turnaround:** reviewed within 2 business days of opening. If that slips, the PR states so in a
  comment rather than sitting silently stale.
- **No auto-merge, no bot approval, no self-approval:** a green check or a bot's "approve" is never
  sufficient on its own to merge an agent-authored PR. A human reads the diff and merges by hand.
- **Draft status is never lifted by automation** — only a human reviewer marks an agent PR ready.
- **Stale-close:** an agent-authored PR with no review activity for 14 days is closed with a comment
  explaining why, rather than left open indefinitely.
- **Compensating control for the audit-log gap:** the agent platform's own audit log does not capture
  prompt text, terminal commands, or tool-call arguments — only the resulting diff. Because of that
  gap, the reviewer reads the **full diff**, not a summary the agent wrote about its own change, and
  does not treat the agent's PR description as a substitute for reading the code.

## Reporting issues

- Use GitHub Issues for bugs and feature requests
- For security issues, see [SECURITY.md](SECURITY.md)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
