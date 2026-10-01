import { User, Channel, ChannelMember, Contact, VoiceMessage, EmergencyAlert, UserSettingsRecord } from '../types';

// Colección inicial vacía para cuentas limpias y aisladas por usuario
export const INITIAL_USERS: User[] = [];

// Lista inicial vacía de canales: cada nuevo usuario/organización crea sus propios canales tácticos
export const INITIAL_CHANNELS: Channel[] = [];

export const INITIAL_CHANNEL_MEMBERS: ChannelMember[] = [];

// Contactos aislados por cuenta (sin contactos precargados)
export const INITIAL_CONTACTS: Contact[] = [];

// Bitácora de transmisiones PTT en blanco
export const INITIAL_VOICE_MESSAGES: VoiceMessage[] = [];

// Mensajes de chat en blanco para nuevas cuentas
export const INITIAL_CHAT_MESSAGES: any[] = [];

export const INITIAL_SECURITY_LOGS: any[] = [];

export const INITIAL_EMERGENCY_ALERTS: EmergencyAlert[] = [];

export const INITIAL_USER_SETTINGS: UserSettingsRecord[] = [];


export const C5I_REINFORCED_DATABASE_SCHEMA_SQL = `-- ==============================================================
-- SISTEMA DE RADIOCOMUNICACIÓN TÁCTICA C5i HIDALGO
-- ESQUEMA REFORZADO DE BASE DE DATOS (MySQL 8.0+ / MariaDB 10.5+)
-- PROTECCIÓN: TDE (Cifrado en Reposo), Salteo Criptográfico,
-- Anti-Fuerza Bruta, E2EE, Anti-Replay y Bitácora Forense
-- ==============================================================

CREATE DATABASE IF NOT EXISTS \`walkiet_db\`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci
  ENCRYPTION='Y';

USE \`walkiet_db\`;

-- --------------------------------------------------------
-- 1. TABLA DE USUARIOS Y OFICIALES CON SALTEO CRIPTOGRÁFICO
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`phone_number\` VARCHAR(20) NOT NULL,
  \`name\` VARCHAR(120) NOT NULL,
  \`correo\` VARCHAR(120) DEFAULT NULL,
  \`callsign\` VARCHAR(50) NOT NULL COMMENT 'Indicativo de radio (ej. PATRULLA-302)',
  \`unit\` VARCHAR(120) DEFAULT 'Sector Operativo Hidalgo',
  \`role\` VARCHAR(60) NOT NULL DEFAULT 'Oficial Operativo',
  \`id_rol\` INT NOT NULL DEFAULT 3 COMMENT '1=Comandante C5i, 2=Despachador 911, 3=Oficial, 4=Paramédico',
  \`password_hash\` VARCHAR(255) NOT NULL COMMENT 'Hash Argon2id o PBKDF2-SHA512',
  \`salt\` VARCHAR(64) NOT NULL COMMENT 'Salt individual criptográfico de 256 bits',
  \`auth_algorithm\` VARCHAR(30) NOT NULL DEFAULT 'PBKDF2-SHA512',
  \`e2ee_public_key\` TEXT DEFAULT NULL COMMENT 'Clave pública ECDH para cifrado E2EE',
  \`failed_login_attempts\` INT NOT NULL DEFAULT 0 COMMENT 'Contador anti-fuerza bruta',
  \`locked_until\` DATETIME DEFAULT NULL COMMENT 'Bloqueo temporal por intentos fallidos',
  \`last_login_at\` DATETIME DEFAULT NULL,
  \`last_ip\` VARCHAR(45) DEFAULT NULL,
  \`avatar_url\` TEXT DEFAULT NULL,
  \`status\` ENUM('online', 'offline', 'transmitting', 'busy', 'emergency') NOT NULL DEFAULT 'offline',
  \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_phone_number\` (\`phone_number\`),
  UNIQUE KEY \`uk_correo\` (\`correo\`),
  INDEX \`idx_callsign\` (\`callsign\`),
  INDEX \`idx_status\` (\`status\`),
  INDEX \`idx_locked\` (\`locked_until\`)
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 2. TABLA DE CANALES TÁCTICOS Y NIVELES DE DESPACHO
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`channels\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`name\` VARCHAR(100) NOT NULL,
  \`is_private\` TINYINT(1) NOT NULL DEFAULT 0,
  \`access_code\` VARCHAR(255) DEFAULT NULL COMMENT 'Código de acceso cifrado',
  \`created_by\` VARCHAR(64) NOT NULL,
  \`category\` ENUM('general', 'emergencia', 'tactico', 'vialidad', 'inteligencia') NOT NULL DEFAULT 'general',
  \`clearance_level\` TINYINT NOT NULL DEFAULT 1 COMMENT '1=Abierto, 2=Policial, 3=Mando Táctico',
  \`is_encrypted\` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1=Cifrado AES-256-GCM Activo',
  \`encryption_cipher\` VARCHAR(30) NOT NULL DEFAULT 'AES-256-GCM',
  \`member_count\` INT NOT NULL DEFAULT 1,
  \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  INDEX \`idx_channel_category\` (\`category\`),
  INDEX \`idx_channel_clearance\` (\`clearance_level\`),
  CONSTRAINT \`fk_channels_created_by\` FOREIGN KEY (\`created_by\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 3. MIEMBROS DE CANALES Y ROLES OPERATIVOS
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`channel_members\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`channel_id\` VARCHAR(64) NOT NULL,
  \`user_id\` VARCHAR(64) NOT NULL,
  \`role_in_channel\` ENUM('owner', 'admin', 'member', 'listener') NOT NULL DEFAULT 'member',
  \`is_muted\` TINYINT(1) NOT NULL DEFAULT 0,
  \`joined_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_channel_user\` (\`channel_id\`, \`user_id\`),
  INDEX \`idx_cm_user\` (\`user_id\`),
  CONSTRAINT \`fk_cm_channel\` FOREIGN KEY (\`channel_id\`) REFERENCES \`channels\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_cm_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 4. CONTACTOS Y ENLACES DIRECTOS 1-A-1
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`contacts\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`user_id\` VARCHAR(64) NOT NULL,
  \`contact_user_id\` VARCHAR(64) NOT NULL,
  \`alias\` VARCHAR(100) DEFAULT NULL,
  \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_contact_pair\` (\`user_id\`, \`contact_user_id\`),
  CONSTRAINT \`fk_contacts_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_contacts_target\` FOREIGN KEY (\`contact_user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 5. TRANSMISIONES DE VOZ PTT CON INTEGRIDAD Y ANTI-REPLAY
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`voice_messages\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`sender_id\` VARCHAR(64) NOT NULL,
  \`channel_id\` VARCHAR(64) DEFAULT NULL,
  \`receiver_id\` VARCHAR(64) DEFAULT NULL,
  \`audio_url\` MEDIUMTEXT NOT NULL,
  \`duration_seconds\` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  \`is_emergency\` TINYINT(1) NOT NULL DEFAULT 0,
  \`is_encrypted\` TINYINT(1) NOT NULL DEFAULT 1,
  \`encryption_cipher\` VARCHAR(30) NOT NULL DEFAULT 'AES-256-GCM',
  \`nonce\` VARCHAR(64) NOT NULL COMMENT 'Nonce único para prevenir ataques de repetición',
  \`hmac_signature\` VARCHAR(128) NOT NULL COMMENT 'Firma criptográfica HMAC-SHA256',
  \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_transmission_nonce\` (\`nonce\`),
  INDEX \`idx_vm_channel\` (\`channel_id\`, \`created_at\`),
  INDEX \`idx_vm_receiver\` (\`receiver_id\`, \`created_at\`),
  INDEX \`idx_vm_sender\` (\`sender_id\`, \`created_at\`),
  CONSTRAINT \`fk_vm_sender\` FOREIGN KEY (\`sender_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 6. MENSAJES DE CHAT TÁCTICO, IMÁGENES Y GEOLOCALIZACIÓN
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`chat_messages\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`sender_id\` VARCHAR(64) NOT NULL,
  \`sender_name\` VARCHAR(120) NOT NULL,
  \`sender_callsign\` VARCHAR(50) DEFAULT NULL,
  \`sender_avatar\` TEXT DEFAULT NULL,
  \`channel_id\` VARCHAR(64) DEFAULT NULL,
  \`receiver_id\` VARCHAR(64) DEFAULT NULL,
  \`type\` ENUM('text', 'audio', 'image', 'video', 'location', 'alert', 'emergency') NOT NULL DEFAULT 'text',
  \`content\` TEXT NOT NULL,
  \`media_url\` MEDIUMTEXT DEFAULT NULL,
  \`media_name\` VARCHAR(255) DEFAULT NULL,
  \`media_size_bytes\` INT DEFAULT NULL,
  \`duration_seconds\` DECIMAL(5,2) DEFAULT NULL,
  \`location_data\` JSON DEFAULT NULL COMMENT 'Coordenadas {latitude, longitude, accuracy}',
  \`status\` ENUM('sending', 'sent', 'delivered', 'read') NOT NULL DEFAULT 'delivered',
  \`is_emergency\` TINYINT(1) NOT NULL DEFAULT 0,
  \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  INDEX \`idx_chat_channel\` (\`channel_id\`, \`created_at\`),
  INDEX \`idx_chat_receiver\` (\`receiver_id\`, \`created_at\`),
  INDEX \`idx_chat_sender\` (\`sender_id\`, \`created_at\`),
  CONSTRAINT \`fk_chat_sender\` FOREIGN KEY (\`sender_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 7. BITÁCORA FORENSE DE SEGURIDAD (AUDIT TRAIL)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`security_audit_log\` (
  \`id\` BIGINT NOT NULL AUTO_INCREMENT,
  \`event_type\` ENUM(
    'LOGIN_SUCCESS',
    'LOGIN_FAILED',
    'RATE_LIMIT_BLOCKED',
    'PTT_BURST_VERIFIED',
    'REPLAY_ATTACK_PREVENTED',
    'INVALID_HMAC',
    'SESSION_EXPIRED'
  ) NOT NULL,
  \`user_id\` VARCHAR(64) DEFAULT NULL,
  \`ip_address\` VARCHAR(45) NOT NULL,
  \`user_agent\` VARCHAR(255) DEFAULT NULL,
  \`details\` TEXT DEFAULT NULL,
  \`severity\` ENUM('INFO', 'WARNING', 'CRITICAL') NOT NULL DEFAULT 'INFO',
  \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  INDEX \`idx_audit_event\` (\`event_type\`, \`created_at\`),
  INDEX \`idx_audit_ip\` (\`ip_address\`, \`created_at\`),
  INDEX \`idx_audit_user\` (\`user_id\`, \`created_at\`)
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 8. TABLA EFÍMERA ANTI-REPETICIÓN (NONCE CACHE)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`anti_replay_nonces\` (
  \`nonce\` VARCHAR(64) NOT NULL,
  \`transmitter_id\` VARCHAR(64) NOT NULL,
  \`timestamp_sent\` BIGINT NOT NULL,
  \`received_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`nonce\`),
  INDEX \`idx_nonce_time\` (\`received_at\`)
) ENGINE=MEMORY DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- 9. TABLA DE ALERTAS SOS Y DESPACHO DE EMERGENCIA C5i
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`emergency_alerts\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`officer_id\` VARCHAR(64) NOT NULL,
  \`officer_name\` VARCHAR(120) NOT NULL,
  \`officer_callsign\` VARCHAR(50) NOT NULL,
  \`channel_id\` VARCHAR(64) DEFAULT NULL,
  \`latitude\` DECIMAL(10, 7) NOT NULL COMMENT 'Coordenada Latitud GPS satelital detectada automáticamente',
  \`longitude\` DECIMAL(10, 7) NOT NULL COMMENT 'Coordenada Longitud GPS satelital detectada automáticamente',
  \`accuracy_meters\` INT NOT NULL DEFAULT 10 COMMENT 'Precisión del dispositivo en metros',
  \`location_name\` VARCHAR(255) NOT NULL COMMENT 'Dirección o sector de referencia despachado',
  \`protocol_text\` TEXT NOT NULL COMMENT 'Protocolo: Al activar la alerta se emitira una sirena sonora en todos los radios disponibles en la zona y se asignara prioridad absoluta a tu frecuencia',
  \`status\` ENUM('active', 'in_progress', 'attended', 'resolved') NOT NULL DEFAULT 'active',
  \`push_notified\` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1=Push broadcast emitido a todos los radios',
  \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  INDEX \`idx_sos_officer\` (\`officer_id\`),
  INDEX \`idx_sos_status\` (\`status\`),
  INDEX \`idx_sos_created\` (\`created_at\`),
  CONSTRAINT \`fk_sos_officer\` FOREIGN KEY (\`officer_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 10. TABLA DE CONFIGURACIÓN Y AJUSTES ESENCIALES POR USUARIO
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`user_settings\` (
  \`user_id\` VARCHAR(64) NOT NULL,
  \`theme_mode\` ENUM('light', 'dark', 'system') NOT NULL DEFAULT 'system' COMMENT 'Tema visual activo',
  \`push_notifications\` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Notificaciones en segundo plano',
  \`channel_message_sounds\` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Sonido de aviso al recibir mensaje en canal',
  \`ptt_mode\` ENUM('hold', 'toggle') NOT NULL DEFAULT 'hold' COMMENT 'Modo botón central: Mantener o Alternar',
  \`roger_beep\` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Tono Roger Beep al finalizar transmisión',
  \`vibration_on_ptt\` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Respuesta táctil háptica',
  \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`user_id\`),
  CONSTRAINT \`fk_settings_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;


