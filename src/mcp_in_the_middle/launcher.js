#!/usr/bin/env node
// Thin launcher: spawns `uv run python server.py` in the bundle directory,
// forwarding stdio so the MCP protocol flows through. All env vars
// (including user_config substitutions from the MCPB host) are inherited.

const { spawn } = require("child_process");
const path = require("path");

const bundleDir = path.resolve(__dirname, "..");
const serverPy = path.join(__dirname, "server.py");

const child = spawn("uv", ["run", "--directory", bundleDir, "python", serverPy], {
  stdio: ["pipe", "pipe", "inherit"],
  env: process.env,
});

process.stdin.pipe(child.stdin);
child.stdout.pipe(process.stdout);

child.on("exit", (code) => process.exit(code ?? 1));
process.on("SIGTERM", () => child.kill("SIGTERM"));
process.on("SIGINT", () => child.kill("SIGINT"));
