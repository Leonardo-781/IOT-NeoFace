#include <WiFi.h>
#include <esp_now.h>
#include <HTTPClient.h>

// Gateway ESP32: recebe pacotes via ESP-NOW e encaminha para o backend via HTTP.
// Ajuste SSID, senha e IP do servidor antes de usar.

#define WIFI_SSID "SEU_WIFI"
#define WIFI_PASSWORD "SUA_SENHA"

// ⚠️ IMPORTANTE: Mude para o IP do server-sti
// Padrão: 192.168.1.10 (ajuste conforme sua rede)
#define API_URL "http://192.168.1.10:3001/api/ingest"

// Para descobrir IP do server-sti:
// No servidor: hostname -I
// Não use 127.0.0.1 ou localhost - ESP32 precisa do IP real na rede!

#define GATEWAY_ID "GW01"

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

SensorPacket incomingPacket;

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Conectando ao Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print('.');
  }
  Serial.println();
  Serial.print("Wi-Fi conectado, IP: ");
  Serial.println(WiFi.localIP());
}

String packetToJson(const SensorPacket &packet, int rssiValue) {
  char json[512];
  snprintf(
    json,
    sizeof(json),
    "{\"deviceId\":\"%s\",\"nodeId\":\"%s\",\"gatewayId\":\"%s\",\"ts\":\"%s\",\"seq\":%lu,\"rssi\":%d,\"battery\":%.2f,\"sensors\":{\"bme280\":{\"temperature_c\":%.1f,\"humidity_pct\":%.1f,\"pressure_hpa\":%.1f},\"ldr\":{\"light_raw\":%u,\"light_pct\":%u}}}",
    packet.deviceId,
    packet.nodeId,
    GATEWAY_ID,
    packet.ts,
    static_cast<unsigned long>(packet.seq),
    rssiValue,
    packet.battery,
    packet.temperatureC,
    packet.humidityPct,
    packet.pressureHpa,
    packet.lightRaw,
    packet.lightPct
  );
  return String(json);
}

bool postTelemetryToBackend(const String &payload) {
  if (WiFi.status() != WL_CONNECTED) {
    return false;
  }

  HTTPClient http;
  http.begin(API_URL);
  http.addHeader("Content-Type", "application/json");
  int statusCode = http.POST(payload);
  String body = http.getString();
  http.end();

  Serial.print("Backend status: ");
  Serial.println(statusCode);
  Serial.println(body);

  return statusCode >= 200 && statusCode < 300;
}

void onDataReceive(const esp_now_recv_info_t *recvInfo, const uint8_t *incomingData, int len) {
  if (len != sizeof(SensorPacket)) {
    Serial.println("Pacote invalido recebido via ESP-NOW");
    return;
  }

  memcpy(&incomingPacket, incomingData, sizeof(incomingPacket));

  int rssiValue = -60;
  if (recvInfo && recvInfo->rx_ctrl) {
    rssiValue = recvInfo->rx_ctrl->rssi;
  }

  String jsonPayload = packetToJson(incomingPacket, rssiValue);
  Serial.println(jsonPayload);
  bool ok = postTelemetryToBackend(jsonPayload);
  Serial.println(ok ? "Telemetria encaminhada com sucesso" : "Falha ao encaminhar telemetria");
}

void setupEspNow() {
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();

  if (esp_now_init() != ESP_OK) {
    Serial.println("Falha ao iniciar ESP-NOW");
    while (true) {
      delay(1000);
    }
  }

  esp_now_register_recv_cb(onDataReceive);

  Serial.print("Gateway MAC: ");
  Serial.println(WiFi.macAddress());
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  connectWiFi();
  setupEspNow();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }
  delay(1000);
}
