let socket;
const connectButton = document.getElementById('connect-button');
const hostButton = document.getElementById('host-button');
const joinButton = document.getElementById('join-button');
const joinCode = document.getElementById('join-code');
const statusMessage = document.getElementById('status-message');
const serverIp = document.getElementById('server-ip');
const serverPort = document.getElementById('server-port');
const gameArea = document.getElementById('game-area');
const controls = document.querySelector('.controls');

function connectToServer(ip, port) {
    return new Promise((resolve, reject) => {
        const url = `ws://${ip}:${port}`;
        console.log('Connecting to:', url); 
        socket = new WebSocket(url);

        socket.onopen = () => {
            console.log('Connected to server');
            statusMessage.textContent = 'Connected to server';
            gameArea.style.display = 'block';
            controls.style.display = 'flex';
            resolve(socket);
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            statusMessage.textContent = 'Failed to connect to the server. Please check the IP and port.';
            reject(error);
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleServerMessage(data);
        };
    });
}


function handleServerMessage(data) {
    switch (data.type) {
        case 'hostSuccess':
            statusMessage.textContent = `Successfully hosting server with code: ${data.code}`;
            break;
        case 'joinSuccess':
            statusMessage.textContent = 'Successfully joined the server!';
            break;
        case 'joinError':
            statusMessage.textContent = 'Server does not exist.';
            break;
    }
}

function generateCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

connectButton.addEventListener('click', () => {
    const ip = serverIp.value.trim();
    const port = serverPort.value.trim();

    if (ip && port) {
        connectToServer(ip, port).catch(error => {
            console.error('Failed to connect to server:', error);
        });
    } else {
        statusMessage.textContent = 'Please enter a valid IP address and port.';
    }
});

hostButton.addEventListener('click', () => {
    const code = generateCode();
    socket.send(JSON.stringify({ type: 'host', code: code }));
});

joinButton.addEventListener('click', () => {
    const code = joinCode.value.trim();
    if (code.length === 6) {
        socket.send(JSON.stringify({ type: 'join', code: code }));
    } else {
        statusMessage.textContent = 'Please enter a valid 6-character code.';
    }
});
