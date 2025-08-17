#include <WiFi.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>
#include <time.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "Test";
const char* password = "12345678";

// Backend server details
const char* backendUrl = "http://10.197.221.198:3000/api"; // Update with your backend IP
const int backendPort = 3000;

// Pin definitions
#define comp1 27
#define comp2 26
#define comp3 25
#define comp4 33
#define buzzer 5
#define red 18
#define green 19
#define LDR_PIN 32
#define DHTPIN 15
#define flame 14
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

// LCD
LiquidCrystal_I2C lcd(0x27, 16, 2);

// Prayer time structure
struct PrayerTime {
  String name;
  int hour;
  int minute;
  int duration;
};

// Global variables
bool isInSalah = false;
String currentSalah = "";
PrayerTime prayerTimes[10]; // Store prayer times from backend
int prayerTimeCount = 0;

// Relay states
bool relay1State = false;
bool relay2State = false;
bool relay3State = false;
bool relay4State = false;

// Buzzer control
unsigned long lastBeepTime = 0;
int beepCount = 0;
bool beeping = false;
bool buzzerState = false;

// Timers
unsigned long lastSensorSend = 0;
unsigned long lastRelayCheck = 0;
unsigned long lastPrayerCheck = 0;
const unsigned long SENSOR_INTERVAL = 5000;    // Send sensor data every 5 seconds
const unsigned long RELAY_INTERVAL = 3000;      // Check relay states every 3 seconds
const unsigned long PRAYER_INTERVAL = 60000;    // Check prayer times every minute

void setupTime() {
  // Set timezone to Somalia (UTC+3)
  configTime(3 * 3600, 0, "pool.ntp.org", "time.nist.gov");

  struct tm timeinfo;
  while (!getLocalTime(&timeinfo)) {
    Serial.println("Waiting for NTP...");
    delay(1000);
  }

  Serial.println("Time sync success");
}

void setupWiFi() {
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println();
  Serial.println("WiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

// Send sensor data to backend
void sendSensorData() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected");
    return;
  }

  float h = dht.readHumidity();
  float t = dht.readTemperature();
  int ldrValue = digitalRead(LDR_PIN);
  int lightLevel = (ldrValue == HIGH) ? 0 : 1; // 0 = night, 1 = day

  if (isnan(h) || isnan(t)) {
    Serial.println("Failed to read sensor data");
    return;
  }

  HTTPClient http;
  String url = String(backendUrl) + "/esp32/sensors";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  // Create JSON payload
  String jsonPayload = "{\"temperature\":" + String(t, 1) + 
                      ",\"humidity\":" + String(h, 1) + 
                      ",\"lightLevel\":" + String(lightLevel) + "}";

  int httpResponseCode = http.POST(jsonPayload);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Sensor data sent successfully");
    Serial.println("Response: " + response);
  } else {
    Serial.println("Error sending sensor data: " + http.errorToString(httpResponseCode));
  }
  
  http.end();
}

// Get relay states from backend
void getRelayStates() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected");
    return;
  }

  HTTPClient http;
  String url = String(backendUrl) + "/esp32/relays";
  http.begin(url);
  
  int httpResponseCode = http.GET();
  
  if (httpResponseCode > 0) {
    String payload = http.getString();
    Serial.println("Relay response: " + payload);
    
    // Parse JSON response
    DynamicJsonDocument doc(1024);
    DeserializationError error = deserializeJson(doc, payload);
    
    if (!error) {
      if (doc["success"] == true && doc.containsKey("data")) {
        JsonObject data = doc["data"];
        
        // Update relay states
        bool newRelay1 = data["relay1"] | false;
        bool newRelay2 = data["relay2"] | false;
        bool newRelay3 = data["relay3"] | false;
        bool newRelay4 = data["relay4"] | false;
        
        // Only update if not in prayer time
        if (!isInSalah) {
          if (newRelay1 != relay1State) {
            relay1State = newRelay1;
            digitalWrite(comp1, relay1State ? LOW : HIGH);
            Serial.println("Relay 1: " + String(relay1State ? "ON" : "OFF"));
          }
          
          if (newRelay2 != relay2State) {
            relay2State = newRelay2;
            digitalWrite(comp2, relay2State ? LOW : HIGH);
            Serial.println("Relay 2: " + String(relay2State ? "ON" : "OFF"));
          }
          
          if (newRelay3 != relay3State) {
            relay3State = newRelay3;
            digitalWrite(comp3, relay3State ? LOW : HIGH);
            Serial.println("Relay 3: " + String(relay3State ? "ON" : "OFF"));
          }
          
          if (newRelay4 != relay4State) {
            relay4State = newRelay4;
            digitalWrite(comp4, relay4State ? LOW : HIGH);
            Serial.println("Relay 4: " + String(relay4State ? "ON" : "OFF"));
          }
        }
      }
    } else {
      Serial.println("JSON parsing failed");
    }
  } else {
    Serial.println("Error getting relay states: " + http.errorToString(httpResponseCode));
  }
  
  http.end();
}

// Get prayer times from backend
void getPrayerTimes() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected");
    return;
  }

  HTTPClient http;
  String url = String(backendUrl) + "/esp32/prayer-times";
  http.begin(url);
  
  int httpResponseCode = http.GET();
  
  if (httpResponseCode > 0) {
    String payload = http.getString();
    Serial.println("Prayer times response: " + payload);
    
    // Parse JSON response
    DynamicJsonDocument doc(2048);
    DeserializationError error = deserializeJson(doc, payload);
    
    if (!error) {
      if (doc["success"] == true && doc.containsKey("data")) {
        JsonArray data = doc["data"];
        prayerTimeCount = 0;
        
        for (JsonObject prayer : data) {
          if (prayerTimeCount < 10) { // Limit to 10 prayer times
            prayerTimes[prayerTimeCount].name = prayer["name"].as<String>();
            prayerTimes[prayerTimeCount].hour = prayer["hour"] | 0;
            prayerTimes[prayerTimeCount].minute = prayer["minute"] | 0;
            prayerTimes[prayerTimeCount].duration = prayer["duration"] | 30;
            prayerTimeCount++;
          }
        }
        
        Serial.println("Updated " + String(prayerTimeCount) + " prayer times");
      }
    } else {
      Serial.println("JSON parsing failed for prayer times");
    }
  } else {
    Serial.println("Error getting prayer times: " + http.errorToString(httpResponseCode));
  }
  
  http.end();
}

bool checkSalahNow(int hour, int minute, int duration) {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) return false;
  
  int nowMinutes = timeinfo.tm_hour * 60 + timeinfo.tm_min;
  int salahStart = hour * 60 + minute;
  
  return (nowMinutes >= salahStart && nowMinutes < salahStart + duration);
}

void printTimeStatus() {
  struct tm timeinfo;
  if (getLocalTime(&timeinfo)) {
    char buffer[30];
    strftime(buffer, sizeof(buffer), "%H:%M:%S", &timeinfo);
    Serial.print("Current Time: ");
    Serial.println(buffer);

    Serial.print("Salah Status: ");
    Serial.println(isInSalah ? currentSalah : "No Salah");

    int nowMinutes = timeinfo.tm_hour * 60 + timeinfo.tm_min;
    for (int i = 0; i < prayerTimeCount; i++) {
      int salahStart = prayerTimes[i].hour * 60 + prayerTimes[i].minute;
      if (salahStart > nowMinutes) {
        Serial.print("Next Salah: ");
        Serial.print(prayerTimes[i].name);
        Serial.print(" at ");
        Serial.print(prayerTimes[i].hour);
        Serial.print(":");
        Serial.println(prayerTimes[i].minute);
        break;
      }
    }
  } else {
    Serial.println("Failed to get local time.");
  }
}

void handleBuzzerBeep() {
  if (beeping) {
    if (millis() - lastBeepTime >= 1000) {
      buzzerState = !buzzerState;
      digitalWrite(buzzer, buzzerState ? HIGH : LOW);
      lastBeepTime = millis();

      if (!buzzerState) {
        beepCount++;
        if (beepCount >= 5) {
          beeping = false;
          digitalWrite(buzzer, LOW);
        }
      }
    }
  }
}

void handleSalahTime() {
  bool salahActive = false;
  String salahName = "";

  for (int i = 0; i < prayerTimeCount; i++) {
    if (checkSalahNow(prayerTimes[i].hour, prayerTimes[i].minute, prayerTimes[i].duration)) {
      salahActive = true;
      salahName = prayerTimes[i].name;
      break;
    }
  }

  if (salahActive && !isInSalah) {
    isInSalah = true;
    currentSalah = salahName;
    
    // Turn off all relays during prayer
    digitalWrite(comp1, HIGH);
    digitalWrite(comp2, HIGH);
    digitalWrite(comp3, HIGH);
    digitalWrite(comp4, HIGH);
    relay1State = false;
    relay2State = false;
    relay3State = false;
    relay4State = false;
    
    digitalWrite(red, HIGH);
    digitalWrite(green, LOW);

    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Prayer Time:");
    lcd.setCursor(0, 1);
    lcd.print(currentSalah);

    // Start beeping
    beeping = true;
    beepCount = 0;
    lastBeepTime = millis();
    buzzerState = false;

    Serial.print("Entered Salah Time: ");
    Serial.println(currentSalah);
  } else if (!salahActive && isInSalah) {
    isInSalah = false;
    currentSalah = "";
    digitalWrite(red, LOW);
    digitalWrite(green, HIGH);
    digitalWrite(buzzer, LOW);
    lcd.clear();

    Serial.println("Exited Salah Time");
  }

  printTimeStatus();
}

void updateLCD() {
  if (!isInSalah) {
    float h = dht.readHumidity();
    float t = dht.readTemperature();
    int ldrValue = digitalRead(LDR_PIN);
    int flameValue = digitalRead(flame);
    String dayStatus = (ldrValue == HIGH) ? "Night" : "Day";
    String flameStatus = (flameValue == HIGH) ? "No Flame" : "Flame!";

    if (!isnan(h) && !isnan(t)) {
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("H:");
      lcd.print((int)h);
      lcd.print("%  T:");
      lcd.print((int)t);
      lcd.print("C");

      lcd.setCursor(0, 1);
      lcd.print(dayStatus);
      lcd.print(" ");
      lcd.print(flameStatus);

      // Temperature alert or flame alert
      if (t > 36 || flameValue == LOW) {
        digitalWrite(red, HIGH);
        digitalWrite(green, LOW);
        digitalWrite(buzzer, HIGH);
      } else {
        digitalWrite(red, LOW);
        digitalWrite(green, HIGH);
        digitalWrite(buzzer, LOW);
      }
    }
  }
}

void setup() {
  Serial.begin(9600);
  
  // Initialize pins
  pinMode(comp1, OUTPUT);
  pinMode(comp2, OUTPUT);
  pinMode(comp3, OUTPUT);
  pinMode(comp4, OUTPUT);
  pinMode(buzzer, OUTPUT);
  pinMode(red, OUTPUT);
  pinMode(green, OUTPUT);
  pinMode(LDR_PIN, INPUT);
  pinMode(flame, INPUT);

  // Initialize relays to OFF (HIGH)
  digitalWrite(comp1, HIGH);
  digitalWrite(comp2, HIGH);
  digitalWrite(comp3, HIGH);
  digitalWrite(comp4, HIGH);
  digitalWrite(buzzer, LOW);
  digitalWrite(red, LOW);
  digitalWrite(green, LOW);

  // Initialize sensors and LCD
  dht.begin();
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("System Starting");

  // Setup WiFi and time
  setupWiFi();
  setupTime();

  // Get initial prayer times
  getPrayerTimes();
  
  Serial.println("System initialized successfully");
}

void loop() {
  unsigned long currentMillis = millis();
  Serial.println(digitalRead(flame));

  // Send sensor data every 5 seconds
  if (currentMillis - lastSensorSend >= SENSOR_INTERVAL) {
    sendSensorData();
    lastSensorSend = currentMillis;
  }

  // Check relay states every 3 seconds
  if (currentMillis - lastRelayCheck >= RELAY_INTERVAL) {
    getRelayStates();
    lastRelayCheck = currentMillis;
  }

  // Check prayer times every minute
  if (currentMillis - lastPrayerCheck >= PRAYER_INTERVAL) {
    getPrayerTimes();
    handleSalahTime();
    lastPrayerCheck = currentMillis;
  }

  // Update LCD and handle buzzer
  updateLCD();
  handleBuzzerBeep();

  // Small delay to prevent watchdog issues
  delay(100);
}