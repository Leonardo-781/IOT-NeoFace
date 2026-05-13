# 🔧 CONFIGURAR ESP32 PARA SERVER-STI

Como configurar ESP32/ESP8266 para conectar ao servidor-sti (192.168.1.10).

---

## 📍 IP do Server-STI

**Padrão:** `192.168.1.10`

Se seu server-sti está em outro IP, descubra com:

```bash
ssh pi@192.168.1.10
hostname -I
```

---

## ⚡ Editar ESP32 Code

Abra [esp32_gateway.ino](esp32/esp32_gateway.ino) e altere:

### Configurar WiFi
```cpp
#define WIFI_SSID "seu-wifi"
#define WIFI_PASSWORD "sua-senha"
```

### Configurar API Gateway
```cpp
#define API_URL "http://192.168.1.10:3001/api/ingest"
```

---

## 📤 Upload no ESP32

1. **Arduino IDE** → Tools → Board → **ESP32 Dev Module**
2. **Arduino IDE** → Tools → Port → Selecione porta COM/USB
3. **Ctrl+U** para upload

---

## ✔️ Testar

1. Serial Monitor (115200 baud)
2. ESP32 deve conectar ao WiFi
3. Dashboard deve mostrar dados: `http://192.168.1.10`

✅ Sucesso!

---

## 🆘 Troubleshooting

### Não conecta ao WiFi
- SSID/Password correto?
- ESP32 suporta apenas WiFi 2.4GHz

### Dados não chegam
- Server-STI está online? `http://192.168.1.10`
- Firewall bloqueando porta 3001?
- Backend rodando? `ssh pi@192.168.1.10 'docker-compose ps'`

---

## 📊 URLs

| Componente | URL | Para |
|-----------|-----|------|
| **Dashboard** | http://192.168.1.10 | Ver dados |
| **Gateway** | http://192.168.1.10:3001 | ESP32 enviar |
| **Health** | http://192.168.1.10:3001/health | Verificar status |

---

**Pronto!** Sistema IoT conectado ao server-sti! 🚀
