import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

let currentRecording: Audio.Recording | null = null;
let currentSound: Audio.Sound | null = null;

export const AudioService = {
  async init() {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (err) {
      console.warn('Error inicializando AudioService:', err);
    }
  },

  async startRecording(): Promise<boolean> {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      if (currentRecording) {
        try {
          await currentRecording.stopAndUnloadAsync();
        } catch (_) {}
        currentRecording = null;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      currentRecording = recording;
      return true;
    } catch (err) {
      console.error('Error al iniciar grabación PTT:', err);
      return false;
    }
  },

  async stopRecording(): Promise<string | null> {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (!currentRecording) return null;

      await currentRecording.stopAndUnloadAsync();
      const uri = currentRecording.getURI();
      currentRecording = null;
      return uri;
    } catch (err) {
      console.error('Error al detener grabación PTT:', err);
      currentRecording = null;
      return null;
    }
  },

  async playAudio(uri: string) {
    try {
      if (currentSound) {
        await currentSound.unloadAsync();
        currentSound = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );
      currentSound = sound;
      await sound.playAsync();
    } catch (err) {
      console.error('Error al reproducir audio:', err);
    }
  },

  async playRogerBeep() {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_) {}
  },
};
