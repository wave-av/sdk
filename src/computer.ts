/**
 * WAVE Computer client — the SDK rung for the agent computer (the persistent Namespace devbox).
 *
 * Wraps the `devbox` CLI (the control surface for the agent computer): list / exec / ssh. The
 * devbox is the substrate; this client is the thin, typed shell-out an agent uses to run on it.
 * `devboxBin` is injectable so tests can point at a fake.
 */

import { spawnSync } from "node:child_process";

export interface Devbox {
  id: string;
  name: string;
  size: string;
  status?: string;
}

export interface ComputerExecResult {
  status: number;
  stdout: string;
  stderr: string;
}

export interface ComputerClientOptions {
  devboxBin?: string;
}

export class ComputerClient {
  private readonly devboxBin: string;

  constructor(opts: ComputerClientOptions = {}) {
    this.devboxBin = opts.devboxBin ?? "devbox";
  }

  private run(args: string[]): ComputerExecResult {
    const r = spawnSync(this.devboxBin, args, { encoding: "utf8" });
    return { status: r.status ?? -1, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
  }

  /** List the devboxes on the account (persistent agent computers). */
  list(): Devbox[] {
    const r = this.run(["list", "-o", "json"]);
    if (r.status !== 0) throw new Error(`computer list failed: ${r.stderr.trim()}`);
    try {
      const parsed = JSON.parse(r.stdout);
      return Array.isArray(parsed) ? (parsed as Devbox[]) : [];
    } catch {
      return [];
    }
  }

  /** Run a command on a devbox (non-interactive; recorded + re-readable via `devbox logs`). */
  exec(box: string, cmd: string): ComputerExecResult {
    return this.run(["exec", box, "--", cmd]);
  }

  /** Run a command over an interactive SSH session (TTY, stdin-forwarding). */
  ssh(box: string, cmd: string): ComputerExecResult {
    return this.run(["ssh", box, "--", cmd]);
  }
}
