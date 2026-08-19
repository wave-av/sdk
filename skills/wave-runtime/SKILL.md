---
name: wave-runtime
description: Run inference through the WAVE runtime door (runtime.wave.online). Use when you need to list models, dispatch a prompt, or route a task through WAVE's one-runtime provider star — the OpenAI-compatible door any harness (Claude/opencode/dsh/Codex) can call.
---

# wave-runtime

One WAVE runtime underneath any harness. The door is OpenAI-compatible at `https://runtime.wave.online/v1`.

## Use (CLI)
```bash
wave models                  # list served models
wave complete "your prompt"  # one-shot completion
wave stream "your prompt"    # streamed completion
```

## Use (MCP tools)
- `wave_models` — list models.
- `wave_complete` — one-shot completion (`{ prompt, model? }`).

## Use (SDK)
```ts
import { RuntimeClient } from "@wave-av/sdk";
const c = new RuntimeClient({ baseUrl: "https://runtime.wave.online/v1", token: process.env.DISPATCH_PROOF_BEARER });
await c.models();
await c.complete({ messages: [{ role: "user", content: "hi" }] });
for await (const d of c.stream({ messages: [{ role: "user", content: "hi" }] })) { /* delta */ }
```

## Auth
- Models list is open. Completions need `Authorization: Bearer <DISPATCH_PROOF_BEARER>` (Doppler wave/prd). Never inline the token in a transcript.

## When to use
- Any time an agent needs model inference against WAVE's platform, rather than a raw provider. The door routes to the cheapest-adequate model in the provider star.
