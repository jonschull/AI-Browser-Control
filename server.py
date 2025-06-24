import asyncio
import websockets
import json

# Keep track of the connected client
connected_client = None
# Queue to hold responses from the extension
response_queue = None
page_load_event = asyncio.Event()

async def handler(websocket, path):
    global connected_client
    # If a client is already connected, gracefully close the old connection.
    if connected_client:
        print("New client connecting, closing old connection...", flush=True)
        await connected_client.close(code=1001, reason="Replaced by new connection")

    connected_client = websocket
    print("Browser extension connected.", flush=True)
    try:
        async for message in websocket:
            data = json.loads(message)
            print(f"< Received from extension: {data}", flush=True)

            if data.get('type') == 'event' and data.get('event') == 'page_loaded':
                page_load_event.set()
            else:
                await response_queue.put(data)
    except websockets.exceptions.ConnectionClosed:
        print("Browser extension disconnected.", flush=True)
    except Exception as e:
        print(f"An unexpected error occurred in the WebSocket handler: {e}", flush=True)
    finally:
        # Only clear the global client if this handler instance was the one managing it.
        if connected_client is websocket:
            connected_client = None
            print("Active browser extension disconnected.", flush=True)
            # Unblock any waiting request if the client disconnects
            if response_queue and not response_queue.empty():
                await response_queue.put({"status": "Error", "detail": "Browser extension disconnected."})
        else:
            print("An old, stale browser extension connection was closed.", flush=True)


async def send_command(command):
    if connected_client:
        print(f"> Forwarding command to extension: {command}", flush=True)
        await connected_client.send(json.dumps({"type": "PAGE_COMMAND", "command": command}))
        return True
    else:
        print("Command received, but no browser extension is connected.", flush=True)
        return False

async def main():
    # This function will be used to programmatically send commands
    # For now, it does nothing, but it's where I'll hook in.
    pass

from aiohttp import web

# --- HTTP Server Setup ---

async def get_status(request):
    """HTTP endpoint to check if the WebSocket client is connected."""
    return web.json_response({'connected': connected_client is not None})

async def handle_command_request(request):
    try:
        data = await request.json()
        command = data.get('command')
        if not command:
            return web.json_response({'status': 'error', 'message': 'Command not provided'}, status=400)

        success = await send_command(command)

        if success:
            print("Waiting for response from extension...", flush=True)
            try:
                if command.get('action') == 'navigate':
                    page_load_event.clear() # Reset for the new navigation
                    # 1. Wait for the initial acknowledgement from the extension
                    ack_response = await asyncio.wait_for(response_queue.get(), timeout=10.0)
                    if ack_response.get('status') != 'Success':
                        return web.json_response(ack_response) # Return error if ack fails

                    # 2. Wait for the page to finish loading
                    print("Navigation acknowledged. Waiting for page load to complete...", flush=True)
                    await asyncio.wait_for(page_load_event.wait(), timeout=60.0) # 60s timeout for page load
                    print("Page load complete.", flush=True)
                    return web.json_response({'status': 'Success', 'detail': f'Navigated to {command.get("url")} and page loaded.'})
                else: # Default behavior for all other commands
                    response = await asyncio.wait_for(response_queue.get(), timeout=15.0)
                    response_queue.task_done()
                    return web.json_response(response)
            except asyncio.TimeoutError:
                return web.json_response({'status': 'error', 'message': 'Request timed out. No response from extension.'}, status=504)
        else:
            return web.json_response({'status': 'error', 'message': 'Browser extension not connected.'}, status=503)

    except json.JSONDecodeError:
        return web.json_response({'status': 'error', 'message': 'Invalid JSON format.'}, status=400)
    except Exception as e:
        print(f"Error handling command: {e}", flush=True)
        return web.json_response({'status': 'error', 'message': str(e)}, status=500)

async def start_servers():
    global response_queue, page_load_event
    response_queue = asyncio.Queue()
    page_load_event = asyncio.Event()

    # WebSocket Server
    ws_server = await websockets.serve(handler, "localhost", 8767)
    print("WebSocket server started on ws://localhost:8767", flush=True)

    # HTTP Server
    app = web.Application()
    app.router.add_post('/command', handle_command_request)
    app.router.add_get('/status', get_status)
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, 'localhost', 8766)
    await site.start()
    print("HTTP command server started on http://localhost:8766/command", flush=True)

    # Keep servers running indefinitely
    while True:
        await asyncio.sleep(1)

if __name__ == "__main__":
    try:
        asyncio.run(start_servers())
    except KeyboardInterrupt:
        print("\nServers shutting down.", flush=True)
