let socket;
let isHost = false;
let myBatteryLevel;
const connectButton = document.getElementById('connect-button');
const hostButton = document.getElementById('host-button');
const joinButton = document.getElementById('join-button');
const joinCode = document.getElementById('join-code');
const statusMessage = document.getElementById('status-message');
const serverIp = document.getElementById('server-ip');
const serverPort = document.getElementById('server-port');
const controlsContainer = document.getElementById('controls-container');
const userListContainer = document.getElementById('user-list-container');
const userListUl = document.getElementById('user-list-ul');

function connectToServer(ip, port) {
    return new Promise((resolve, reject) => {
        const url = `ws://${ip}:${port}`;
        console.log('Connecting to:', url); 
        socket = new WebSocket(url);

        socket.onopen = () => {
            console.log('Connected to server');
            statusMessage.textContent = 'Connected to server';
            controlsContainer.style.display = 'block';
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
            isHost = true;
            statusMessage.textContent = `Successfully hosting server with code: ${data.code}`;
            hideGameSetupControls();
            userListContainer.style.display = 'block';
            break;
        case 'joinSuccess':
            isHost = false;
            statusMessage.textContent = 'Successfully joined the server!';
            hideGameSetupControls();
            userListContainer.style.display = 'block';
            break;
        case 'joinError':
            statusMessage.textContent = 'Server does not exist.';
            break;
        case 'updateUserList':
            updateUserList(data.users, data.isHost, data.hostIndex);
            break;
        case 'kicked':
            statusMessage.textContent = 'You have been kicked out of the room';
            userListContainer.style.display = 'none';
            controlsContainer.style.display = 'none';
            socket.close();
            break;
    }
}

function updateUserList(users, isHost, hostIndex) {
    userListUl.innerHTML = '';
    users.forEach((user, index) => {
        const li = document.createElement('li');
        li.textContent = `Device ${index + 1}: ${user}% Battery`;
        if (index === hostIndex) {
            li.textContent += ' (Host)';
        }
        if (isHost && index !== hostIndex) {
            const kickButton = document.createElement('button');
            kickButton.textContent = 'Kick';
            kickButton.onclick = () => {
                socket.send(JSON.stringify({ type: 'kick', user }));
            };
            li.appendChild(kickButton);
        } else if (isHost && index === hostIndex) {
            const leaveButton = document.createElement('button');
            leaveButton.textContent = 'Leave';
            leaveButton.onclick = () => {
                socket.send(JSON.stringify({ type: 'leave' }));
                statusMessage.textContent = 'You have left the room';
                userListContainer.style.display = 'none';
                controlsContainer.style.display = 'none';
                socket.close();
            };
            li.appendChild(leaveButton);
        }
        userListUl.appendChild(li);
    });
}
function hideGameSetupControls() {
    hostButton.style.display = 'none';
    joinButton.style.display = 'none';
    joinCode.style.display = 'none';
}

function generateCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

async function getBatteryPercentage() {
    try {
        const battery = await navigator.getBattery();
        return Math.round(battery.level * 100);
    } catch (e) {
        console.error('Error getting battery level:', e);
        return 'unknown';
    }
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

hostButton.addEventListener('click', async () => {
    const code = generateCode();
    myBatteryLevel = await getBatteryPercentage();
    socket.send(JSON.stringify({ type: 'host', code: code, user: myBatteryLevel }));
});

joinButton.addEventListener('click', async () => {
    const code = joinCode.value.trim();
    if (code.length === 6) {
        myBatteryLevel = await getBatteryPercentage();
        socket.send(JSON.stringify({ type: 'join', code: code, user: myBatteryLevel }));
    } else {
        statusMessage.textContent = 'Please enter a valid 6-character code.';
    }
});