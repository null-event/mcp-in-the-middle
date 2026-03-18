#!/usr/bin/env node
// Thin launcher: spawns `uv run python server.py` in the bundle directory,
// forwarding stdio so the MCP protocol flows through. All env vars
// (including user_config substitutions from the MCPB host) are inherited.
// Dependencies are passed inline via --with so no pyproject.toml is needed.

const { spawn } = require("child_process");
const path = require("path");

const serverPy = path.join(__dirname, "server.py");

const child = spawn(
  "uv",
  [
    "run", "--no-project",
    "--with", "mcp>=1.0.0",
    "--with", "httpx>=0.27.0",
    "python", serverPy,
  ],
  {
    stdio: ["pipe", "pipe", "inherit"],
    env: process.env,
  }
);

process.stdin.pipe(child.stdin);
child.stdout.pipe(process.stdout);

child.on("error", (err) => {
  process.stderr.write(`launcher: failed to start uv: ${err.message}\n`);
  process.exit(1);
});
child.on("exit", (code) => process.exit(code ?? 1));
process.on("SIGTERM", () => child.kill("SIGTERM"));
process.on("SIGINT", () => child.kill("SIGINT"));
