import { describe, expect, it } from "vitest";
import { writeFileSync, chmodSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { ComputerClient } from "../computer";

function fakeDevbox(): string {
  // A fake `devbox` that honors the exact args the client sends, for deterministic tests.
  const dir = join(tmpdir(), `fake-devbox-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  const p = join(dir, "devbox");
  const script = `#!/bin/bash
if [ "$1" = "list" ] && [ "$2" = "-o" ] && [ "$3" = "json" ]; then
  echo '[{"id":"lh93avfpmuadc","name":"agent-computer","size":"S"}]'
elif [ "$1" = "exec" ]; then
  shift 3
  echo "exec:$*"
elif [ "$1" = "ssh" ]; then
  shift 3
  echo "ssh:$*"
else
  echo "unknown" >&2; exit 2
fi
`;
  writeFileSync(p, script);
  chmodSync(p, 0o755);
  return p;
}

describe("ComputerClient", () => {
  it("lists devboxes from `devbox list -o json`", () => {
    const c = new ComputerClient({ devboxBin: fakeDevbox() });
    expect(c.list()).toEqual([{ id: "lh93avfpmuadc", name: "agent-computer", size: "S" }]);
  });

  it("exec runs `devbox exec <box> -- <cmd>`", () => {
    const c = new ComputerClient({ devboxBin: fakeDevbox() });
    const r = c.exec("agent-computer", "uname -a");
    expect(r.stdout).toContain("exec:uname -a");
    expect(r.status).toBe(0);
  });

  it("ssh runs `devbox ssh <box> -- <cmd>`", () => {
    const c = new ComputerClient({ devboxBin: fakeDevbox() });
    const r = c.ssh("agent-computer", "ls");
    expect(r.stdout).toContain("ssh:ls");
  });

  it("throws when list fails (non-zero exit)", () => {
    const dir = join(tmpdir(), `fake-devbox-fail-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
    const p = join(dir, "devbox");
    writeFileSync(p, "#!/bin/bash\nexit 1\n");
    chmodSync(p, 0o755);
    const c = new ComputerClient({ devboxBin: p });
    expect(() => c.list()).toThrow(/computer list failed/);
  });
});
