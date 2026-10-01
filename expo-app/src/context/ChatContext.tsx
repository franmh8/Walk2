import React, { createContext, useContext, useState } from 'react';
import { ChatMessage } from '../types';

interface ChatContextType {
  messages: ChatMessage[];
  sendMessage: (text: string) => void;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'm-1',
    sender_id: 'c5-central',
    sender_name: 'Despacho Central C5i',
    sender_callsign: 'CENTRAL-C5I',
    text: 'Frecuencia táctica operacional lista. Todas las unidades reportar estatus.',
    type: 'text',
    created_at: new Date(Date.now() - 300000).toISOString(),
    channel_id: 'c-1',
  },
  {
    id: 'm-2',
    sender_id: 'p-104',
    sender_name: 'Unidad 104',
    sender_callsign: 'PATRULLA-104',
    text: 'Sector Plaza Juárez sin novedad. En recorrido preventivo.',
    type: 'text',
    created_at: new Date(Date.now() - 120000).toISOString(),
    channel_id: 'c-1',
  },
];

const ChatContext = createContext<ChatContextType>({} as any);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender_id: 'usr-1',
      sender_name: 'Oficial C5i',
      sender_callsign: 'PATRULLA-302',
      text: text.trim(),
      type: 'text',
      created_at: new Date().toISOString(),
      channel_id: 'c-1',
    };
    setMessages((prev) => [...prev, msg]);
  };

  return (
    <ChatContext.Provider value={{ messages, sendMessage }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
