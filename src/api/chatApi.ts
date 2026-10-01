import api from './api';
import { ChatMessage, ApiResponse } from '../types';
import { INITIAL_CHAT_MESSAGES } from '../utils/initialDbData';

export const getAllStoredChatMessages = (): ChatMessage[] => {
  const saved = localStorage.getItem('c5i_chat_messages_db');
  return saved ? JSON.parse(saved) : INITIAL_CHAT_MESSAGES;
};

export const getChatMessagesApi = async (
  targetId: string,
  mode: 'channel' | 'direct',
  currentUserId?: string
): Promise<ChatMessage[]> => {
  try {
    const res = await api.get(`chat.php?target_id=${targetId}&mode=${mode}`);
    if (res?.data && Array.isArray(res.data)) return res.data;
    if (res?.data?.messages && Array.isArray(res.data.messages)) return res.data.messages;
  } catch (e) {
    // fallback to local storage
  }

  const allMessages = getAllStoredChatMessages();

  if (mode === 'channel') {
    return allMessages.filter((m) => m.channel_id === targetId);
  } else {
    // Aislamiento estricto de chat 1-a-1: los mensajes solo son visibles entre currentUserId y targetId
    if (currentUserId) {
      return allMessages.filter(
        (m) =>
          !m.channel_id &&
          ((String(m.sender_id) === String(currentUserId) && String(m.receiver_id) === String(targetId)) ||
           (String(m.sender_id) === String(targetId) && String(m.receiver_id) === String(currentUserId)))
      );
    }
    return allMessages.filter(
      (m) => (m.receiver_id === targetId || m.sender_id === targetId) && !m.channel_id
    );
  }
};

export const saveChatMessageApi = async (
  message: ChatMessage,
  isDeviceOffline: boolean = false
): Promise<ChatMessage> => {
  const finalMessage: ChatMessage = {
    ...message,
    status: isDeviceOffline ? 'offline_queued' : 'sent',
    is_offline_pending: isDeviceOffline,
  };

  // If online, try remote endpoint
  if (!isDeviceOffline) {
    try {
      await api.post('chat.php', finalMessage);
    } catch (e) {
      console.warn('Could not post to remote PHP chat, saving locally:', e);
      finalMessage.status = 'offline_queued';
      finalMessage.is_offline_pending = true;
    }
  }

  // Update local DB
  const saved = localStorage.getItem('c5i_chat_messages_db');
  const allMessages: ChatMessage[] = saved ? JSON.parse(saved) : INITIAL_CHAT_MESSAGES;
  const updated = [...allMessages, finalMessage];
  localStorage.setItem('c5i_chat_messages_db', JSON.stringify(updated));

  // If queued, also add to outbox
  if (finalMessage.is_offline_pending) {
    const outboxSaved = localStorage.getItem('c5i_offline_outbox');
    const outbox: ChatMessage[] = outboxSaved ? JSON.parse(outboxSaved) : [];
    outbox.push(finalMessage);
    localStorage.setItem('c5i_offline_outbox', JSON.stringify(outbox));
  }

  return finalMessage;
};

export const syncOfflineOutboxApi = async (): Promise<number> => {
  const outboxSaved = localStorage.getItem('c5i_offline_outbox');
  if (!outboxSaved) return 0;
  const outbox: ChatMessage[] = JSON.parse(outboxSaved);
  if (outbox.length === 0) return 0;

  try {
    await api.post('sync_chat.php', { messages: outbox });
  } catch (e) {
    // Ignore server error during mock/local mode
  }

  // Mark pending messages as sent/delivered in DB
  const saved = localStorage.getItem('c5i_chat_messages_db');
  if (saved) {
    const allMessages: ChatMessage[] = JSON.parse(saved);
    const synced = allMessages.map((m) =>
      m.is_offline_pending ? { ...m, is_offline_pending: false, status: 'delivered' as const } : m
    );
    localStorage.setItem('c5i_chat_messages_db', JSON.stringify(synced));
  }

  // Clear outbox
  const count = outbox.length;
  localStorage.removeItem('c5i_offline_outbox');
  return count;
};
