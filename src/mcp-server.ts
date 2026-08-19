/**
 * wave-runtime MCP server — bin entry (compiles to dist/mcp-server.js, referenced by plugin.json).
 *
 * Reads WAVE_RUNTIME_URL / WAVE_RUNTIME_TOKEN from env, constructs a RuntimeClient, and runs the
 * stdio JSON-RPC loop. This is the process an MCP host spawns when it installs the wave-runtime
 * plugin.
 */
import { RuntimeClient } from "./runtime";
import { runMcpServer } from "./mcp";

async function main(): Promise<void> {
  const baseUrl = process.env.WAVE_RUNTIME_URL ?? "https://runtime.wave.online/v1";
  const token = process.env.WAVE_RUNTIME_TOKEN;
  const client = new RuntimeClient({ baseUrl, token });
  await runMcpServer(client);
}

main().catch((e) => {
  process.stderr.write(`wave-runtime MCP: ${e instanceof Error ? e.message : String(e)}\n`);
  process.exit(1);
});
