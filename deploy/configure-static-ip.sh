#!/usr/bin/env bash
set -euo pipefail

# Script para configurar IP estático no Raspberry Pi
# Uso: sudo bash configure-static-ip.sh [interface] [ip] [gateway] [dns1] [dns2]
# Exemplo: sudo bash configure-static-ip.sh eth0 192.168.1.100 192.168.1.1 8.8.8.8 8.8.4.4

INTERFACE="${1:-eth0}"
STATIC_IP="${2:-192.168.1.100}"
GATEWAY="${3:-192.168.1.1}"
DNS1="${4:-8.8.8.8}"
DNS2="${5:-8.8.4.4}"

if [ "$(id -u)" -ne 0 ]; then
  echo "Execute como root: sudo bash deploy/configure-static-ip.sh" >&2
  exit 1
fi

echo "Configurando IP estático no Raspberry Pi..."
echo "Interface: $INTERFACE"
echo "IP: $STATIC_IP"
echo "Gateway: $GATEWAY"
echo "DNS: $DNS1 $DNS2"

# Criar backup da configuração original
cp /etc/dhcpcd.conf /etc/dhcpcd.conf.backup.$(date +%s)

# Adicionar configuração de IP estático ao final do arquivo
cat >> /etc/dhcpcd.conf <<EOF

# Configuração adicionada por configure-static-ip.sh
interface $INTERFACE
static ip_address=$STATIC_IP/24
static routers=$GATEWAY
static domain_name_servers=$DNS1 $DNS2
EOF

echo "✓ Configuração adicionada ao /etc/dhcpcd.conf"
echo "✓ Backup criado: /etc/dhcpcd.conf.backup.*"

# Reiniciar o serviço de rede
systemctl restart dhcpcd

echo "✓ Serviço dhcpcd reiniciado"
echo ""
echo "IP estático configurado! O Raspberry Pi agora usa: $STATIC_IP"
echo "Para confirmar, execute: ip addr show $INTERFACE"
echo ""
echo "IMPORTANTE: Para acesso externo à sua rede, você também precisa:"
echo "1. Configurar PORT FORWARDING no seu roteador"
echo "2. Apontar a porta 80/443 do roteador para $STATIC_IP:3000 (backend) ou :3001 (API)"
echo "3. Usar um serviço de DDNS se seu ISP usa IP dinâmico"
