# ESP32

Aqui estao os firmwares para o lado embarcado do trabalho final.

## Arquivos

- `esp32_node.ino`: nó sensor com BME280 + LDR, enviando telemetria via ESP-NOW
- `esp32_gateway.ino`: gateway ESP32 que recebe os pacotes e faz POST para o backend local

## Fluxo

1. O node mede sensores e envia um pacote via ESP-NOW.
2. O gateway recebe o pacote.
3. O gateway monta um JSON e publica em `POST /api/ingest` na maquina da API gateway.
4. O dashboard atualiza automaticamente.

## O que ajustar antes de gravar

### No node

- `NODE_ID`
- `DEVICE_ID`
- `GATEWAY_ID`
- `gatewayMac`
- pinos do BME280 e LDR, se necessario

### No gateway

- `WIFI_SSID`
- `WIFI_PASSWORD`
- `API_URL`

## Bibliotecas

No Arduino IDE ou PlatformIO, instale:

- `Adafruit BME280 Library`
- `Adafruit Unified Sensor`
- bibliotecas nativas do ESP32 para Wi-Fi e ESP-NOW

## MAC do gateway

Ligue o gateway, abra o Serial Monitor e copie o MAC impresso em:

```text
Gateway MAC: xx:xx:xx:xx:xx:xx
```

Coloque esse valor no array `gatewayMac` do node.

## Observacao

Este firmware foi pensado para o prototipo do trabalho final. Se quiser, o proximo passo pode ser converter isso para PlatformIO com estrutura completa de projeto.
