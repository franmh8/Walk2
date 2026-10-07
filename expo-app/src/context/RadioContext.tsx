import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Channel, VoiceMessage, Contact } from '../types';
import { AudioService } from '../services/audioService';
import { useAuth } from './AuthContext';

interface RadioContextType {
  channels: Channel[];
  selectedChannel: Channel | null;
  setSelectedChannel: (channel: Channel | null) => void;
  createChannel: (name: string, isPrivate?: boolean) => Promise<Channel>;
  voiceHistory: VoiceMessage[];
  clearHistory: () => Promise<void>;
  isTransmitting: boolean;
  transmittingUser: string | null;
  startTransmitting: () => Promise<void>;
  stopTransmitting: () => Promise<void>;
  selectedContact: Contact | null;
  setSelectedContact: (c: Contact | null) => void;
}

const RadioContext = createContext<RadioContextType>({} as any);

export const RadioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [voiceHistory, setVoiceHistory] = useState<VoiceMessage[]>([]);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [transmittingUser, setTransmittingUser] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Cargar canales e historial sincronizados desde AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        await AudioService.init();
        const storedChannels = await AsyncStorage.getItem('c5i_channels');
        if (storedChannels) {
          const parsed = JSON.parse(storedChannels);
          setChannels(parsed);
          if (parsed.length > 0) setSelectedChannel(parsed[0]);
        } else {
          // Inicializa limpio y vacío
          setChannels([]);
          setSelectedChannel(null);
        }

        const storedHistory = await AsyncStorage.getItem('c5i_voice_history');
        if (storedHistory) {
          setVoiceHistory(JSON.parse(storedHistory));
        } else {
          setVoiceHistory([]);
        }
      } catch (err) {
        console.warn('Error cargando datos de radio:', err);
      }
    })();
  }, [user]);

  const createChannel = async (name: string, isPrivate = false): Promise<Channel> => {
    const newChan: Channel = {
      id: `chan-${Date.now()}`,
      name: name.trim().toUpperCase(),
      is_private: isPrivate,
      category: 'tactico',
      member_count: 1,
      active_transmitters_count: 0,
      is_encrypted: true,
    };

    const updated = [...channels, newChan];
    setChannels(updated);
    setSelectedChannel(newChan);
    await AsyncStorage.setItem('c5i_channels', JSON.stringify(updated));
    return newChan;
  };

  const clearHistory = async () => {
    setVoiceHistory([]);
    await AsyncStorage.removeItem('c5i_voice_history');
  };

  const startTransmitting = async () => {
    setIsTransmitting(true);
    setTransmittingUser(user?.callsign || 'Tú (Transmitiendo)');
    await AudioService.startRecording();
  };

  const stopTransmitting = async () => {
    setIsTransmitting(false);
    setTransmittingUser(null);
    const audioUri = await AudioService.stopRecording();

    if (audioUri && user) {
      const newBurst: VoiceMessage = {
        id: `burst-${Date.now()}`,
        sender_id: user.id,
        sender_name: user.name,
        sender_callsign: user.callsign || 'OPERATIVO',
        channel_id: selectedChannel?.id || null,
        audio_url: audioUri,
        duration_seconds: 2,
        created_at: new Date().toISOString(),
      };
      const updatedHistory = [newBurst, ...voiceHistory].slice(0, 30);
      setVoiceHistory(updatedHistory);
      await AsyncStorage.setItem('c5i_voice_history', JSON.stringify(updatedHistory));
    }
  };

  return (
    <RadioContext.Provider
      value={{
        channels,
        selectedChannel,
        setSelectedChannel,
        createChannel,
        voiceHistory,
        clearHistory,
        isTransmitting,
        transmittingUser,
        startTransmitting,
        stopTransmitting,
        selectedContact,
        setSelectedContact,
      }}
    >
      {children}
    </RadioContext.Provider>
  );
};

export const useRadio = () => useContext(RadioContext);
