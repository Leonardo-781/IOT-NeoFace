#include <WiFi.h>
#include <esp_now.h>
#include <Wire.h>
#include <Adafruit_BME280.h>

// Configuracao basica do sensor node ESP32
// Ajuste o MAC do gateway antes de gravar o firmware.

#define NODE_ID "NODE07"
#define DEVICE_ID "ESP32-001"
#define GATEWAY_ID "GW01"
#define SAMPLE_INTERVAL_MS 300000UL
#define LDR_PIN 34
#define BME_SDA 21
#define BME_SCL 22
#define BME_ADDRESS 0x76

uint8_t gatewayMac[] = {0x24, 0x6F, 0x28, 0xAA, 0xBB, 0xCC};

Adafruit_BME280 bme;

typedef struct __attribute__((packed)) {
  char deviceId[16];
  char nodeId[16];
  char gatewayId[16];
  char ts[24];
  uint32_t seq;
  float temperatureC;
  float humidityPct;
  float pressureHpa;
  uint16_t lightRaw;
  uint8_t lightPct;
  float battery;
} SensorPacket;

SensorPacket packet;
uint32_t seqNumber = 1;
unsigned long lastSampleAt = 0;

String makeIsoTimestamp() {
  time_t now = time(nullptr);
  struct tm timeInfo;
  gmtime_r(&now, &timeInfo);
  char buffer[24];
  strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%SZ", &timeInfo);
  return String(buffer);
}

float readBatteryVoltage() {
  return 3.92f;
}

void fillPacket() {
  memset(&packet, 0, sizeof(packet));
  strlcpy(packet.deviceId, DEVICE_ID, sizeof(packet.deviceId));
  strlcpy(packet.nodeId, NODE_ID, sizeof(packet.nodeId));
  strlcpy(packet.gatewayId, GATEWAY_ID, sizeof(packet.gatewayId));
  String ts = makeIsoTimestamp();
  strlcpy(packet.ts, ts.c_str(), sizeof(packet.ts));
  packet.seq = seqNumber++;
  packet.temperatureC = bme.readTemperature();
  packet.humidityPct = bme.readHumidity();
  packet.pressureHpa = bme.readPressure() / 100.0f;
  packet.lightRaw = analogRead(LDR_PIN);
  packet.lightPct = (uint8_t)constrain(map(packet.lightRaw, 0, 4095, 0, 100), 0, 100);
  packet.battery = readBatteryVoltage();
}

void onDataSent(const uint8_t *macAddr, esp_now_send_status_t status) {
  Serial.print("ESP-NOW send: ");
  Serial.println(status == ESP_NOW_SEND_SUCCESS ? "ok" : "fail");
}

void setupEspNow() {
  WiFi.mode(WIFI_STA);
  WiFi.disconnect(true, true);

  if (esp_now_init() != ESP_OK) {
    Serial.println("Erro ao iniciar ESP-NOW");
    while (true) {
      delay(1000);
    }
  }

  esp_now_register_send_cb(onDataSent);

  esp_now_peer_info_t peerInfo = {};
  memcpy(peerInfo.peer_addr, gatewayMac, 6);
  peerInfo.channel = 0;
  peerInfo.encrypt = false;

  if (esp_now_add_peer(&peerInfo) != ESP_OK) {
    Serial.println("Erro ao registrar gateway como peer");
    while (true) {
      delay(1000);
    }
  }
}

void setupSensors() {
  Wire.begin(BME_SDA, BME_SCL);
  if (!bme.begin(BME_ADDRESS)) {
    Serial.println("BME280 nao encontrado");
    while (true) {
      delay(1000);
    }
  }
  pinMode(LDR_PIN, INPUT);
}

void setupTime() {
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  struct tm timeInfo;
  while (!getLocalTime(&timeInfo)) {
    delay(500);
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("Iniciando node ESP32");
  setupSensors();
  setupTime();
  setupEspNow();
  lastSampleAt = 0;
}

void loop() {
  if (millis() - lastSampleAt < SAMPLE_INTERVAL_MS) {
    delay(100);
    return;
  }

  lastSampleAt = millis();
  fillPacket();

  esp_err_t result = esp_now_send(gatewayMac, reinterpret_cast<uint8_t *>(&packet), sizeof(packet));
  if (result == ESP_OK) {
    Serial.printf("Telemetria enviada | seq=%lu | temp=%.1f | luz=%u%%\n", packet.seq, packet.temperatureC, packet.lightPct);
  } else {
    Serial.printf("Falha ao enviar telemetria: %d\n", result);
  }
}
