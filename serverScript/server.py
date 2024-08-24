import asyncio
import websockets
import json
import random
import string
import socket

rooms = {}
room_users = {}
room_hosts = {}

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
                rooms[code] = [websocket]
                room_users[code] = [user]
                room_hosts[code] = websocket
                print(f"Hosting server with code: {code}")
                await websocket.send(json.dumps({'type': 'hostSuccess', 'code': code}))
                await update_user_list(code)
            elif data['type'] == 'join':
                code = data['code']
                user = data['user']
                if code in rooms:
                    rooms[code].append(websocket)
                    room_users[code].append(user)
                    print(f"Client joined server with code: {code}")
                    await websocket.send(json.dumps({'type': 'joinSuccess'}))
                    await update_user_list(code)
                else:
                    print(f"Join error for code: {code}")
                    await websocket.send(json.dumps({'type': 'joinError'}))
            elif data['type'] == 'kick':
                if code in room_users and data['user'] in room_users[code]:
                    kicked_index = room_users[code].index(data['user'])
                    room_users[code].pop(kicked_index)
                    kicked_socket = rooms[code].pop(kicked_index)
                    if len(room_users[code]) == 0:
                        del rooms[code]
                        del room_users[code]
                        del room_hosts[code]
                    else:
                        await update_user_list(code)
                    await kicked_socket.send(json.dumps({'type': 'kicked'}))
                    await kicked_socket.close()
            elif data['type'] == 'paddleMove':
                if code in rooms:
                    for client in rooms[code]:
                        if client != websocket:
                            await client.send(json.dumps({
                                'type': 'paddleMove',
                                'x': data['x'],
                                'y': data['y'],
                                'side': data['side']
                }))
            elif data['type'] == 'leave':
                if code in room_users and user in room_users[code]:
                    user_index = room_users[code].index(user)
                    room_users[code].pop(user_index)
                    rooms[code].pop(user_index)
                    if websocket == room_hosts[code]:
                        del rooms[code]
                        del room_users[code]
                        del room_hosts[code]
                    else:
                        await update_user_list(code)
                    await websocket.close()
    finally:
        if code in room_users and user in room_users[code]:
            user_index = room_users[code].index(user)
            room_users[code].pop(user_index)
            rooms[code].pop(user_index)
            if websocket == room_hosts[code]:
                del rooms[code]
                del room_users[code]
                del room_hosts[code]
            else:
                await update_user_list(code)


async def update_user_list(code):
    if code in room_users:
        users = room_users[code]
        host = room_hosts[code]
        for index, websocket in enumerate(rooms[code]):
            is_host = (websocket == host)
            await websocket.send(json.dumps({
                'type': 'updateUserList',
                'users': users,
                'isHost': is_host,
                'hostIndex': 0
            }))

async def broadcast_message(code, message):
    if code in rooms:
        await rooms[code].send(message)

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

async def periodic_update():
    while True:
        for code in rooms:
            await update_user_list(code)
        await asyncio.sleep(15)

async def main():
    ip = get_local_ip()
    port = 8765
    server = await websockets.serve(handle_client, ip, port)
    print(f"Server started on ws://{ip}:{port}")
    asyncio.create_task(periodic_update())
    await server.wait_closed()

if __name__ == "__main__":
    asyncio.run(main())