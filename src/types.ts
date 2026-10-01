export interface User {
  id: string;
  phone_number: string;
  name: string;
  correo?: string;
  password?: string;
  role?: string;
  id_rol?: number;
  avatar_url?: string | null;
  status: 'online' | 'offline' | 'transmitting';
  created_at?: string;
  updated_at?: string;
  callsign?: string; // Indicativo de radio policial C5i (ej. C5-ALFA, PATRULLA-104)
  unit?: string;
  failed_login_attempts?: number;
  locked_until?: string | null;
  auth_algorithm?: string;
  e2ee_public_key?: string;
  last_ip?: string;
}

export interface Channel {
  id: string;
  name: string;
  is_private: number | boolean;
  access_code?: string | null;
  created_by: string;
  created_at?: string;
  category?: 'general' | 'emergencia' | 'tactico' | 'vialidad' | 'inteligencia';
  active_transmitters_count?: number;
  member_count?: number;
  clearance_level?: number; // 1 = General, 2 = Policial, 3 = Mando C5i
  is_encrypted?: boolean | number;
  encryption_cipher?: string;
}

export interface ChannelMember {
  id: string;
  channel_id: string;
  user_id: string;
  joined_at?: string;
  role_in_channel?: 'owner' | 'admin' | 'member' | 'listener';
  is_muted?: boolean | number;
}

export interface Contact {
  id: string;
  user_id: string;
  contact_user_id: string;
  alias?: string | null;
  created_at?: string;
  contact_user?: User;
}

export interface VoiceMessage {
  id: string;
  sender_id: string;
  channel_id?: string | null;
  receiver_id?: string | null;
  audio_url: string;
  duration_seconds: number;
  created_at: string;
  sender_name?: string;
  sender_avatar?: string | null;
  sender_callsign?: string;
  is_emergency?: boolean;
  is_encrypted?: boolean;
  nonce?: string;
  hmac_signature?: string;
  encryption_cipher?: string;
}

export interface SecurityAuditLogEntry {
  id: string | number;
  event_type: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'RATE_LIMIT_BLOCKED' | 'PTT_BURST_VERIFIED' | 'REPLAY_ATTACK_PREVENTED' | 'INVALID_HMAC' | 'SESSION_EXPIRED';
  user_id?: string;
  ip_address: string;
  user_agent?: string;
  details?: string | Record<string, any>;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  created_at: string;
}

export type MessageType = 'text' | 'audio' | 'image' | 'video' | 'location' | 'alert' | 'emergency';
export type MessageDeliveryStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'offline_queued';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
  map_url?: string;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_callsign?: string;
  sender_avatar?: string | null;
  channel_id?: string | null;
  receiver_id?: string | null;
  type: MessageType;
  content: string; // text body or caption
  media_url?: string; // base64 or blob or remote url
  media_name?: string;
  media_size_bytes?: number;
  duration_seconds?: number; // for audio notes
  location_data?: LocationData;
  status: MessageDeliveryStatus;
  is_offline_pending?: boolean;
  is_emergency?: boolean;
  created_at: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  status?: 'success' | 'error';
  message: string;
  code?: string;
  data?: T;
  usuario?: User | any;
  user?: User | any;
  userId?: string;
}

export type RadioMode = 'channel' | 'direct';

export interface RadioTransmission {
  isActive: boolean;
  isReceiving: boolean;
  activeSpeakerName?: string;
  activeSpeakerCallsign?: string;
  targetId: string;
  targetType: RadioMode;
  targetName: string;
  durationSeconds: number;
  audioBlob?: Blob;
}

export interface EmergencyAlert {
  id: string;
  officer_id: string;
  officer_name: string;
  officer_callsign: string;
  channel_id?: string | null;
  latitude: number;
  longitude: number;
  accuracy_meters: number;
  location_name: string;
  protocol_text: string;
  status: 'active' | 'in_progress' | 'attended' | 'resolved';
  push_notified: boolean;
  created_at: string;
}

export interface UserSettingsRecord {
  user_id: string;
  theme_mode: 'light' | 'dark' | 'system';
  push_notifications: boolean;
  channel_message_sounds: boolean;
  ptt_mode: 'hold' | 'toggle';
  roger_beep: boolean;
  vibration_on_ptt: boolean;
  updated_at: string;
}
