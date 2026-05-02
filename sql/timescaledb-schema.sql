CREATE EXTENSION IF NOT EXISTS timescaledb;

CREATE TABLE IF NOT EXISTS gateways (
  gateway_id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  host TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'offline',
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nodes (
  node_id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL UNIQUE,
  gateway_id TEXT NOT NULL REFERENCES gateways(gateway_id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'offline',
  seq BIGINT NOT NULL DEFAULT 0,
  rssi INTEGER NOT NULL DEFAULT -80,
  battery NUMERIC(5, 2) NOT NULL DEFAULT 0,
  last_seen TIMESTAMPTZ,
  sampling_interval_sec INTEGER NOT NULL DEFAULT 300,
  mesh_parent TEXT,
  hop_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS telemetry (
  ts TIMESTAMPTZ NOT NULL,
  gateway_id TEXT NOT NULL REFERENCES gateways(gateway_id) ON DELETE CASCADE,
  node_id TEXT NOT NULL REFERENCES nodes(node_id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  seq BIGINT NOT NULL,
  rssi INTEGER,
  battery NUMERIC(5, 2),
  payload JSONB NOT NULL,
  temperature_c NUMERIC(6, 2),
  humidity_pct NUMERIC(6, 2),
  pressure_hpa NUMERIC(6, 2),
  light_pct NUMERIC(6, 2),
  source TEXT NOT NULL DEFAULT 'mqtt'
);

SELECT create_hypertable('telemetry', 'ts', if_not_exists => TRUE);

CREATE INDEX IF NOT EXISTS telemetry_node_ts_idx ON telemetry (node_id, ts DESC);
CREATE INDEX IF NOT EXISTS telemetry_gateway_ts_idx ON telemetry (gateway_id, ts DESC);
CREATE INDEX IF NOT EXISTS telemetry_seq_idx ON telemetry (node_id, seq DESC);

CREATE TABLE IF NOT EXISTS commands (
  command_id TEXT PRIMARY KEY,
  gateway_id TEXT NOT NULL REFERENCES gateways(gateway_id) ON DELETE CASCADE,
  node_id TEXT NOT NULL REFERENCES nodes(node_id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  seq BIGINT NOT NULL,
  action TEXT NOT NULL,
  params JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'queued',
  requested_by JSONB,
  ack JSONB
);

CREATE INDEX IF NOT EXISTS commands_node_ts_idx ON commands (node_id, ts DESC);
CREATE INDEX IF NOT EXISTS commands_status_idx ON commands (status, ts DESC);

CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  gateway_id TEXT NOT NULL REFERENCES gateways(gateway_id) ON DELETE CASCADE,
  node_id TEXT NOT NULL REFERENCES nodes(node_id) ON DELETE CASCADE,
  severity TEXT NOT NULL,
  rule TEXT NOT NULL,
  message TEXT NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  source TEXT NOT NULL DEFAULT 'rules-engine'
);

CREATE INDEX IF NOT EXISTS alerts_status_idx ON alerts (resolved, ts DESC);
CREATE INDEX IF NOT EXISTS alerts_node_ts_idx ON alerts (node_id, ts DESC);

CREATE TABLE IF NOT EXISTS command_acks (
  id TEXT PRIMARY KEY,
  command_id TEXT NOT NULL REFERENCES commands(command_id) ON DELETE CASCADE,
  node_id TEXT NOT NULL REFERENCES nodes(node_id) ON DELETE CASCADE,
  gateway_id TEXT NOT NULL REFERENCES gateways(gateway_id) ON DELETE CASCADE,
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL,
  detail TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS command_acks_command_idx ON command_acks (command_id, ts DESC);

CREATE TABLE IF NOT EXISTS dlq_events (
  id TEXT PRIMARY KEY,
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  gateway_id TEXT,
  node_id TEXT,
  topic TEXT NOT NULL,
  reason TEXT NOT NULL,
  payload JSONB NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS dlq_events_ts_idx ON dlq_events (ts DESC);