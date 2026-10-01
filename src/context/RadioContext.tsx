import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Channel, Contact, RadioMode, VoiceMessage } from '../types';
import { useAuth } from './AuthContext';
import { useSettings } from './SettingsContext';
import { soundEngine } from '../utils/audioEffects';
import { pushNotificationService } from '../services/pushNotificationService';
import {
  getChannelsApi,
  getContactsApi,
  getVoiceMessagesApi,
  sendVoiceMessageApi,
} from '../api/radioApi';

interface RadioContextType {
  mode: RadioMode;
  setMode: (mode: RadioMode) => void;
  activeChannel: Channel | null;
  setActiveChannel: (c: Channel) => void;
  activeContact: Contact | null;
  setActiveContact: (c: Contact | null) => void;
  channels: Channel[];
  contacts: Contact[];
  voiceMessages: VoiceMessage[];
  isTransmitting: boolean;
  isReceiving: boolean;
  receivingSender: { name: string; callsign: string; avatar?: string } | null;
  transmissionDuration: number;
  audioLevels: number[];
  volume: number;
  setVolume: (v: number) => void;
  isMuted: boolean;
  setIsMuted: (m: boolean) => void;
  startTransmission: () => Promise<void>;
  stopTransmission: () => Promise<void>;
  triggerEmergencySos: (customLocation?: string) => Promise<void>;
  refreshChannels: () => Promise<void>;
  refreshContacts: () => Promise<void>;
  refreshMessages: () => Promise<void>;
  simulateIncomingTransmission: (customMessage?: string, senderName?: string, callsign?: string) => void;
  playRecordedMessage: (msg: VoiceMessage) => void;
  currentlyPlayingId: string | null;
}

const RadioContext = createContext<RadioContextType | undefined>(undefined);

export const RadioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updateUserStatus } = useAuth();
  const { settings } = useSettings();

  const [mode, setMode] = useState<RadioMode>('channel');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [voiceMessages, setVoiceMessages] = useState<VoiceMessage[]>([]);

  // PTT State
  const [isTransmitting, setIsTransmitting] = useState<boolean>(false);
  const [isReceiving, setIsReceiving] = useState<boolean>(false);
  const [receivingSender, setReceivingSender] = useState<{
    name: string;
    callsign: string;
    avatar?: string;
  } | null>(null);
  const [transmissionDuration, setTransmissionDuration] = useState<number>(0);
  const [audioLevels, setAudioLevels] = useState<number[]>([10, 15, 20, 15, 10, 8, 12, 18, 14, 10]);
  const [volume, setVolumeState] = useState<number>(0.85);
  const [isMuted, setIsMutedState] = useState<boolean>(false);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);

  // Audio recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<any>(null);
  const activeAudioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Load initial radio data
  const loadRadioData = async () => {
    if (!user) return;
    const chs = await getChannelsApi(user.id);
    setChannels(chs);
    if (chs.length > 0 && !activeChannel) {
      setActiveChannel(chs[0]);
    } else if (chs.length === 0) {
      setActiveChannel(null);
    }

    const cts = await getContactsApi(user.id);
    setContacts(cts);
  };

  useEffect(() => {
    if (user) {
      loadRadioData();
    }
  }, [user?.id]);

  // Load voice messages for current channel / contact
  useEffect(() => {
    const fetchMessages = async () => {
      const targetId = mode === 'channel' ? activeChannel?.id : activeContact?.contact_user_id;
      if (targetId) {
        const msgs = await getVoiceMessagesApi(targetId, mode, user?.id);
        setVoiceMessages(msgs);
      } else {
        setVoiceMessages([]);
      }
    };
    fetchMessages();
  }, [mode, activeChannel?.id, activeContact?.contact_user_id, user?.id]);

  const setVolume = (v: number) => {
    setVolumeState(v);
    soundEngine.setVolume(v);
    if (activeAudioPlayerRef.current) {
      activeAudioPlayerRef.current.volume = v;
    }
  };

  const setIsMuted = (m: boolean) => {
    setIsMutedState(m);
    soundEngine.setMuted(m);
    if (activeAudioPlayerRef.current) {
      activeAudioPlayerRef.current.muted = m;
    }
  };

  // Start PTT transmission
  const startTransmission = async () => {
    if (isTransmitting || isReceiving || !user) return;

    if (settings.pttStartChirp) {
      soundEngine.playPttStart();
    }
    if (settings.vibrationOnPtt && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(45);
      } catch (_) {}
    }
    setIsTransmitting(true);
    setTransmissionDuration(0);
    updateUserStatus('transmitting');

    // Start duration counter
    const startTime = Date.now();
    timerIntervalRef.current = setInterval(() => {
      setTransmissionDuration(Math.floor((Date.now() - startTime) / 1000));
    }, 200);

    // Initialize real mic capture if available
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.start(100);

        // Audio analyzer for real VU meter
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;

        const updateLevels = () => {
          if (!analyserRef.current) return;
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          // Pick sample bands
          const bands = [
            dataArray[1] || 10,
            dataArray[3] || 25,
            dataArray[5] || 45,
            dataArray[7] || 60,
            dataArray[9] || 75,
            dataArray[11] || 65,
            dataArray[13] || 40,
            dataArray[15] || 30,
            dataArray[17] || 20,
            dataArray[19] || 15,
          ];
          setAudioLevels(bands);
          animFrameRef.current = requestAnimationFrame(updateLevels);
        };
        updateLevels();
      }
    } catch (err) {
      console.warn('Microphone permission or hardware access not available, running in virtual radio mode:', err);
      // Virtual audio visualizer loop
      const simulateVisualizer = () => {
        const bands = Array.from({ length: 10 }, () => Math.floor(Math.random() * 80) + 15);
        setAudioLevels(bands);
        animFrameRef.current = requestAnimationFrame(simulateVisualizer);
      };
      simulateVisualizer();
    }
  };

  // Stop PTT transmission and save voice recording
  const stopTransmission = async () => {
    if (!isTransmitting || !user) return;

    if (settings.rogerBeep) {
      soundEngine.playRogerBeep();
    }
    if (settings.vibrationOnPtt && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(25);
      } catch (_) {}
    }
    setIsTransmitting(false);
    updateUserStatus('online');

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    const duration = Math.max(1, transmissionDuration);

    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
    }

    // Generate audio URL if chunks exist
    let audioUrl = '';
    if (audioChunksRef.current.length > 0) {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      audioUrl = URL.createObjectURL(audioBlob);
    }

    // Save message via API
    const newMsg = await sendVoiceMessageApi({
      sender_id: user.id,
      sender_name: user.name,
      sender_callsign: user.callsign || 'OPERADOR-C5I',
      channel_id: mode === 'channel' ? activeChannel?.id : null,
      receiver_id: mode === 'direct' ? activeContact?.contact_user_id : null,
      audio_url: audioUrl,
      duration_seconds: duration,
      is_emergency: false,
    });

    setVoiceMessages((prev) => [newMsg, ...prev]);
    setAudioLevels([10, 15, 20, 15, 10, 8, 12, 18, 14, 10]);
  };

  // Trigger Emergency SOS broadcast (Código Rojo 10-33 C5i)
  const triggerEmergencySos = async (customLocation?: string) => {
    if (!user) return;
    if (settings.emergencyAudioAlerts) {
      soundEngine.playEmergencyAlert();
    }

    const emergencyMsg = await sendVoiceMessageApi({
      sender_id: user.id,
      sender_name: `[ALERTA SOS] ${user.name}${customLocation ? ` • ${customLocation}` : ''}`,
      sender_callsign: user.callsign || 'C5-EMERGENCIA',
      channel_id: activeChannel?.id || null,
      receiver_id: null,
      audio_url: '',
      duration_seconds: 5,
      is_emergency: true,
    });

    setVoiceMessages((prev) => [emergencyMsg, ...prev]);
  };

  // Simulate an incoming transmission from another officer
  const simulateIncomingTransmission = (
    customMessage?: string,
    senderName: string = 'Oficial Juan Perez',
    callsign: string = 'PATRULLA-ESTATAL-302'
  ) => {
    if (isTransmitting || isReceiving) return;

    if (settings.incomingCallChirp) {
      soundEngine.playIncomingChirp();
    }
    setIsReceiving(true);
    setReceivingSender({
      name: senderName,
      callsign: callsign,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    });

    // Si la aplicación se encuentra en segundo plano o minimizada, emitir notificación Service Worker
    if (typeof document !== 'undefined' && document.hidden) {
      pushNotificationService.showLocalBackgroundNotification({
        title: `📻 RÁFAGA PTT DE ${callsign}`,
        body: customMessage || `Mensaje de voz táctica recibido en ${activeChannel?.name || 'Canal General'}.`,
        channelId: activeChannel?.id,
        callsign: callsign,
      });
    }

    // Voice simulation using SpeechSynthesis or tones
    if ('speechSynthesis' in window && !isMuted) {
      const phrase =
        customMessage ||
        `C5i Central de Patrulla ${callsign}, sector despejado sobre Bulevar Colosio, sin novedad. 10-4.`;
      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.lang = 'es-MX';
      utterance.rate = 1.05;
      utterance.pitch = 0.9;
      utterance.onend = () => {
        soundEngine.playRogerBeep();
        setIsReceiving(false);
        setReceivingSender(null);
      };
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => {
        soundEngine.playRogerBeep();
        setIsReceiving(false);
        setReceivingSender(null);
      }, 4000);
    }
  };

  // Play a recorded voice message
  const playRecordedMessage = (msg: VoiceMessage) => {
    if (currentlyPlayingId === msg.id) {
      if (activeAudioPlayerRef.current) {
        activeAudioPlayerRef.current.pause();
      }
      setCurrentlyPlayingId(null);
      return;
    }

    if (msg.audio_url) {
      if (activeAudioPlayerRef.current) {
        activeAudioPlayerRef.current.pause();
      }
      const audio = new Audio(msg.audio_url);
      audio.volume = volume;
      activeAudioPlayerRef.current = audio;
      setCurrentlyPlayingId(msg.id);

      audio.onended = () => {
        soundEngine.playRogerBeep();
        setCurrentlyPlayingId(null);
      };
      audio.play().catch(() => {
        setCurrentlyPlayingId(null);
      });
    } else {
      // Simulate playback with speech synthesizer
      setCurrentlyPlayingId(msg.id);
      soundEngine.playIncomingChirp();
      if ('speechSynthesis' in window) {
        const text = `Transmisión registrada de ${msg.sender_name}, indicativo ${msg.sender_callsign || 'C5i'}. Duración: ${msg.duration_seconds} segundos.`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-MX';
        utterance.onend = () => {
          soundEngine.playRogerBeep();
          setCurrentlyPlayingId(null);
        };
        window.speechSynthesis.speak(utterance);
      } else {
        setTimeout(() => {
          soundEngine.playRogerBeep();
          setCurrentlyPlayingId(null);
        }, 3000);
      }
    }
  };

  const refreshChannels = async () => {
    if (user) {
      const chs = await getChannelsApi(user.id);
      setChannels(chs);
    }
  };

  const refreshContacts = async () => {
    if (user) {
      const cts = await getContactsApi(user.id);
      setContacts(cts);
    }
  };

  const refreshMessages = async () => {
    const targetId = mode === 'channel' ? activeChannel?.id : activeContact?.contact_user_id;
    if (targetId && user) {
      const msgs = await getVoiceMessagesApi(targetId, mode, user.id);
      setVoiceMessages(msgs);
    }
  };

  return (
    <RadioContext.Provider
      value={{
        mode,
        setMode,
        activeChannel,
        setActiveChannel,
        activeContact,
        setActiveContact,
        channels,
        contacts,
        voiceMessages,
        isTransmitting,
        isReceiving,
        receivingSender,
        transmissionDuration,
        audioLevels,
        volume,
        setVolume,
        isMuted,
        setIsMuted,
        startTransmission,
        stopTransmission,
        triggerEmergencySos,
        refreshChannels,
        refreshContacts,
        refreshMessages,
        simulateIncomingTransmission,
        playRecordedMessage,
        currentlyPlayingId,
      }}
    >
      {children}
    </RadioContext.Provider>
  );
};

export const useRadio = () => {
  const context = useContext(RadioContext);
  if (!context) {
    throw new Error('useRadio must be used within a RadioProvider');
  }
  return context;
};
