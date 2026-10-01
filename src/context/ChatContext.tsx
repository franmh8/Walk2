import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { ChatMessage, LocationData, MessageType } from '../types';
import { useAuth } from './AuthContext';
import { useRadio } from './RadioContext';
import { useNetwork } from './NetworkContext';
import { getChatMessagesApi, saveChatMessageApi, syncOfflineOutboxApi } from '../api/chatApi';
import { soundEngine } from '../utils/audioEffects';

interface ChatContextType {
  messages: ChatMessage[];
  isOfflineMode: boolean;
  setIsOfflineMode: (offline: boolean) => void;
  toggleOfflineMode: () => void;
  pendingOfflineCount: number;
  sendTextMessage: (text: string) => Promise<void>;
  sendAudioMessage: (audioBlob: Blob, durationSeconds: number) => Promise<void>;
  sendLocationMessage: (customCoords?: { lat: number; lng: number; address?: string }) => Promise<void>;
  sendMediaMessage: (file: File | string, type: 'image' | 'video', caption?: string) => Promise<void>;
  sendEmergencyAlert: (title: string, details?: string) => Promise<void>;
  syncPendingMessages: () => Promise<void>;
  exportChatBackup: (format?: 'json' | 'txt') => void;
  clearChatHistory: () => void;
  isLoading: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { mode, activeChannel, activeContact } = useRadio();
  const { status, pendingOutboxCount, setSimulationMode, refreshOutboxCount } = useNetwork();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const isOfflineMode = status === 'offline';
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Synchronize pending offline messages and refresh view
  const syncPendingMessages = async () => {
    const count = await syncOfflineOutboxApi();
    refreshOutboxCount();
    if (count > 0) {
      await loadMessages();
    }
  };

  // When network comes back online, reload messages to show updated checkmarks
  useEffect(() => {
    if (status === 'online') {
      loadMessages();
    }
  }, [status]);

  // Load chat messages when channel or contact changes
  const loadMessages = async () => {
    const targetId = mode === 'channel' ? activeChannel?.id : activeContact?.contact_user_id;
    if (targetId) {
      setIsLoading(true);
      const msgs = await getChatMessagesApi(targetId, mode, user?.id);
      setMessages(msgs);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [mode, activeChannel?.id, activeContact?.contact_user_id, user?.id]);

  const setIsOfflineMode = (offline: boolean) => {
    setSimulationMode(offline ? 'offline' : 'online');
  };

  const toggleOfflineMode = () => {
    setSimulationMode(isOfflineMode ? 'online' : 'offline');
  };

  // Helper to generate base chat message
  const createBaseMessage = (type: MessageType, content: string): ChatMessage => {
    if (!user) throw new Error('Usuario no autenticado');
    return {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sender_id: user.id,
      sender_name: user.name,
      sender_callsign: user.callsign || 'C5i-RADIO',
      sender_avatar: user.avatar_url,
      channel_id: mode === 'channel' ? activeChannel?.id || null : null,
      receiver_id: mode === 'direct' ? activeContact?.contact_user_id || null : null,
      type,
      content,
      status: isOfflineMode ? 'offline_queued' : 'sent',
      is_offline_pending: isOfflineMode,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
  };

  // Send Text message
  const sendTextMessage = async (text: string) => {
    if (!text.trim() || !user) return;
    const baseMsg = createBaseMessage('text', text.trim());
    const saved = await saveChatMessageApi(baseMsg, isOfflineMode);
    setMessages((prev) => [...prev, saved]);
    refreshOutboxCount();
  };

  // Send Audio message / voice note
  const sendAudioMessage = async (audioBlob: Blob, durationSeconds: number) => {
    if (!user) return;
    const audioUrl = URL.createObjectURL(audioBlob);
    const baseMsg = createBaseMessage('audio', 'Nota de voz de radio');
    baseMsg.media_url = audioUrl;
    baseMsg.duration_seconds = durationSeconds;

    const saved = await saveChatMessageApi(baseMsg, isOfflineMode);
    setMessages((prev) => [...prev, saved]);
    refreshOutboxCount();
  };

  // Send Location message (with GPS or C5i Hidalgo default coords)
  const sendLocationMessage = async (customCoords?: { lat: number; lng: number; address?: string }) => {
    if (!user) return;

    let location: LocationData = {
      latitude: 20.1011,
      longitude: -98.7591,
      address: 'C5i Hidalgo • Centro de Comando, Pachuca de Soto',
      map_url: 'https://www.google.com/maps?q=20.1011,-98.7591',
    };

    if (customCoords) {
      location = {
        latitude: customCoords.lat,
        longitude: customCoords.lng,
        address: customCoords.address || `Coordenadas C5i: ${customCoords.lat.toFixed(4)}, ${customCoords.lng.toFixed(4)}`,
        map_url: `https://www.google.com/maps?q=${customCoords.lat},${customCoords.lng}`,
      };
    } else if (navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 6000 });
        });
        location = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          address: `Posición GPS Patrulla C5i (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`,
          map_url: `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`,
        };
      } catch (e) {
        console.warn('Geolocation fallback used:', e);
      }
    }

    const baseMsg = createBaseMessage('location', location.address || 'Ubicación GPS compartida');
    baseMsg.location_data = location;

    const saved = await saveChatMessageApi(baseMsg, isOfflineMode);
    setMessages((prev) => [...prev, saved]);
    refreshOutboxCount();
  };

  // Send Image or Video media message
  const sendMediaMessage = async (fileOrUrl: File | string, type: 'image' | 'video', caption: string = '') => {
    if (!user) return;

    let mediaUrl = '';
    let mediaName = '';
    let mediaSize = 0;

    if (typeof fileOrUrl === 'string') {
      mediaUrl = fileOrUrl;
      mediaName = type === 'image' ? 'evidencia_c5i.jpg' : 'video_reporte_c5i.mp4';
    } else {
      mediaUrl = URL.createObjectURL(fileOrUrl);
      mediaName = fileOrUrl.name;
      mediaSize = fileOrUrl.size;
    }

    const baseMsg = createBaseMessage(type, caption || (type === 'image' ? 'Fotografía de reporte' : 'Video de reporte'));
    baseMsg.media_url = mediaUrl;
    baseMsg.media_name = mediaName;
    baseMsg.media_size_bytes = mediaSize;

    const saved = await saveChatMessageApi(baseMsg, isOfflineMode);
    setMessages((prev) => [...prev, saved]);
    refreshOutboxCount();
  };

  // Send Emergency Alert Code Red message
  const sendEmergencyAlert = async (title: string, details?: string) => {
    if (!user) return;
    soundEngine.playEmergencyAlert();

    const baseMsg = createBaseMessage('alert', `[10-33 CÓDIGO ROJO] ${title}. ${details || ''}`);
    baseMsg.is_emergency = true;

    const saved = await saveChatMessageApi(baseMsg, isOfflineMode);
    setMessages((prev) => [...prev, saved]);
    refreshOutboxCount();
  };

  // Export conversation backup
  const exportChatBackup = (format: 'json' | 'txt' = 'txt') => {
    const targetName = mode === 'channel' ? activeChannel?.name : activeContact?.contact_user?.name;
    const fileName = `respaldo_chat_c5i_${targetName || 'general'}_${new Date().toISOString().slice(0, 10)}`;

    if (format === 'json') {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(messages, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `${fileName}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } else {
      let textContent = `====================================================\n`;
      textContent += `BITÁCORA OFICIAL DE COMUNICACIONES C5i HIDALGO\n`;
      textContent += `Destino: ${targetName || 'Canal General'}\n`;
      textContent += `Generado: ${new Date().toLocaleString('es-MX')}\n`;
      textContent += `Total Mensajes: ${messages.length}\n`;
      textContent += `====================================================\n\n`;

      messages.forEach((m) => {
        textContent += `[${m.created_at}] ${m.sender_name} (${m.sender_callsign || 'C5i'}):\n`;
        textContent += `Tipo: ${m.type.toUpperCase()}\n`;
        textContent += `Mensaje: ${m.content}\n`;
        if (m.location_data) {
          textContent += `GPS: Lat ${m.location_data.latitude}, Lng ${m.location_data.longitude} (${m.location_data.address})\n`;
        }
        textContent += `Estado: ${m.status}\n`;
        textContent += `----------------------------------------------------\n`;
      });

      const dataStr = 'data:text/plain;charset=utf-8,' + encodeURIComponent(textContent);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `${fileName}.txt`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }
  };

  const clearChatHistory = () => {
    if (window.confirm('¿Eliminar historial local de este chat?')) {
      const targetId = mode === 'channel' ? activeChannel?.id : activeContact?.contact_user_id;
      const saved = localStorage.getItem('c5i_chat_messages_db');
      if (saved && targetId) {
        const allMessages: ChatMessage[] = JSON.parse(saved);
        const filtered = allMessages.filter((m) =>
          mode === 'channel' ? m.channel_id !== targetId : m.receiver_id !== targetId && m.sender_id !== targetId
        );
        localStorage.setItem('c5i_chat_messages_db', JSON.stringify(filtered));
        setMessages([]);
      }
    }
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        isOfflineMode,
        setIsOfflineMode,
        toggleOfflineMode,
        pendingOfflineCount: pendingOutboxCount,
        sendTextMessage,
        sendAudioMessage,
        sendLocationMessage,
        sendMediaMessage,
        sendEmergencyAlert,
        syncPendingMessages,
        exportChatBackup,
        clearChatHistory,
        isLoading,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
