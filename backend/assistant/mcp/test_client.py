
# ==========================================
# TRYONIX - MCP CLIENT TEST
# ==========================================

import asyncio
import sys

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client


async def main():

    # Start MCP server as a subprocess
    server_params = StdioServerParameters(
        command=sys.executable,
        args=[
            "-m",
            "backend.assistant.mcp.server"
        ]
    )

    async with stdio_client(server_params) as (read, write):

        async with ClientSession(read, write) as session:

            # Initialize MCP connection
            await session.initialize()

            # List available tools
            tools = await session.list_tools()

            print("\nAVAILABLE MCP TOOLS:")

            for tool in tools.tools:
                print("-", tool.name)

            # Test product search
            print("\nTESTING PRODUCT SEARCH:")

            result = await session.call_tool(
                "search_products",
                arguments={
                    "query": "",
                    "limit": 3
                }
            )

            print(result)


if __name__ == "__main__":
    asyncio.run(main())
