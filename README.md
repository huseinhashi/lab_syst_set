# Lab System - Graduate Project

## Overview
Simple IoT system to control lab equipment relays and monitor sensors. Replaces Blynk with a basic Node.js backend, Flutter mobile app, and React web dashboard.

## Simple Architecture

```
ESP32 Device          Node.js Backend          Flutter Mobile
                     React Web               
• DHT22 Sensor  ──►  • REST API         ◄──►  • Simple UI
• LDR Sensor         • MongoDB          ◄──►  • Relay Control  
• 4 Relays           • Basic Auth       ◄──►  • Sensor Display
• LCD Display        • Polling          ◄──►  • Prayer Times
```

## Technology Stack

### Backend (Node.js)
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: Basic JWT
- **Polling**: Simple HTTP requests (no WebSocket)

### Mobile App (Flutter)
- **Framework**: Flutter
- **HTTP Client**: Dio
- **Local Storage**: SharedPreferences
- **Simple UI**: Basic widgets

### Web Dashboard (React)
- **Framework**: React
- **HTTP Client**: Axios
- **UI**: Basic CSS or Bootstrap
- **Charts**: Simple Chart.js

## Database Schema (Single Device)

### Sensor Data
```json
{
  "_id": "ObjectId",
  "temperature": 25.5,
  "humidity": 60.2,
  "lightLevel": 1, // 0=night, 1=day
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### Relay States (Single Device)
```json
{
  "_id": "ObjectId",
  "relay1": false,
  "relay2": false,
  "relay3": false,
  "relay4": false,
  "lastUpdated": "2024-01-01T10:00:00Z",
  "updatedBy": "user_id"
}
```

### Prayer Times (Full CRUD)
```json
{
  "_id": "ObjectId",
  "name": "Subax",
  "hour": 5,
  "minute": 15,
  "duration": 30,
  "enabled": true
}
```

### Users
```json
{
  "_id": "ObjectId",
  "username": "admin",
  "password": "hashed_password",
  "role": "admin"
}
```

## API Endpoints

### Authentication
- `POST /api/auth/login`
- `POST /api/auth/register`

### Sensor Data
- `GET /api/sensors/current` - Get current sensor data
- `GET /api/sensors/history` - Get sensor history

### Relay Control (Single Device)
- `GET /api/relays` - Get current relay states
- `PUT /api/relays` - Update all relay states
- `POST /api/relays/toggle/:relayId` - Toggle specific relay (1,2,3,4)
- `POST /api/relays/all-on` - Turn all relays ON
- `POST /api/relays/all-off` - Turn all relays OFF

### Prayer Times (Full CRUD)
- `GET /api/prayer-times` - Get all prayer times
- `POST /api/prayer-times` - Create prayer time
- `PUT /api/prayer-times/:id` - Update prayer time
- `DELETE /api/prayer-times/:id` - Delete prayer time

## Relay Control Examples

### Toggle Individual Relay
```javascript
// Toggle relay 1
POST /api/relays/toggle/1

// Toggle relay 2
POST /api/relays/toggle/2

// Toggle relay 3
POST /api/relays/toggle/3

// Toggle relay 4
POST /api/relays/toggle/4
```

### Control All Relays
```javascript
// Turn all relays ON
POST /api/relays/all-on

// Turn all relays OFF
POST /api/relays/all-off

// Set specific states
PUT /api/relays
{
  "relay1": true,
  "relay2": false,
  "relay3": true,
  "relay4": false
}
```

## Prayer Time Management

### How Prayer Times Work

1. **Database Storage**: Prayer times stored in MongoDB with CRUD operations
2. **ESP32 Logic**: ESP32 reads prayer times from backend and manages local timing
3. **Automatic Control**: During prayer times, ESP32 automatically turns OFF all relays
4. **Manual Override**: Users can still control relays via mobile/web, but ESP32 will override during prayer

### Prayer Time Flow

```
1. Admin sets prayer times via Web/Mobile
2. ESP32 polls backend every minute for prayer times
3. ESP32 checks current time against prayer schedule
4. If prayer time active:
   - Turn OFF all relays
   - Show prayer message on LCD
   - Sound buzzer
   - Block manual control
5. If prayer time ends:
   - Restore relay states
   - Resume normal operation
```

### ESP32 Prayer Time Integration

```cpp
// ESP32 will poll this endpoint every minute
GET /api/prayer-times

// Response format
[
  {
    "name": "Subax",
    "hour": 5,
    "minute": 15,
    "duration": 30,
    "enabled": true
  },
  {
    "name": "Duhur", 
    "hour": 9,
    "minute": 14,
    "duration": 4,
    "enabled": true
  }
  // ... more prayer times
]
```

## Updated ESP32 Firmware

### Remove Blynk, Add HTTP Client
```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Remove Blynk includes
// #include <BlynkSimpleEsp32.h>

// Add HTTP client
HTTPClient http;

// Backend URL
const char* backendUrl = "http://your-backend.com/api";

// Send sensor data every 5 seconds
void sendSensorData() {
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  int ldrValue = digitalRead(LDR_PIN);
  
  if (!isnan(h) && !isnan(t)) {
    http.begin(backendUrl + "/sensors");
    http.addHeader("Content-Type", "application/json");
    
    String json = "{\"temperature\":" + String(t) + 
                  ",\"humidity\":" + String(h) + 
                  ",\"lightLevel\":" + String(ldrValue == HIGH ? 1 : 0) + "}";
    
    int httpResponseCode = http.POST(json);
    http.end();
  }
}

// Check relay commands every 5 seconds
void checkRelayCommands() {
  http.begin(backendUrl + "/relays");
  int httpResponseCode = http.GET();
  
  if (httpResponseCode > 0) {
    String payload = http.getString();
    // Parse JSON and update relays
    updateRelays(payload);
  }
  http.end();
}

// Check prayer times every minute
void checkPrayerTimes() {
  http.begin(backendUrl + "/prayer-times");
  int httpResponseCode = http.GET();
  
  if (httpResponseCode > 0) {
    String payload = http.getString();
    // Parse prayer times and update local schedule
    updatePrayerTimes(payload);
  }
  http.end();
}
```

## Project Structure

```
lab-system/
├── backend/
│   ├── routes/
│   │   ├── auth.js
│   │   ├── sensors.js
│   │   ├── relays.js
│   │   └── prayerTimes.js
│   ├── models/
│   │   ├── User.js
│   │   ├── SensorData.js
│   │   ├── RelayState.js
│   │   └── PrayerTime.js
│   ├── package.json
│   └── server.js
├── mobile-app/
│   ├── lib/
│   │   ├── screens/
│   │   │   ├── dashboard.dart
│   │   │   ├── relays.dart
│   │   │   ├── sensors.dart
│   │   │   └── prayer_times.dart
│   │   ├── services/
│   │   │   └── api_service.dart
│   │   └── main.dart
│   └── pubspec.yaml
├── web-dashboard/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   ├── package.json
│   └── public/
└── esp32-firmware/
    └── lab_system_simple.ino
```

## Implementation Steps

### Week 1: Backend
- [ ] Set up Express.js server
- [ ] Create MongoDB models (no device IDs)
- [ ] Implement relay control APIs
- [ ] Add prayer time CRUD
- [ ] Add simple authentication

### Week 2: ESP32 Update
- [ ] Remove Blynk code
- [ ] Add HTTP client for sensor data
- [ ] Add HTTP client for relay commands
- [ ] Add HTTP client for prayer times
- [ ] Test with backend

### Week 3: Flutter Mobile App
- [ ] Create basic UI
- [ ] Add relay control (individual + all)
- [ ] Show sensor data with polling
- [ ] Add prayer time management

### Week 4: React Web Dashboard
- [ ] Create simple dashboard
- [ ] Add relay control panel
- [ ] Add prayer time CRUD
- [ ] Show sensor data

## Features

### Mobile App
- Dashboard with sensor data
- Individual relay toggles (1,2,3,4)
- All relays ON/OFF buttons
- Prayer time management
- Simple settings

### Web Dashboard
- Same features as mobile
- Prayer time CRUD operations
- Basic charts for sensor data
- User management

### Backend
- REST API endpoints
- MongoDB database (single device)
- Basic authentication
- Prayer time scheduling

## Simple Deployment

### Backend
- Deploy to Heroku or Railway
- MongoDB Atlas for database
- Simple environment variables

### Mobile App
- Build APK for testing
- No app store deployment needed

### Web Dashboard
- Deploy to Vercel or Netlify
- Simple static hosting

This simplified approach focuses on core functionality for a single device setup, perfect for a graduate project! 