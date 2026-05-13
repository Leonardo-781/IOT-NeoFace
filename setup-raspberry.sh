#!/bin/bash
# Script de setup do Raspberry Pi - PostgreSQL
# Uso: ssh rasp-local 'bash -s' < setup-raspberry.sh

set -e

echo ""
echo "========================================="
echo "Setup PostgreSQL no Raspberry Pi"
echo "========================================="
echo ""

# ============================================
# 1. Atualizar sistema
# ============================================
echo "[1] Atualizando sistema..."
sudo apt update -y
sudo apt upgrade -y
echo "✓ Sistema atualizado"

# ============================================
# 2. Instalar PostgreSQL
# ============================================
echo ""
echo "[2] Instalando PostgreSQL 16..."
sudo apt install postgresql postgresql-contrib -y
echo "✓ PostgreSQL instalado"

# ============================================
# 3. Verificar status
# ============================================
echo ""
echo "[3] Verificando status..."
sudo systemctl status postgresql --no-pager | grep Active
echo "✓ PostgreSQL está rodando"

# ============================================
# 4. Criar database e usuário
# ============================================
echo ""
echo "[4] Criando database iot_monitoring..."

sudo -u postgres psql << SQL
CREATE DATABASE iot_monitoring;
CREATE USER iot_user WITH PASSWORD 'iot_pass123';
GRANT ALL PRIVILEGES ON DATABASE iot_monitoring TO iot_user;
SQL

echo "✓ Database e usuário criados"

# ============================================
# 5. Configurar acesso remoto
# ============================================
echo ""
echo "[5] Configurando acesso remoto..."

# Backup dos arquivos originais
sudo cp /etc/postgresql/16/main/postgresql.conf /etc/postgresql/16/main/postgresql.conf.bak
sudo cp /etc/postgresql/16/main/pg_hba.conf /etc/postgresql/16/main/pg_hba.conf.bak

# Modificar postgresql.conf
sudo sed -i "s/^#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/16/main/postgresql.conf

# Adicionar ao pg_hba.conf
echo "host  iot_monitoring  iot_user  0.0.0.0/0  md5" | sudo tee -a /etc/postgresql/16/main/pg_hba.conf > /dev/null
echo "host  iot_monitoring  iot_user  ::/0       md5" | sudo tee -a /etc/postgresql/16/main/pg_hba.conf > /dev/null

echo "✓ Acesso remoto configurado"

# ============================================
# 6. Criar tabelas
# ============================================
echo ""
echo "[6] Criando tabelas..."

sudo -u postgres psql iot_monitoring << SQL
CREATE TABLE devices (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(100),
    ip_address INET,
    status VARCHAR(20) DEFAULT 'online',
    last_seen TIMESTAMP DEFAULT NOW(),
    firmware_version VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE telemetry (
    time TIMESTAMP DEFAULT NOW(),
    device_id INTEGER NOT NULL REFERENCES devices(id),
    temperature_c FLOAT,
    humidity_percent FLOAT,
    pressure_hpa FLOAT,
    rssi_dbm INTEGER,
    battery_voltage FLOAT,
    PRIMARY KEY (time, device_id)
);

CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    device_id INTEGER NOT NULL REFERENCES devices(id),
    alert_type VARCHAR(50),
    severity VARCHAR(20),
    message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP
);

CREATE INDEX idx_telemetry_device_time ON telemetry(device_id, time DESC);
CREATE INDEX idx_telemetry_time ON telemetry(time DESC);
CREATE INDEX idx_devices_status ON devices(status);
SQL

echo "✓ Tabelas criadas"

# ============================================
# 7. Reiniciar PostgreSQL
# ============================================
echo ""
echo "[7] Reiniciando PostgreSQL..."
sudo systemctl restart postgresql
sleep 2
echo "✓ PostgreSQL reiniciado"

# ============================================
# 8. Informações finais
# ============================================
echo ""
echo "========================================="
echo "✨ SETUP CONCLUÍDO!"
echo "========================================="
echo ""
echo "📊 INFORMAÇÕES DO BANCO:"
echo "  • Host: $(hostname -I | awk '{print $1}')"
echo "  • Porta: 5432"
echo "  • Database: iot_monitoring"
echo "  • Usuário: iot_user"
echo "  • Senha: iot_pass123"
echo ""
echo "📋 COMANDOS ÚTEIS:"
echo "  • Ver status: sudo systemctl status postgresql"
echo "  • Ver logs: sudo tail -f /var/log/postgresql/postgresql-16-main.log"
echo "  • Conectar: psql -U iot_user -d iot_monitoring"
echo ""
echo "✅ Pronto para usar!"
echo ""
