import asyncio
import websockets
import json
import random
import string
import socket

rooms = {}

def generate_code():
    return ''.join(random.choices(string.ascii_letters + string.digits, k=6))

async def handle_client(websocket, path):
    print(f"New connection from {websocket.remote_address}")
    try:
        async for message in websocket:
            data = json.loads(message)
            if data['type'] == 'host':
                code = data['code']
                rooms[code] = websocket
                print(f"Hosting server with code: {code}")
                await websocket.send(json.dumps({'type': 'hostSuccess', 'code': code}))
            elif data['type'] == 'join':
                code = data['code']
                if code in rooms:
                    rooms[code] = websocket
                    print(f"Client joined server with code: {code}")
                    await websocket.send(json.dumps({'type': 'joinSuccess'}))
                else:
                    print(f"Join error for code: {code}")
                    await websocket.send(json.dumps({'type': 'joinError'}))
    finally:
        print(f"Connection closed for {websocket.remote_address}")
        for code, sock in list(rooms.items()):
            if sock == websocket:
                del rooms[code]

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = '127.0.0.1'
    finally:
        s.close()
    return ip

async def main():
    ip = get_local_ip()
    port = 8765
    server = await websockets.serve(handle_client, ip, port)
    print(f"Server started on ws://{ip}:{port}")
    await server.wait_closed()

if __name__ == "__main__":
    asyncio.run(main())
