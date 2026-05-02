# Deploy no Raspberry Pi

Os arquivos desta pasta ajudam a subir a aplicação como serviço no Raspberry Pi.

## Banco de dados

O projeto usa PostgreSQL. No Raspberry Pi Zero W, a forma mais estável é rodar PostgreSQL puro e manter a configuração em `data/system_config.json` com `enabled: true`. O código tenta aplicar o schema TimescaleDB, mas ignora a falha da extensão se ela não estiver disponível.

## Serviços

- `trabalho-final.service`: backend principal em `server.js`
- `api-gateway.service`: gateway HTTP em `api-server.js`

## Caminho esperado

Os serviços assumem o código no diretório informado no instalador.

## Instalação rápida

```bash
sudo bash deploy/setup-pi.sh leo /home/leo/myapp
```

Se o repositório estiver em outro caminho, troque o segundo argumento. O script escreve os serviços em `/etc/systemd/system/`, copia a configuração do banco e reinicia os serviços.