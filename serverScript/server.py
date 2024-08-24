import asyncio
import websockets
import json
import random
import string
import socket

rooms = {}
room_users = {}

def generate_code():
    return ''.join(random.choices(string.ascii_letters + string.digits, k=6))

async def handle_client(websocket, path):
    print(f"New connection from {websocket.remote_address}")
    user = 'unknown'
    code = None
    
    try:
        async for message in websocket:
            data = json.loads(message)
            if data['type'] == 'host':
                code = data['code']
                user = data['user']
                rooms[code] = websocket
                room_users[code] = [user]
                print(f"Hosting server with code: {code}")
                await websocket.send(json.dumps({'type': 'hostSuccess', 'code': code}))
                await update_user_list(code)
            elif data['type'] == 'join':
                code = data['code']
                user = data['user']
                if code in rooms:
                    rooms[code] = websocket
                    room_users[code].append(user)
                    print(f"Client joined server with code: {code}")
                    await websocket.send(json.dumps({'type': 'joinSuccess'}))
                    await update_user_list(code)
                else:
                    print(f"Join error for code: {code}")
                    await websocket.send(json.dumps({'type': 'joinError'}))
            elif data['type'] == 'kick':
                if code in room_users and data['user'] in room_users[code]:
                    room_users[code].remove(data['user'])
                    if len(room_users[code]) == 0:
                        del rooms[code]
                        del room_users[code]
                    else:
                        await update_user_list(code)
                    # Inform the kicked user
                    await websocket.send(json.dumps({'type': 'kick', 'user': data['user']}))
                    if data['user'] == user:
                        await websocket.close()
    finally:
        if code in room_users and user in room_users[code]:
            room_users[code].remove(user)
            if len(room_users[code]) == 0:
                del rooms[code]
                del room_users[code]
            else:
                await update_user_list(code)

async def update_user_list(code):
    if code in room_users:
        users = room_users[code]
        for websocket in rooms.values():
            await websocket.send(json.dumps({'type': 'updateUserList', 'users': users}))

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
