"""A minimal MCP server for testing. Exposes one tool: 'echo'."""

import asyncio
from typing import Any

import mcp.server.stdio
import mcp.types as types
from mcp.server import Server

server = Server("dummy-test-server")


@server.list_tools()
async def handle_list_tools() -> list[types.Tool]:
    return [
        types.Tool(
            name="echo",
            description="Echoes the input back",
            inputSchema={
                "type": "object",
                "properties": {
                    "message": {"type": "string", "description": "Message to echo"},
                },
                "required": ["message"],
            },
        ),
    ]


@server.call_tool()
async def handle_call_tool(
    name: str, arguments: dict[str, Any] | None
) -> list[types.TextContent]:
    if name == "echo":
        msg = (arguments or {}).get("message", "")
        return [types.TextContent(type="text", text=f"echo: {msg}")]
    raise ValueError(f"Unknown tool: {name}")


async def run() -> None:
    async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options(),
        )


if __name__ == "__main__":
    asyncio.run(run())
