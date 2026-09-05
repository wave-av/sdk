/**
 * CAP-001 — capabilities.json's `exposes.sdk` must match the real, live export surface of
 * this package: every namespace instantiated on the `Wave` aggregate client, and every other
 * runtime export from the barrel (`src/index.ts`) that is NOT one of those namespaces' own
 * class/factory pair.
 *
 * Before this test, capabilities.json had NO `exposes` block at all — every consumer of the
 * manifest (docs generation, capability-discovery machinery, another agent deciding what this
 * SDK can do) read nothing, while the package actually ships 42 aggregate namespaces (`wave.clips`,
 * `wave.voice`, ... ) plus 27 further exports that exist only as standalone imports
 * (`WaveClient`, `RuntimeClient`, `handleMcpMessage`, the agent-auth ceremony functions, etc.).
 *
 * This is ENUMERATION, not transcription: both lists below come from actually instantiating
 * `Wave` and reading its real, live properties/constructor names, and from actually importing
 * the barrel and reading `Object.keys()` — not from grepping or hand-copying names out of
 * `src/index.ts`. A future namespace or top-level export that's added/removed without updating
 * capabilities.json fails this test in either direction.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import * as SDK from "../index";
import { Wave } from "../index";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface CapabilitiesFile {
  exposes?: {
    sdk?: {
      aggregateNamespaces?: Array<{ name: string; className: string }>;
      offAggregateExports?: string[];
    };
  };
}

function readCapabilities(): CapabilitiesFile {
  return JSON.parse(
    readFileSync(join(__dirname, "..", "..", "capabilities.json"), "utf-8"),
  ) as CapabilitiesFile;
}

/** The real namespaces `Wave` instantiates, derived by instantiating it and reading its own
 * instance properties + their constructors — never a hardcoded list. */
function realAggregateNamespaces(): Array<{ name: string; className: string }> {
  const wave = new Wave({ apiKey: "cap-001-test-key" });
  return Object.keys(wave)
    .filter((key) => key !== "client")
    .sort()
    .map((name) => {
      const instance = (wave as unknown as Record<string, unknown>)[name];
      const className = (instance as { constructor: { name: string } }).constructor.name;
      return { name, className };
    });
}

/** Every barrel export that is NOT the aggregate itself and NOT one of a namespace's own
 * class/`create<Class>` factory pair. Derived from the real `Wave` instance (for the pairs to
 * exclude) and the real barrel (`import * as SDK`) — never a hardcoded list. */
function realOffAggregateExports(namespaces: Array<{ className: string }>): string[] {
  const moduleExports = new Set(Object.keys(SDK));
  const exclude = new Set<string>(["Wave", "createWave", "default"]);
  for (const { className } of namespaces) {
    exclude.add(className);
    exclude.add(`create${className}`);
  }
  return [...moduleExports].filter((name) => !exclude.has(name)).sort();
}

describe("CAP-001: capabilities.json exposes matches the real SDK export surface", () => {
  it("declares every aggregate namespace Wave actually instantiates, and nothing else", () => {
    const capabilities = readCapabilities();
    const declared = [...(capabilities.exposes?.sdk?.aggregateNamespaces ?? [])]
      .map((n) => `${n.name}:${n.className}`)
      .sort();

    const real = realAggregateNamespaces()
      .map((n) => `${n.name}:${n.className}`)
      .sort();

    expect(declared).toEqual(real);
  });

  it("declares every off-aggregate export, and nothing else", () => {
    const capabilities = readCapabilities();
    const declared = [...(capabilities.exposes?.sdk?.offAggregateExports ?? [])].sort();

    const namespaces = realAggregateNamespaces();
    const real = realOffAggregateExports(namespaces);

    expect(declared).toEqual(real);
  });

  it("has no overlap between aggregateNamespaces class names and offAggregateExports", () => {
    const capabilities = readCapabilities();
    const namespaceClasses = new Set(
      (capabilities.exposes?.sdk?.aggregateNamespaces ?? []).map((n) => n.className),
    );
    const offAggregate = capabilities.exposes?.sdk?.offAggregateExports ?? [];
    for (const name of offAggregate) {
      expect(namespaceClasses.has(name), `${name} is both a namespace class and off-aggregate`).toBe(
        false,
      );
    }
  });
});
