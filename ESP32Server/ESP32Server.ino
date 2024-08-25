#include <WiFi.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>
#include <esp_heap_caps.h>

const char* ssid = "SSID";
const char* password = "PASSWORD";

WebSocketsServer webSocket = WebSocketsServer(8765);

#define MAX_ROOMS 10
#define MAX_USERS_PER_ROOM 5

struct Room {
  String code;
  uint8_t clients[MAX_USERS_PER_ROOM];
  String users[MAX_USERS_PER_ROOM];
  int userCount;
  uint8_t host;
};

Room* rooms = nullptr;
int roomCount = 0;

void setup() {
  Serial.begin(115200);
  
  if (psramInit()) {
    Serial.println("PSRAM initialized successfully");
    rooms = (Room*)ps_malloc(MAX_ROOMS * sizeof(Room));
  } else {
    Serial.println("PSRAM initialization failed");
    rooms = new Room[MAX_ROOMS];
  }
  
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  
  Serial.println("Connected to WiFi");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
  
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
}

String generateCode() {
  const char charset[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  String result;
  for (int i = 0; i < 6; i++) {
    result += charset[random(0, sizeof(charset) - 1)];
  }
  return result;
}

void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      handleDisconnect(num);
      break;
    case WStype_CONNECTED:
      Serial.printf("[%u] Connected\n", num);
      break;
    case WStype_TEXT:
      handleWebSocketMessage(num, payload, length);
      break;
  }
}

void handleWebSocketMessage(uint8_t num, uint8_t * payload, size_t length) {
  DynamicJsonDocument* doc = new DynamicJsonDocument(1024);
  if (!doc) {
    Serial.println("Failed to allocate memory");
    return;
  }
  
  DeserializationError error = deserializeJson(*doc, payload, length);
  if (error) {
    Serial.println("Failed to parse");
    delete doc;
    return;
  }
  
  String type = (*doc)["type"];
  
  if (type == "host") {
    String code = generateCode();
    String user = (*doc)["user"];
    if (roomCount < MAX_ROOMS) {
      rooms[roomCount].code = code;
      rooms[roomCount].clients[0] = num;
      rooms[roomCount].users[0] = user;
      rooms[roomCount].userCount = 1;
      rooms[roomCount].host = num;
      roomCount++;
      
      DynamicJsonDocument response(128);
      response["type"] = "hostSuccess";
      response["code"] = code;
      String responseStr;
      serializeJson(response, responseStr);
      webSocket.sendTXT(num, responseStr);
      updateUserList(code);
    }
  } 
  else if (type == "join") {
    String code = (*doc)["code"];
    String user = (*doc)["user"];
    for (int i = 0; i < roomCount; i++) {
      if (rooms[i].code == code && rooms[i].userCount < MAX_USERS_PER_ROOM) {
        rooms[i].clients[rooms[i].userCount] = num;
        rooms[i].users[rooms[i].userCount] = user;
        rooms[i].userCount++;
        
        DynamicJsonDocument response(64);
        response["type"] = "joinSuccess";
        String responseStr;
        serializeJson(response, responseStr);
        webSocket.sendTXT(num, responseStr);
        updateUserList(code);
        delete doc;
        return;
      }
    }
    DynamicJsonDocument response(64);
    response["type"] = "joinError";
    String responseStr;
    serializeJson(response, responseStr);
    webSocket.sendTXT(num, responseStr);
  }
  else if (type == "kick") {
    String code = findRoomByClient(num);
    String userToKick = (*doc)["user"];
    if (code != "") {
      Room* room = findRoomByCode(code);
      if (room && num == room->host) {
        for (int i = 0; i < room->userCount; i++) {
          if (room->users[i] == userToKick) {
            uint8_t kickedClient = room->clients[i];
            for (int j = i; j < room->userCount - 1; j++) {
              room->clients[j] = room->clients[j + 1];
              room->users[j] = room->users[j + 1];
            }
            room->userCount--;
            DynamicJsonDocument kickedMessage(64);
            kickedMessage["type"] = "kicked";
            String kickedMessageStr;
            serializeJson(kickedMessage, kickedMessageStr);
            webSocket.sendTXT(kickedClient, kickedMessageStr);
            webSocket.disconnect(kickedClient);
            updateUserList(code);
            break;
          }
        }
      }
    }
  }
  else if (type == "paddleMove" || type == "puckUpdate" || type == "gameOver") {
    String code = findRoomByClient(num);
    if (code != "") {
      Room* room = findRoomByCode(code);
      if (room) {
        String messageStr;
        serializeJson(*doc, messageStr);
        for (int i = 0; i < room->userCount; i++) {
          if (room->clients[i] != num) {
            webSocket.sendTXT(room->clients[i], messageStr);
          }
        }
      }
    }
  }
  else if (type == "gameStart") {
    String code = findRoomByClient(num);
    if (code != "") {
      Room* room = findRoomByCode(code);
      if (room && num == room->host) {
        DynamicJsonDocument startMessage(64);
        startMessage["type"] = "gameStart";
        String startMessageStr;
        serializeJson(startMessage, startMessageStr);
        for (int i = 0; i < room->userCount; i++) {
          if (room->clients[i] != num) {
            webSocket.sendTXT(room->clients[i], startMessageStr);
          }
        }
      }
    }
  }
  
  delete doc;
}

void handleDisconnect(uint8_t num) {
  for (int i = 0; i < roomCount; i++) {
    for (int j = 0; j < rooms[i].userCount; j++) {
      if (rooms[i].clients[j] == num) {
        for (int k = j; k < rooms[i].userCount - 1; k++) {
          rooms[i].clients[k] = rooms[i].clients[k + 1];
          rooms[i].users[k] = rooms[i].users[k + 1];
        }
        rooms[i].userCount--;
        if (num == rooms[i].host) {
          if (rooms[i].userCount > 0) {
            rooms[i].host = rooms[i].clients[0];
          } else {
            for (int k = i; k < roomCount - 1; k++) {
              rooms[k] = rooms[k + 1];
            }
            roomCount--;
          }
        }
        updateUserList(rooms[i].code);
        break;
      }
    }
  }
}

void updateUserList(String code) {
  Room* room = findRoomByCode(code);
  if (room) {
    DynamicJsonDocument* doc = new DynamicJsonDocument(512);
    if (!doc) {
      Serial.println("Failed to allocate memory");
      return;
    }
    
    (*doc)["type"] = "updateUserList";
    JsonArray users = doc->createNestedArray("users");
    for (int i = 0; i < room->userCount; i++) {
      users.add(room->users[i]);
    }
    
    for (int i = 0; i < room->userCount; i++) {
      (*doc)["isHost"] = (room->clients[i] == room->host);
      (*doc)["hostIndex"] = 0;
      String messageStr;
      serializeJson(*doc, messageStr);
      webSocket.sendTXT(room->clients[i], messageStr);
    }
    
    delete doc;
  }
}

String findRoomByClient(uint8_t num) {
  for (int i = 0; i < roomCount; i++) {
    for (int j = 0; j < rooms[i].userCount; j++) {
      if (rooms[i].clients[j] == num) {
        return rooms[i].code;
      }
    }
  }
  return "";
}

Room* findRoomByCode(String code) {
  for (int i = 0; i < roomCount; i++) {
    if (rooms[i].code == code) {
      return &rooms[i];
    }
  }
  return nullptr;
}

void loop() {
  webSocket.loop();
}