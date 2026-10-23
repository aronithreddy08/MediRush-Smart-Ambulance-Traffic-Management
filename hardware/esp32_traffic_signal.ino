/*
 * MediRush - ESP32 Smart Traffic Signal Priority Node
 * 
 * Hardware Setup:
 * - Red LED -> GPIO 25
 * - Yellow LED -> GPIO 26
 * - Green LED -> GPIO 27
 * - Buzzer (Optional Siren) -> GPIO 32
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// MediRush Backend Server endpoint
const char* serverUrl = "http://192.168.1.100:8000/api/v1/signals/hardware-ping";
const char* signalId = "SIG_CONNAUGHT_CIRCUS_N";

#define PIN_RED 25
#define PIN_YELLOW 26
#define PIN_GREEN 27
#define PIN_BUZZER 32

void setup() {
  Serial.begin(115200);
  pinMode(PIN_RED, OUTPUT);
  pinMode(PIN_YELLOW, OUTPUT);
  pinMode(PIN_GREEN, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);

  // Initial state: Red
  digitalWrite(PIN_RED, HIGH);
  digitalWrite(PIN_YELLOW, LOW);
  digitalWrite(PIN_GREEN, LOW);

  WiFi.begin(ssid, password);
  Serial.print("Connecting to MediRush IoT Mesh WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected! Node IP: " + WiFi.localIP().toString());
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    StaticJsonDocument<200> doc;
    doc["device_id"] = "ESP32_NODE_01";
    doc["signal_id"] = signalId;
    doc["ip_address"] = WiFi.localIP().toString();

    String requestBody;
    serializeJson(doc, requestBody);

    int httpResponseCode = http.POST(requestBody);

    if (httpResponseCode == 200) {
      String response = http.getString();
      StaticJsonDocument<300> resDoc;
      deserializeJson(resDoc, response);

      const char* state = resDoc["current_state"];
      bool isPreempted = resDoc["is_preempted"];

      Serial.printf("Signal %s State: %s | Preempted: %s\n", signalId, state, isPreempted ? "YES" : "NO");

      if (strcmp(state, "GREEN") == 0 || strcmp(state, "PREEMPTION_GREEN") == 0 || isPreempted) {
        digitalWrite(PIN_RED, LOW);
        digitalWrite(PIN_YELLOW, LOW);
        digitalWrite(PIN_GREEN, HIGH);

        if (isPreempted) {
          // Pulse emergency buzzer for oncoming ambulance
          tone(PIN_BUZZER, 1200, 100);
        } else {
          noTone(PIN_BUZZER);
        }
      } else if (strcmp(state, "YELLOW") == 0) {
        digitalWrite(PIN_RED, LOW);
        digitalWrite(PIN_YELLOW, HIGH);
        digitalWrite(PIN_GREEN, LOW);
        noTone(PIN_BUZZER);
      } else { // RED
        digitalWrite(PIN_RED, HIGH);
        digitalWrite(PIN_YELLOW, LOW);
        digitalWrite(PIN_GREEN, LOW);
        noTone(PIN_BUZZER);
      }
    } else {
      Serial.printf("HTTP Ping Failed with code: %d\n", httpResponseCode);
    }
    http.end();
  }

  delay(600); // 600ms polling rate for responsive green wave
}
