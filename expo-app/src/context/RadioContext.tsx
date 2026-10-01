import React, { createContext, useContext, useState, useEffect } from 'react';
import { Channel, VoiceMessage, Contact } from '../types';
import { AudioService } from '../services/audioService';

interface RadioContextType {
  channels: Channel[];
  selectedChannel: Channel;
  setSelectedChannel: (channel: Channel) => void;
  voiceHistory: VoiceMessage[];
  isTransmitting: boolean;
  transmittingUser: string | null;
  startTransmitting: () => Promise<void>;
  stopTransmitting: () => Promise<void>;
  selectedContact: Contact | null;
  setSelectedContact: (c: Contact | null) => void;
}

const DEFAULT_CHANNELS: Channel[] = [
  { id: 'c-1', name: 'CANAL 1 - GENERAL C5i', is_private: false, category: 'general', member_count: 34, active_transmitters_count: 0 },
  { id: 'c-2', name: 'CANAL 2 - EMERGENCIAS 911', is_private: false, category: 'emergencia', member_count: 52, active_transmitters_count: 0 },
  { id: 'c-3', name: 'CANAL 3 - OPERATIVO PACHUCA', is_private: false, category: 'tactico', member_count: 28, active_transmitters_count: 0 },
  { id: 'c-4', name: 'CANAL 4 - POLICÍA ESTATAL', is_private: false, category: 'tactico', member_count: 45, active_transmitters_count: 0 },
  { id: 'c-5', name: 'CANAL 5 - VIALIDAD & TRÁNSITO', is_private: false, category: 'vialidad', member_count: 19, active_transmitters_count: 0 },
];

const RadioContext = createContext<RadioContextType>({} as any);

export const RadioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [channels] = useState<Channel[]>(DEFAULT_CHANNELS);
  const [selectedChannel, setSelectedChannel] = useState<Channel>(DEFAULT_CHANNELS[0]);
  const [voiceHistory, setVoiceHistory] = useState<VoiceMessage[]>([]);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [transmittingUser, setTransmittingUser] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  useEffect(() => {
    AudioService.init();
  }, []);

  const startTransmitting = async () => {
    setIsTransmitting(true);
    setTransmittingUser('Tú (Transmitiendo)');
    await AudioService.startRecording();
  };

  const stopTransmitting = async () => {
    setIsTransmitting(false);
    setTransmittingUser(null);
    const audioUri = await AudioService.stopRecording();

    if (audioUri) {
      const newBurst: VoiceMessage = {
        id: `burst-${Date.now()}`,
        sender_id: 'usr-current',
        sender_name: 'Oficial C5i',
        sender_callsign: 'PATRULLA-302',
        channel_id: selectedChannel.id,
        audio_url: audioUri,
        duration_seconds: 3,
        created_at: new Date().toISOString(),
      };
      setVoiceHistory((prev) => [newBurst, ...prev]);
    }
  };

  return (
    <RadioContext.Provider
      value={{
        channels,
        selectedChannel,
        setSelectedChannel,
        voiceHistory,
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
