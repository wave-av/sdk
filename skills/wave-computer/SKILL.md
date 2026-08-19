---
name: wave-computer
description: Use the WAVE agent computer — the persistent Namespace devbox (browser + terminal + DSH) an agent runs on, with durable sessions and artifacts. Use when an agent needs its own computer for computer-use tasks, or to inspect the devbox's state/sessions/artifacts.
---

# wave-computer

The persistent per-agent computer (wave-control / agent-computer-substrate). A dedicated Namespace devbox (`agent-computer`, id `lh93avfpmuadc`) with DSH (harness) + chromium (playwright) + a keep-alive marker, reproduced by a blueprint + custom base image.

## Use
- `devbox ssh agent-computer -- <cmd>` / `devbox exec agent-computer -- <cmd>` — run on the box.
- `devbox exec -d …` + `devbox logs …` — detached runs + output.
- Persistent sessions survive disconnect; data persists across pause/resume (auto-stop, not destroy).
- Keep-alive: files under `/.namespace/tasks` count as "active" (prevents auto-stop).

## When to use
- When an agent needs browser/terminal to act on a site with no API, or to run a long-lived job off the laptop. The box is the substrate; DSH is the harness; chromium is the hands.
