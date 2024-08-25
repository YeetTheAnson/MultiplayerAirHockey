# MultiplayerAirHockey
A air hockey game with multiplayer ability

![MultiplayerAirHockey](https://github.com/YeetTheAnson/MultiplayerAirHockey/raw/main/1.png)
![MultiplayerAirHockey](https://github.com/YeetTheAnson/MultiplayerAirHockey/raw/main/2.png)
![MultiplayerAirHockey](https://github.com/YeetTheAnson/MultiplayerAirHockey/raw/main/3.png)


https://github.com/user-attachments/assets/28d2e103-00ca-4af3-a06e-00697311c34c


# Getting started

1. Host the game server on Python(Source) or on the Python(Executable) or on an ESP32 microcontroller
    - [Go to Installation of Python Webserver](#installation-of-python-source-webserver)
    - [Go to Installation of Python Executable Webserver](#installation-of-python-executable-webserver)
    - [Go to Installation ESP32 Webserver](#installation-esp32-webserver)
2. To play this game, open the html using your browser or host it using vscode Live Server. Reasons for not hosting the webpage is stated [here](#reasons-for-not-hosting-webpage)
3. Learn how to play the game [here](#usage)
4. Learn about the features [here](#features)



## Installation of Python Source Webserver

1. Type ```git clone https://github.com/YeetTheAnson/MultiplayerAirHockey``` into CMD
2. Double click and open PythonServer.exe
3. Copy the IP address and Port and move on to the next step

## Installation of Python Executable Webserver

1. Type ```git clone https://github.com/YeetTheAnson/MultiplayerAirHockey``` into CMD
2. Ensure you have all the libraries, run `pip install asyncio websockets json random string socket`
3. Open CMD and navigate to MultiplayerAirHockey/PythonServer
4. Run the server by using the command `PythonServer.py`
5. Copy the IP address and Port and move on to the next step


## Installation ESP32 Webserver

1. Type ```git clone https://github.com/YeetTheAnson/MultiplayerAirHockey``` into CMD
2. Navigate to `ESP32Server` and open the `.ino` file in Arduino IDE.
3. Set the configuration by changing the SSID and password in the code.
4. Add ESP32 to the board manager:
    - Go to `File` >> `Preferences` >> `Additional Boards Manager URLs`
    - Paste the following URL: `https://espressif.github.io/arduino-esp32/package_esp32_index.json`
5. Select the board `ESP32S2 DEV MODULE`.
6. Flash the code to the ESP32S2.
7. Copy the IP address and Port and move on to the next step


## Reasons for Not Hosting Webpage

Most browsers and webpage hosting like github pages try to automatically upgrade the http connection to https, and will make the ws:// connection method invalid. The reason why I didn't implement wss:// was because it would be too complex as it involves SSL certificates and keys which the user have to generate

# Usage

1. Copy the IP and port from the [Python](#installation-of-python-webserver) terminal or on the [ESP32](#installation-esp32-webserver) serial monitor
2. Paste the IP and port in the designated boxes in the website and press `Connect to server`
3. Join a room by hosting a room, or by typing in the room code an joining the room
4. Only the host can start the game, and the start button will turn green when 2 players are in the room

## Features
- Only the host are allowed to kick users
- Depending on the client, players are only allowed to move the paddles on one side

