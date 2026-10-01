import api from './api';
import { Channel, Contact, User, VoiceMessage, EmergencyAlert, UserSettingsRecord } from '../types';
import {
  INITIAL_CHANNELS,
  INITIAL_CONTACTS,
  INITIAL_USERS,
  INITIAL_VOICE_MESSAGES,
  INITIAL_EMERGENCY_ALERTS,
  INITIAL_USER_SETTINGS,
} from '../utils/initialDbData';

export const getChannelsApi = async (currentUserId?: string): Promise<Channel[]> => {
  try {
    const res = await api.get('channels.php');
    if (res?.data && Array.isArray(res.data)) return res.data;
    if (res?.data?.channels) return res.data.channels;
  } catch (e) {
    // fallback
  }
  const saved = localStorage.getItem('c5i_channels_db');
  const allChannels: Channel[] = saved ? JSON.parse(saved) : INITIAL_CHANNELS;

  // Guardamos y recuperamos membresías del usuario
  if (currentUserId) {
    const savedMemberships = localStorage.getItem('c5i_channel_memberships_db');
    const memberships: string[] = savedMemberships ? JSON.parse(savedMemberships) : [];

    // Canales creados por el usuario, o a los que se ha unido
    return allChannels.filter(
      (c) =>
        !c.created_by ||
        String(c.created_by) === String(currentUserId) ||
        memberships.includes(c.id)
    );
  }
  return allChannels;
};

export const getAllAvailableChannelsApi = async (): Promise<Channel[]> => {
  try {
    const res = await api.get('channels.php');
    if (res?.data && Array.isArray(res.data)) return res.data;
    if (res?.data?.channels) return res.data.channels;
  } catch (e) {
    // fallback
  }
  const saved = localStorage.getItem('c5i_channels_db');
  return saved ? JSON.parse(saved) : INITIAL_CHANNELS;
};

export const joinChannelApi = async (
  channelId: string,
  userId: string,
  providedPin?: string
): Promise<{ success: boolean; message?: string; channel?: Channel }> => {
  const saved = localStorage.getItem('c5i_channels_db');
  const allChannels: Channel[] = saved ? JSON.parse(saved) : INITIAL_CHANNELS;
  const channel = allChannels.find((c) => c.id === channelId);

  if (!channel) {
    return { success: false, message: 'Canal no encontrado en la red táctica.' };
  }

  if (channel.is_private && channel.access_code) {
    if (!providedPin || providedPin.trim() !== channel.access_code.trim()) {
      return { success: false, message: 'Código PIN o clave táctica incorrecta.' };
    }
  }

  // Registrar membresía
  const savedMemberships = localStorage.getItem('c5i_channel_memberships_db');
  const memberships: string[] = savedMemberships ? JSON.parse(savedMemberships) : [];
  if (!memberships.includes(channelId)) {
    memberships.push(channelId);
    localStorage.setItem('c5i_channel_memberships_db', JSON.stringify(memberships));

    // Aumentar contador de miembros
    channel.member_count = (channel.member_count || 1) + 1;
    localStorage.setItem('c5i_channels_db', JSON.stringify(allChannels));
  }

  return { success: true, channel };
};

export const deleteChannelApi = async (channelId: string): Promise<void> => {
  const saved = localStorage.getItem('c5i_channels_db');
  if (saved) {
    const allChannels: Channel[] = JSON.parse(saved);
    const filtered = allChannels.filter((c) => c.id !== channelId);
    localStorage.setItem('c5i_channels_db', JSON.stringify(filtered));
  }
};

export const createChannelApi = async (channel: {
  name: string;
  is_private: boolean;
  access_code?: string;
  category?: string;
  created_by: string;
}): Promise<Channel> => {
  const newChan: Channel = {
    id: `c-${Date.now().toString(16)}`,
    name: channel.name,
    is_private: channel.is_private ? 1 : 0,
    access_code: channel.access_code || null,
    created_by: channel.created_by,
    created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    category: (channel.category as any) || 'general',
    member_count: 1,
  };

  try {
    const res = await api.post('create_channel.php', newChan);
    if (res?.data?.channel) return res.data.channel;
  } catch (e) {
    // fallback
  }

  const list = await getChannelsApi();
  const updated = [newChan, ...list];
  localStorage.setItem('c5i_channels_db', JSON.stringify(updated));
  return newChan;
};

export const getContactsApi = async (currentUserId: string): Promise<Contact[]> => {
  try {
    const res = await api.get(`contacts.php?user_id=${currentUserId}`);
    if (res?.data && Array.isArray(res.data)) return res.data;
  } catch (e) {
    // fallback
  }

  const saved = localStorage.getItem('c5i_contacts_db');
  const contacts: Contact[] = saved ? JSON.parse(saved) : INITIAL_CONTACTS;
  const users: User[] = JSON.parse(
    localStorage.getItem('c5i_users_db') || JSON.stringify(INITIAL_USERS)
  );

  // Filter strictly for current user and attach contact user profile
  return contacts
    .filter((c) => String(c.user_id) === String(currentUserId))
    .map((c) => ({
      ...c,
      contact_user: users.find((u) => u.id === c.contact_user_id),
    }));
};

export const createCustomContactApi = async (
  userId: string,
  contactData: {
    firstName: string;
    lastName?: string;
    phone: string;
    email?: string;
    unit?: string;
    callsign?: string;
    avatar_url?: string;
  }
): Promise<Contact> => {
  const fullName = `${contactData.firstName.trim()} ${contactData.lastName?.trim() || ''}`.trim();
  const rawUsers = localStorage.getItem('c5i_users_db');
  const users: User[] = rawUsers ? JSON.parse(rawUsers) : INITIAL_USERS;

  // Check if user already exists by phone or create new user
  let existingUser = users.find(
    (u) =>
      u.phone_number === contactData.phone ||
      (contactData.email && u.correo && u.correo.toLowerCase() === contactData.email.toLowerCase())
  );

  if (!existingUser) {
    const newUser: User = {
      id: `usr-${Date.now().toString(16)}`,
      name: fullName,
      phone_number: contactData.phone,
      correo: contactData.email || '',
      role: 'Oficial Operativo',
      callsign: contactData.callsign || `RADIO-${contactData.phone.slice(-3) || '104'}`,
      unit: contactData.unit || 'Sector Central C5i',
      avatar_url: contactData.avatar_url || '',
      status: 'online',
      created_at: new Date().toISOString(),
    };
    users.push(newUser);
    localStorage.setItem('c5i_users_db', JSON.stringify(users));
    existingUser = newUser;
  } else if (contactData.avatar_url) {
    existingUser.avatar_url = contactData.avatar_url;
    localStorage.setItem('c5i_users_db', JSON.stringify(users));
  }

  return addContactApi(userId, existingUser.id, fullName);
};

export const updateContactApi = async (
  contactId: string,
  updatedData: {
    alias?: string;
    name?: string;
    phone_number?: string;
    correo?: string;
    callsign?: string;
    unit?: string;
    avatar_url?: string;
  }
): Promise<void> => {
  const savedContacts = localStorage.getItem('c5i_contacts_db');
  const contacts: Contact[] = savedContacts ? JSON.parse(savedContacts) : INITIAL_CONTACTS;
  const targetContact = contacts.find((c) => c.id === contactId);

  if (targetContact) {
    if (updatedData.alias) targetContact.alias = updatedData.alias;
    if (updatedData.name) targetContact.alias = updatedData.name;
    localStorage.setItem('c5i_contacts_db', JSON.stringify(contacts));

    // Also update associated user in c5i_users_db
    const savedUsers = localStorage.getItem('c5i_users_db');
    const users: User[] = savedUsers ? JSON.parse(savedUsers) : INITIAL_USERS;
    const targetUser = users.find((u) => u.id === targetContact.contact_user_id);
    if (targetUser) {
      if (updatedData.name) targetUser.name = updatedData.name;
      if (updatedData.phone_number) targetUser.phone_number = updatedData.phone_number;
      if (updatedData.correo !== undefined) targetUser.correo = updatedData.correo;
      if (updatedData.callsign !== undefined) targetUser.callsign = updatedData.callsign;
      if (updatedData.unit !== undefined) targetUser.unit = updatedData.unit;
      if (updatedData.avatar_url !== undefined) targetUser.avatar_url = updatedData.avatar_url;
      localStorage.setItem('c5i_users_db', JSON.stringify(users));
    }
  }
};

export const deleteContactApi = async (contactId: string): Promise<void> => {
  const savedContacts = localStorage.getItem('c5i_contacts_db');
  let contacts: Contact[] = savedContacts ? JSON.parse(savedContacts) : INITIAL_CONTACTS;
  contacts = contacts.filter((c) => c.id !== contactId);
  localStorage.setItem('c5i_contacts_db', JSON.stringify(contacts));
};

export const addContactApi = async (
  userId: string,
  contactUserId: string,
  alias?: string
): Promise<Contact> => {
  const newContact: Contact = {
    id: `ct-${Date.now().toString(16)}`,
    user_id: userId,
    contact_user_id: contactUserId,
    alias: alias || 'Contacto C5i',
    created_at: new Date().toISOString(),
  };

  try {
    await api.post('contacts.php', newContact);
  } catch (e) {
    // fallback
  }

  const saved = localStorage.getItem('c5i_contacts_db');
  const contacts: Contact[] = saved ? JSON.parse(saved) : INITIAL_CONTACTS;
  contacts.push(newContact);
  localStorage.setItem('c5i_contacts_db', JSON.stringify(contacts));
  return newContact;
};

export const getVoiceMessagesApi = async (
  targetId: string,
  mode: 'channel' | 'direct',
  currentUserId?: string
): Promise<VoiceMessage[]> => {
  try {
    const res = await api.get(`voice_messages.php?target_id=${targetId}&mode=${mode}`);
    if (res?.data && Array.isArray(res.data)) return res.data;
  } catch (e) {
    // fallback
  }

  const saved = localStorage.getItem('c5i_voice_messages_db');
  const allMessages: VoiceMessage[] = saved ? JSON.parse(saved) : INITIAL_VOICE_MESSAGES;

  if (mode === 'channel') {
    return allMessages.filter((m) => m.channel_id === targetId);
  } else {
    // Aislamiento estricto de PTT directo: el mensaje debe pertenecer a la conversación entre currentUserId y targetId
    if (currentUserId) {
      return allMessages.filter(
        (m) =>
          !m.channel_id &&
          ((String(m.sender_id) === String(currentUserId) && String(m.receiver_id) === String(targetId)) ||
           (String(m.sender_id) === String(targetId) && String(m.receiver_id) === String(currentUserId)))
      );
    }
    return allMessages.filter((m) => m.receiver_id === targetId || m.sender_id === targetId);
  }
};

export const sendVoiceMessageApi = async (data: {
  sender_id: string;
  sender_name: string;
  sender_callsign: string;
  channel_id?: string | null;
  receiver_id?: string | null;
  audio_url: string;
  duration_seconds: number;
  is_emergency?: boolean;
}): Promise<VoiceMessage> => {
  const newMsg: VoiceMessage = {
    id: `vm-${Date.now().toString(16)}`,
    sender_id: data.sender_id,
    sender_name: data.sender_name,
    sender_callsign: data.sender_callsign,
    channel_id: data.channel_id || null,
    receiver_id: data.receiver_id || null,
    audio_url: data.audio_url,
    duration_seconds: data.duration_seconds,
    is_emergency: data.is_emergency || false,
    created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
  };

  try {
    await api.post('send_voice.php', newMsg);
  } catch (e) {
    // fallback
  }

  const saved = localStorage.getItem('c5i_voice_messages_db');
  const allMessages: VoiceMessage[] = saved ? JSON.parse(saved) : INITIAL_VOICE_MESSAGES;
  const updated = [newMsg, ...allMessages];
  localStorage.setItem('c5i_voice_messages_db', JSON.stringify(updated));

  return newMsg;
};

export const updateStatusApi = async (userId: string, status: 'online' | 'offline' | 'transmitting') => {
  try {
    await api.post('status.php', { user_id: userId, status });
  } catch (e) {
    // fallback
  }
  const users: User[] = JSON.parse(
    localStorage.getItem('c5i_users_db') || JSON.stringify(INITIAL_USERS)
  );
  const updated = users.map((u) => (u.id === userId ? { ...u, status } : u));
  localStorage.setItem('c5i_users_db', JSON.stringify(updated));
};

// ==============================================================
// GESTIÓN DE ALERTAS DE EMERGENCIA SOS EN BASE DE DATOS
// ==============================================================
export const getEmergencyAlertsApi = async (): Promise<EmergencyAlert[]> => {
  try {
    const res = await fetch('/api/emergency/alerts');
    if (res.ok) {
      const data = await res.json();
      if (data?.alerts && Array.isArray(data.alerts)) return data.alerts;
    }
  } catch (e) {
    // fallback local
  }
  const saved = localStorage.getItem('c5i_emergency_alerts_db');
  return saved ? JSON.parse(saved) : INITIAL_EMERGENCY_ALERTS;
};

export const recordEmergencyAlertApi = async (data: {
  officer_id: string;
  officer_name: string;
  officer_callsign: string;
  channel_id?: string | null;
  latitude: number;
  longitude: number;
  accuracy_meters: number;
  location_name: string;
  protocol_text?: string;
}): Promise<EmergencyAlert> => {
  const newAlert: EmergencyAlert = {
    id: `sos-${Date.now().toString(16)}`,
    officer_id: data.officer_id,
    officer_name: data.officer_name,
    officer_callsign: data.officer_callsign,
    channel_id: data.channel_id || null,
    latitude: data.latitude,
    longitude: data.longitude,
    accuracy_meters: data.accuracy_meters || 8,
    location_name: data.location_name,
    protocol_text:
      data.protocol_text ||
      'Al activar la alerta se emitira una sirena sonora en todos los radios disponibles en la zona y se asignara prioridad absoluta a tu frecuencia',
    status: 'active',
    push_notified: true,
    created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
  };

  try {
    await fetch('/api/emergency/alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAlert),
    });
  } catch (e) {
    // fallback local
  }

  const saved = localStorage.getItem('c5i_emergency_alerts_db');
  const allAlerts: EmergencyAlert[] = saved ? JSON.parse(saved) : INITIAL_EMERGENCY_ALERTS;
  const updated = [newAlert, ...allAlerts];
  localStorage.setItem('c5i_emergency_alerts_db', JSON.stringify(updated));

  return newAlert;
};

// ==============================================================
// GESTIÓN DE CONFIGURACIÓN Y AJUSTES DE USUARIO EN BASE DE DATOS
// ==============================================================
export const getUserSettingsApi = async (userId: string): Promise<UserSettingsRecord | null> => {
  try {
    const res = await fetch(`/api/settings/${userId}`);
    if (res.ok) {
      const data = await res.json();
      if (data?.settings) return data.settings;
    }
  } catch (e) {
    // fallback local
  }
  const saved = localStorage.getItem('c5i_user_settings_db');
  const allSettings: UserSettingsRecord[] = saved ? JSON.parse(saved) : INITIAL_USER_SETTINGS;
  return allSettings.find((s) => s.user_id === userId) || null;
};

export const saveUserSettingsApi = async (
  userId: string,
  settings: Partial<UserSettingsRecord>
): Promise<UserSettingsRecord> => {
  const updatedRecord: UserSettingsRecord = {
    user_id: userId,
    theme_mode: settings.theme_mode || 'system',
    push_notifications: settings.push_notifications ?? true,
    channel_message_sounds: settings.channel_message_sounds ?? true,
    ptt_mode: settings.ptt_mode || 'hold',
    roger_beep: settings.roger_beep ?? true,
    vibration_on_ptt: settings.vibration_on_ptt ?? true,
    updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
  };

  try {
    await fetch(`/api/settings/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedRecord),
    });
  } catch (e) {
    // fallback local
  }

  const saved = localStorage.getItem('c5i_user_settings_db');
  const allSettings: UserSettingsRecord[] = saved ? JSON.parse(saved) : INITIAL_USER_SETTINGS;
  const filtered = allSettings.filter((s) => s.user_id !== userId);
  const updated = [updatedRecord, ...filtered];
  localStorage.setItem('c5i_user_settings_db', JSON.stringify(updated));

  return updatedRecord;
};
