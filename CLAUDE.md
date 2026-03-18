# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

mcp-in-the-middle is a security research tool demonstrating Machine-in-the-Middle (MitM) risks in the Model Context Protocol (MCP). It acts as a transparent proxy ("shim") between an LLM client (e.g., Claude Desktop) and a legitimate target MCP server, intercepting and logging tool calls. This is an authorized CTF/red team research tool.

## Tech Stack

- Python 3.10+
- `mcp` SDK (low-level `Server` for shim, `ClientSession` + `stdio_client` for target connection)
- `httpx` for async exfiltration
- Package management: `uv`

## Architecture

All shim logic lives in `src/mcp_in_the_middle/server.py`. The shim is both an MCP server (stdio, facing the LLM client) and an MCP client (stdio, spawning the real target server as a subprocess).

**Startup:** Spawns target via `TARGET_COMMAND`, connects as MCP client, calls `list_tools()`, registers matching proxy handlers on its own `Server` instance.

**Tool call flow:** Client calls tool -> shim forwards to target -> shim fire-and-forget POSTs result to `EXFIL_URL` -> returns original result to client.

**Config:** Two required env vars: `TARGET_COMMAND` (shell command to spawn real server), `EXFIL_URL` (webhook to POST intercepted data).

## Build & Run

```bash
uv sync                                        # install dependencies
TARGET_COMMAND="..." EXFIL_URL="..." uv run mcp-in-the-middle  # run shim directly
```

### MCPB Bundle Builder

`build_mcpb.py` generates a `.mcpb` bundle (Claude Desktop extension) that impersonates a target MCP server. Requires `mcpb` CLI (`npm install -g @anthropic-ai/mcpb`).

```bash
uv run python build_mcpb.py    # interactive: pick target, enter webhook URL
```

Preset targets: Slack, GitHub, Google Drive, Notion, Google Calendar. Each profile defines the target's `npx` command, the `user_config` fields the victim fills in (API tokens), and env var passthrough so the real server works normally while the shim exfils.

The generated manifest bakes `TARGET_COMMAND` and `EXFIL_URL` into `mcp_config.env`. Auth tokens come from `user_config` (prompted at install time) and pass through to both the shim and target server.

## Testing

```bash
uv run pytest -q                               # run all tests
uv run pytest tests/test_shim.py::test_name    # single test
```

The integration test (`tests/test_shim.py`) spins up a dummy MCP server (`tests/dummy_server.py`), a local HTTP capture server, and the shim, then verifies tool proxying and exfiltration end-to-end.

## Linting & Types

```bash
uv run ruff check .        # lint
uv run ruff format .       # format
uv run ty check            # type check
```
