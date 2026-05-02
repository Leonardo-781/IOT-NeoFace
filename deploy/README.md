# Deploy no Raspberry Pi

Os arquivos desta pasta ajudam a subir a aplicação como serviço no Raspberry Pi.

## Banco de dados

O projeto usa PostgreSQL. No Raspberry Pi Zero W, a forma mais estável é rodar PostgreSQL puro e manter a configuração em `data/system_config.json` com `enabled: true`. O código tenta aplicar o schema TimescaleDB, mas ignora a falha da extensão se ela não estiver disponível.

## Serviços

- `trabalho-final.service`: backend principal em `server.js`
- `api-gateway.service`: gateway HTTP em `api-server.js`

## Caminho esperado

Os serviços assumem o código em `/opt/iot-neoface`.

## Instalação rápida

```bash
sudo bash deploy/setup-pi.sh pi /opt/iot-neoface
```

Depois copie os arquivos `.service` para `/etc/systemd/system/`, copie `deploy/system_config.pi.json` para `data/system_config.json` se quiser deixar o banco ativado por padrão, ajuste o usuário se necessário e rode:

```bash
sudo systemctl daemon-reload
sudo systemctl enable trabalho-final.service
sudo systemctl enable api-gateway.service
sudo systemctl start trabalho-final.service
sudo systemctl start api-gateway.service
```