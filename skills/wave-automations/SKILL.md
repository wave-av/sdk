---
name: wave-automations
description: Work with WAVE event-triggered automations — match + dispatch jobs from Slack/GitHub/webhook/Linear/PagerDuty events, with a narrow allow-list filter and a bounded tool list. Use when wiring an event to a job, or inspecting what fires.
---

# wave-automations

Event-driven automations on top of the launchd/cron registry. A job gains an optional `trigger` block: `source` (connector), `match` (narrow allow-list filter — never a catch-all "every message" listener), `tools` (bounded action list), `scope` (private | team-visible | team-owned).

## Use
- Public webhook endpoint: `https://automations.wave.online/` (Cloudflare Tunnel → local dispatch server on `:8899`).
- GitHub webhook registered on `wave-av/claude-workstation` (issues / push / issue_comment).
- Core: `eventMatches(event, match)` + `dispatchTriggerJob(job)` + `handleWebhook(event, jobs)` in `governance/automation-registry/lib/`.

## When to use
- To fire a job on a Slack message / GitHub event / webhook, declare a `trigger:` block on the registry job, then post the event to the endpoint. An empty `match` NEVER matches — no broad listeners.
