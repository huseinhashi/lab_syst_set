#include <WiFi.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>
#include <time.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "Tahqiiq System";
const char* password = "614444259";

// Backend server details
const char* backendUrl = "https://labsystjust.up.railway.app"; // Same as Flutter app
const int backendPort = 443; // HTTPS port

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

// Working hours structure
struct WorkingHours {
  String name;
  int startHour;
  int startMinute;
  int endHour;
  int endMinute;
  bool isActive;
};

// Global variables
bool isInSalah = false;
String currentSalah = "";
PrayerTime prayerTimes[10]; // Store prayer times from backend
int prayerTimeCount = 0;
WorkingHours workingHours; // Store working hours from backend

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

// Shutdown tracking (to prevent repeated shutdowns)
bool lastWorkingHoursShutdown = false;  // Track if we already shut down for working hours end
int lastWorkingHoursEndDay = 0;         // Track the day we last shut down for working hours
bool lastPrayerShutdown = false;        // Track if we already shut down for current prayer
String lastPrayerShutdownName = "";     // Track which prayer we last shut down for

// Timers
unsigned long lastSensorSend = 0;
unsigned long lastRelayCheck = 0;
unsigned long lastPrayerCheck = 0;
unsigned long lastWorkingHoursCheck = 0;
const unsigned long SENSOR_INTERVAL = 5000;    // Send sensor data every 5 seconds
const unsigned long RELAY_INTERVAL = 3000;      // Check relay states every 3 seconds
const unsigned long PRAYER_INTERVAL = 60000;    // Check prayer times every minute
const unsigned long WORKING_HOURS_INTERVAL = 60000; // Check working hours every 1 minute

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
  
  // Test HTTPS connection
  Serial.println("Testing HTTPS connection to backend...");
  HTTPClient http;
  String testUrl = String(backendUrl) + "/esp32/relays";
  http.begin(testUrl);
  http.setInsecure();
  
  int httpResponseCode = http.GET();
  if (httpResponseCode > 0) {
    Serial.println("HTTPS connection successful!");
    Serial.print("Response code: ");
    Serial.println(httpResponseCode);
  } else {
    Serial.println("HTTPS connection failed!");
    Serial.print("Error: ");
    Serial.println(http.errorToString(httpResponseCode));
  }
  http.end();
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
  int flameValue = digitalRead(flame);
  int flameStatus = (flameValue == HIGH) ? 0 : 1; // 0 = no flame, 1 = flame

  if (isnan(h) || isnan(t)) {
    Serial.println("Failed to read sensor data");
    return;
  }

  HTTPClient http;
  String url = String(backendUrl) + "/esp32/sensors";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  // For HTTPS, we need to skip certificate verification in development
  http.setInsecure();

  // Create JSON payload
  String jsonPayload = "{\"temperature\":" + String(t, 1) + 
                      ",\"humidity\":" + String(h, 1) + 
                      ",\"lightLevel\":" + String(lightLevel) + 
                      ",\"flameStatus\":" + String(flameStatus) + "}";

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
  // For HTTPS, we need to skip certificate verification in development
  http.setInsecure();
  
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
        
        // Only update if not in prayer time and within working hours
        if (!isInSalah && isWithinWorkingHours()) {
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
        } else {
          Serial.println("Relay changes blocked - Prayer time or outside working hours");
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
  // For HTTPS, we need to skip certificate verification in development
  http.setInsecure();
  
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

// Get working hours from backend
void getWorkingHours() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected");
    return;
  }

  HTTPClient http;
  String url = String(backendUrl) + "/esp32/working-hours";
  http.begin(url);
  // For HTTPS, we need to skip certificate verification in development
  http.setInsecure();
  
  int httpResponseCode = http.GET();
  
  if (httpResponseCode > 0) {
    String payload = http.getString();
    Serial.println("Working hours response: " + payload);
    
    // Parse JSON response
    DynamicJsonDocument doc(1024);
    DeserializationError error = deserializeJson(doc, payload);
    
    if (!error) {
      if (doc["success"] == true && doc.containsKey("data")) {
        JsonObject data = doc["data"];
        
        workingHours.name = data["name"].as<String>();
        workingHours.startHour = data["startHour"] | 8;
        workingHours.startMinute = data["startMinute"] | 0;
        workingHours.endHour = data["endHour"] | 17;
        workingHours.endMinute = data["endMinute"] | 0;
        workingHours.isActive = data["isActive"] | true;
        
        Serial.println("Updated working hours: " + workingHours.name);
        Serial.print("Start: ");
        Serial.print(workingHours.startHour);
        Serial.print(":");
        Serial.println(workingHours.startMinute);
        Serial.print("End: ");
        Serial.print(workingHours.endHour);
        Serial.print(":");
        Serial.println(workingHours.endMinute);
      }
    } else {
      Serial.println("JSON parsing failed for working hours");
    }
  } else {
    Serial.println("Error getting working hours: " + http.errorToString(httpResponseCode));
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

bool isWithinWorkingHours() {
  if (!workingHours.isActive) return true; // If working hours are disabled, always allow
  
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) return false;
  
  int nowMinutes = timeinfo.tm_hour * 60 + timeinfo.tm_min;
  int startMinutes = workingHours.startHour * 60 + workingHours.startMinute;
  int endMinutes = workingHours.endHour * 60 + workingHours.endMinute;
  
  return (nowMinutes >= startMinutes && nowMinutes <= endMinutes);
}

// Enhanced function to handle working hours start and end times
void handleWorkingHoursEnd() {
  if (!workingHours.isActive) return; // If working hours are disabled, do nothing
  
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) return;
  
  int nowMinutes = timeinfo.tm_hour * 60 + timeinfo.tm_min;
  int startMinutes = workingHours.startHour * 60 + workingHours.startMinute;
  int endMinutes = workingHours.endHour * 60 + workingHours.endMinute;
  
  // Check if we've reached or passed the end time (within 5 minutes tolerance)
  if (nowMinutes >= endMinutes && nowMinutes <= endMinutes + 5) {
    // Check if relays are still ON (to avoid repeated shutdown)
    if (relay1State || relay2State || relay3State || relay4State) {
      // AUTOMATIC SHUTDOWN: Shut down all relays at end time
      digitalWrite(comp1, HIGH);  // Relay 1 OFF
      digitalWrite(comp2, HIGH);  // Relay 2 OFF
      digitalWrite(comp3, HIGH);  // Relay 3 OFF
      digitalWrite(comp4, HIGH);  // Relay 4 OFF
      
      // Update relay states
      relay1State = false;
      relay2State = false;
      relay3State = false;
      relay4State = false;
      
      // Visual indication
      digitalWrite(red, HIGH);
      digitalWrite(green, LOW);
      digitalWrite(buzzer, HIGH);
      delay(2000); // Buzzer for 2 seconds
      digitalWrite(buzzer, LOW);
      
      Serial.println("Working hours ended - All relays automatically turned OFF");
      
      // Update LCD
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Working Hours");
      lcd.setCursor(0, 1);
      lcd.print("Ended - Relays OFF");
      delay(3000); // Show message for 3 seconds
    }
  }
  
  // Check if we've just started working hours (within 5 minutes tolerance)
  if (nowMinutes >= startMinutes && nowMinutes <= startMinutes + 5) {
    // Optional: You can add logic here if you want to do something when working hours start
    Serial.println("Working hours started");
  }
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

    Serial.print("Working Hours Status: ");
    Serial.println(isWithinWorkingHours() ? "Within Working Hours" : "Outside Working Hours");
    
    if (workingHours.isActive) {
      Serial.print("Working Hours End: ");
      Serial.print(workingHours.endHour);
      Serial.print(":");
      if (workingHours.endMinute < 10) Serial.print("0");
      Serial.println(workingHours.endMinute);
    }

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
    
    // AUTOMATIC SHUTDOWN: Turn off all relays during prayer
    if (relay1State || relay2State || relay3State || relay4State) {
      digitalWrite(comp1, HIGH);  // Relay 1 OFF
      digitalWrite(comp2, HIGH);  // Relay 2 OFF
      digitalWrite(comp3, HIGH);  // Relay 3 OFF
      digitalWrite(comp4, HIGH);  // Relay 4 OFF
      
      relay1State = false;
      relay2State = false;
      relay3State = false;
      relay4State = false;
      
      Serial.println("Prayer time started - All relays automatically turned OFF");
    }
    
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

// Continuous monitoring function to handle automatic shutdowns (runs every loop)
void continuousTimeMonitoring() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) return;
  
  int nowMinutes = timeinfo.tm_hour * 60 + timeinfo.tm_min;
  int currentDay = timeinfo.tm_yday; // Day of year (0-365)
  
  // Check prayer times continuously (not just every minute)
  bool salahActive = false;
  String salahName = "";
  
  for (int i = 0; i < prayerTimeCount; i++) {
    int salahStart = prayerTimes[i].hour * 60 + prayerTimes[i].minute;
    int salahEnd = salahStart + prayerTimes[i].duration;
    
    if (nowMinutes >= salahStart && nowMinutes < salahEnd) {
      salahActive = true;
      salahName = prayerTimes[i].name;
      break;
    }
  }
  
  // AUTOMATIC SHUTDOWN: If prayer time detected and not already in prayer
  if (salahActive && !isInSalah) {
    isInSalah = true;
    currentSalah = salahName;
    
    // Only shut down if we haven't already shut down for this prayer
    if (!lastPrayerShutdown || lastPrayerShutdownName != salahName) {
      // Immediately shut down all relays
      if (relay1State || relay2State || relay3State || relay4State) {
        digitalWrite(comp1, HIGH);  // Relay 1 OFF
        digitalWrite(comp2, HIGH);  // Relay 2 OFF
        digitalWrite(comp3, HIGH);  // Relay 3 OFF
        digitalWrite(comp4, HIGH);  // Relay 4 OFF
        
        relay1State = false;
        relay2State = false;
        relay3State = false;
        relay4State = false;
        
        Serial.println("Prayer time detected - All relays automatically turned OFF");
      }
      
      lastPrayerShutdown = true;
      lastPrayerShutdownName = salahName;
    }
    
    digitalWrite(red, HIGH);
    digitalWrite(green, LOW);
    
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
    
    // Reset prayer shutdown tracking when exiting prayer time
    lastPrayerShutdown = false;
    lastPrayerShutdownName = "";
    
    Serial.println("Exited Salah Time");
  }
  
  // Check working hours end continuously
  if (workingHours.isActive) {
    int endMinutes = workingHours.endHour * 60 + workingHours.endMinute;
    
    // Reset working hours shutdown tracking at start of new day
    if (currentDay != lastWorkingHoursEndDay) {
      lastWorkingHoursShutdown = false;
      lastWorkingHoursEndDay = currentDay;
    }
    
    // AUTOMATIC SHUTDOWN: If working hours just ended (within 5 minutes tolerance)
    if (nowMinutes >= endMinutes && nowMinutes <= endMinutes + 5) {
      if (!lastWorkingHoursShutdown && (relay1State || relay2State || relay3State || relay4State)) {
        // Shut down all relays
        digitalWrite(comp1, HIGH);  // Relay 1 OFF
        digitalWrite(comp2, HIGH);  // Relay 2 OFF
        digitalWrite(comp3, HIGH);  // Relay 3 OFF
        digitalWrite(comp4, HIGH);  // Relay 4 OFF
        
        relay1State = false;
        relay2State = false;
        relay3State = false;
        relay4State = false;
        
        // Visual indication
        digitalWrite(red, HIGH);
        digitalWrite(green, LOW);
        digitalWrite(buzzer, HIGH);
        delay(2000); // Buzzer for 2 seconds
        digitalWrite(buzzer, LOW);
        
        Serial.println("Working hours ended - All relays automatically turned OFF");
        
        // Update LCD
        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("Working Hours");
        lcd.setCursor(0, 1);
        lcd.print("Ended - Relays OFF");
        delay(3000); // Show message for 3 seconds
        
        // Mark that we've shut down for working hours end today
        lastWorkingHoursShutdown = true;
      }
    }
  }
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
  pinMode(flame, INPUT); // Initialize flame sensor pin

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
  getWorkingHours(); // Get initial working hours
  
  Serial.println("System initialized successfully");
}

void loop() {
  unsigned long currentMillis = millis();

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

  // Check working hours every 1 minute
  if (currentMillis - lastWorkingHoursCheck >= WORKING_HOURS_INTERVAL) {
    getWorkingHours();
    handleWorkingHoursEnd(); // Check if working hours just ended
    lastWorkingHoursCheck = currentMillis;
  }

  // Update LCD and handle buzzer
  updateLCD();
  handleBuzzerBeep();
  continuousTimeMonitoring(); // Run continuous monitoring

  // Small delay to prevent watchdog issues
  delay(100);
} 