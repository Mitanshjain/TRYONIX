
# ==========================================
# TRYONIX - PERSISTENT MCP CLIENT
# ==========================================

import asyncio
import json
import sys
import time
import threading
from concurrent.futures import TimeoutError as FutureTimeoutError

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client


# ==========================================
# MCP CLIENT MANAGER
# ==========================================

class PersistentMCPClient:

    def __init__(self):
        self.loop = None
        self.session = None
        self.thread = None

        self.ready = threading.Event()
        self.startup_error = None
        self.lock = threading.Lock()

    # ======================================
    # START BACKGROUND EVENT LOOP
    # ======================================

    def start(self):
        with self.lock:

            if self.thread and self.thread.is_alive():
                return

            self.ready.clear()
            self.startup_error = None

            self.thread = threading.Thread(
                target=self._run_loop,
                daemon=True,
                name="TRYONIX-MCP-Client"
            )

            self.thread.start()

        if not self.ready.wait(timeout=20):
            raise TimeoutError(
                "MCP server startup timed out."
            )

        if self.startup_error:
            raise RuntimeError(
                "MCP server failed to start."
            ) from self.startup_error

    def _run_loop(self):
        self.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self.loop)

        try:
            self.loop.run_until_complete(
                self._maintain_connection()
            )
        except Exception as exc:
            self.startup_error = exc
            self.ready.set()
        finally:
            self.session = None
            self.loop.close()

    # ======================================
    # MAINTAIN MCP CONNECTION
    # ======================================

    async def _maintain_connection(self):

        server_params = StdioServerParameters(
            command=sys.executable,
            args=[
                "-m",
                "backend.assistant.mcp.server"
            ]
        )

        start_time = time.perf_counter()

        async with stdio_client(server_params) as (read, write):

            async with ClientSession(read, write) as session:

                await session.initialize()

                self.session = session

                print(
                    "[MCP] Persistent connection ready in "
                    f"{time.perf_counter() - start_time:.2f}s",
                    flush=True
                )

                self.ready.set()

                # Keep connection alive for future requests
                self.stop_event = asyncio.Event()
                await self.stop_event.wait()

    # ======================================
    # EXECUTE MCP TOOL
    # ======================================

    async def _execute_tool(self, tool_name, arguments):

        if self.session is None:
            raise RuntimeError(
                "MCP session is not connected."
            )

        result = await self.session.call_tool(
            tool_name,
            arguments=arguments
        )

        if result.isError:
            raise RuntimeError(
                f"MCP tool failed: {tool_name}"
            )

        if result.structuredContent is not None:
            return result.structuredContent

        return [
            json.loads(item.text)
            for item in result.content
            if item.type == "text"
        ]

    # ======================================
    # SYNCHRONOUS TOOL CALL
    # ======================================

    def call_tool(self, tool_name, arguments):

        self.start()

        if self.loop is None or not self.loop.is_running():
            raise RuntimeError(
                "MCP event loop is not running."
            )

        start_time = time.perf_counter()

        future = asyncio.run_coroutine_threadsafe(
            self._execute_tool(tool_name, arguments),
            self.loop
        )

        try:
            result = future.result(timeout=30)

        except FutureTimeoutError:
            future.cancel()
            raise TimeoutError(
                f"MCP tool timed out: {tool_name}"
            )

        print(
            f"[MCP] Reused connection ({tool_name}): "
            f"{time.perf_counter() - start_time:.2f}s",
            flush=True
        )

        return result


# ==========================================
# GLOBAL MCP CLIENT INSTANCE
# ==========================================

mcp_client = PersistentMCPClient()


# ==========================================
# PUBLIC FUNCTION
# ==========================================

def call_mcp_tool(tool_name: str, arguments: dict):
    return mcp_client.call_tool(
        tool_name,
        arguments
    )
