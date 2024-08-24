let socket;
const hostButton = document.getElementById('host-button');
const joinButton = document.getElementById('join-button');
const joinCode = document.getElementById('join-code');
const statusMessage = document.getElementById('status-message');

function connectToServer() {
    return new Promise((resolve, reject) => {
        socket = new WebSocket('ws://localhost:8765');
        
        socket.onopen = () => {
            console.log('Connected to server');
            statusMessage.textContent = 'Connected to server';
            resolve(socket);
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            statusMessage.textContent = 'Please download and run the Python script';
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

connectToServer().catch(error => {
    console.error('Failed to connect to server:', error);
});