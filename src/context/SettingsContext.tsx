import React, { createContext, useContext, useState, useEffect } from 'react';
import { soundEngine } from '../utils/audioEffects';
import { pushNotificationService } from '../services/pushNotificationService';
import { saveUserSettingsApi } from '../api/radioApi';

export interface AppSettings {
  // Apariencia
  highContrast: boolean;
  reduceAnimations: boolean;

  // Notificaciones y Alertas
  pushNotifications: boolean;
  emergencyAudioAlerts: boolean;
  incomingCallChirp: boolean;
  channelMessageSounds: boolean;
  vibrationOnPtt: boolean;

  // Audio y Radio PTT
  rogerBeep: boolean;
  pttStartChirp: boolean;
  pttMode: 'hold' | 'toggle';
  noiseSuppression: boolean;
  radioVolume: number; // 0 to 100

  // Red y Transmisión
  dataSaver: boolean;
  reconnectAlert: boolean;
  audioQuality: 'standard' | 'hd';

  // Seguridad y SOS
  emergencyGps: boolean;
  confirmSos: boolean;
  rememberPinSession: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  highContrast: false,
  reduceAnimations: false,

  pushNotifications: true,
  emergencyAudioAlerts: true,
  incomingCallChirp: true,
  channelMessageSounds: true,
  vibrationOnPtt: true,

  rogerBeep: true,
  pttStartChirp: true,
  pttMode: 'hold',
  noiseSuppression: true,
  radioVolume: 85,

  dataSaver: false,
  reconnectAlert: true,
  audioQuality: 'standard',

  emergencyGps: true,
  confirmSos: true,
  rememberPinSession: true,
};

const STORAGE_KEY = 'c5i_tactical_settings_v1';

interface SettingsContextType {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  resetToDefaults: () => void;
  testSound: (type: 'roger' | 'chirp' | 'sos' | 'incoming') => void;
  testPushNotification: () => Promise<void>;
  requestPushPermission: () => Promise<NotificationPermission>;
  hasPushPermission: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Error reading settings from localStorage:', e);
    }
    return DEFAULT_SETTINGS;
  });

  const [hasPushPermission, setHasPushPermission] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  });

  // Save changes to localStorage and database
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      const userDataRaw = localStorage.getItem('userData');
      const userId = userDataRaw ? JSON.parse(userDataRaw)?.id : localStorage.getItem('userToken');
      if (userId) {
        saveUserSettingsApi(String(userId), {
          theme_mode: settings.themeMode,
          push_notifications: settings.pushNotifications,
          channel_message_sounds: settings.channelMessageSounds,
          ptt_mode: settings.pttMode,
          roger_beep: settings.rogerBeep,
          vibration_on_ptt: settings.vibrationOnPtt,
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('Error saving settings to localStorage:', e);
    }
  }, [settings]);

  // Sync highContrast with document element
  useEffect(() => {
    if (settings.highContrast) {
      document.documentElement.classList.add('tactical-high-contrast');
    } else {
      document.documentElement.classList.remove('tactical-high-contrast');
    }
  }, [settings.highContrast]);

  // Sync volume with soundEngine
  useEffect(() => {
    soundEngine.setVolume(settings.radioVolume / 100);
  }, [settings.radioVolume]);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const testSound = (type: 'roger' | 'chirp' | 'sos' | 'incoming') => {
    switch (type) {
      case 'roger':
        soundEngine.playRogerBeep();
        break;
      case 'chirp':
        soundEngine.playPttStart();
        break;
      case 'sos':
        soundEngine.playEmergencyAlert();
        break;
      case 'incoming':
        soundEngine.playIncomingChirp();
        break;
    }
  };

  const requestPushPermission = async (): Promise<NotificationPermission> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    try {
      const permission = await Notification.requestPermission();
      setHasPushPermission(permission === 'granted');
      return permission;
    } catch (e) {
      console.warn('Error requesting notification permission:', e);
      return 'denied';
    }
  };

  const testPushNotification = async () => {
    const perm = await requestPushPermission();
    if (perm === 'granted') {
      await pushNotificationService.showLocalBackgroundNotification({
        title: '🔴 Radio PTT C5i - Notificación de Prueba',
        body: 'El canal de notificaciones y alertas tácticas está activo y funcionando correctamente.',
        priority: 'normal',
      });
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSetting,
        resetToDefaults,
        testSound,
        testPushNotification,
        requestPushPermission,
        hasPushPermission,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
