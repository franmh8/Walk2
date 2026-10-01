// Audio synthesizer and Web Audio API engine for C5i Tactical Radio

class SoundEngine {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.85;

  private getContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  // Tactical PTT Key-down beep (PTT activado - Chirp de inicio de transmisión)
  public playPttStart() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // 1st Tone
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(900, now);
      osc1.frequency.exponentialRampToValueAtTime(1200, now + 0.06);

      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.3 * this.volume, now + 0.01);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.08);

      // Short squelch burst
      this.playSquelchBurst(now + 0.06, 0.04, 0.15 * this.volume);
    } catch (e) {
      console.warn('AudioContext error:', e);
    }
  }

  // Roger Beep (PTT soltado - Notificación de cambio y fuera)
  public playRogerBeep() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Motorola / Zello style 2-tone roger beep (1200Hz -> 1000Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';

      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.setValueAtTime(1050, now + 0.07);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.35 * this.volume, now + 0.01);
      gain.gain.setValueAtTime(0.35 * this.volume, now + 0.06);
      gain.gain.linearRampToValueAtTime(0.35 * this.volume, now + 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.17);

      // Final squelch click
      this.playSquelchBurst(now + 0.15, 0.05, 0.2 * this.volume);
    } catch (e) {
      console.warn('AudioContext error:', e);
    }
  }

  // Squelch static burst (Simulación de estática de canal de radio)
  private playSquelchBurst(startTime: number, duration: number, vol: number) {
    try {
      const ctx = this.getContext();
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      // Bandpass filter for radio frequency effect (300Hz - 3400Hz)
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1800, startTime);
      filter.Q.setValueAtTime(1.5, startTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vol, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      whiteNoise.start(startTime);
      whiteNoise.stop(startTime + duration);
    } catch (e) {
      // ignore
    }
  }

  // Emergency 10-33 / Código Rojo siren alert
  public playEmergencyAlert() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      for (let i = 0; i < 3; i++) {
        const offset = i * 0.25;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now + offset);
        osc.frequency.linearRampToValueAtTime(1400, now + offset + 0.12);
        osc.frequency.linearRampToValueAtTime(880, now + offset + 0.22);

        gain.gain.setValueAtTime(0, now + offset);
        gain.gain.linearRampToValueAtTime(0.4 * this.volume, now + offset + 0.02);
        gain.gain.linearRampToValueAtTime(0.4 * this.volume, now + offset + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.24);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + offset);
        osc.stop(now + offset + 0.25);
      }
    } catch (e) {
      console.warn('Emergency alert audio error:', e);
    }
  }

  // Incoming transmission call sound
  public playIncomingChirp() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      this.playSquelchBurst(now, 0.08, 0.25 * this.volume);

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(750, now + 0.05);
      osc.frequency.exponentialRampToValueAtTime(950, now + 0.12);

      gain.gain.setValueAtTime(0, now + 0.05);
      gain.gain.linearRampToValueAtTime(0.3 * this.volume, now + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + 0.05);
      osc.stop(now + 0.16);
    } catch (e) {
      // ignore
    }
  }

  // Network reconnected chime (Tono de reconexión y sincronización automática de red C5i)
  public playReconnectedChirp() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // 3-tone ascending pleasant tactical chime (600Hz -> 800Hz -> 1200Hz)
      const freqs = [600, 800, 1200];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + idx * 0.08;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.25 * this.volume, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.13);
      });
    } catch (e) {
      // ignore
    }
  }

  // Network connection lost warning tone
  public playConnectionLostWarning() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // 2-tone descending warning (800Hz -> 450Hz)
      const freqs = [800, 450];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + idx * 0.1;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.3 * this.volume, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.15);
      });
    } catch (e) {
      // ignore
    }
  }

  // Play radio message with speech synthesis simulation
  public playRadioMessage(senderName: string, durationSeconds: number, onEnd?: () => void) {
    if (this.isMuted) {
      onEnd?.();
      return;
    }

    this.playIncomingChirp();

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text = `Atención central C5i, transmite ${senderName}. Reporte en frecuencia. 10-4.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-MX';
      utterance.rate = 1.05;
      utterance.pitch = 0.95;
      utterance.volume = this.volume;

      utterance.onend = () => {
        this.playRogerBeep();
        onEnd?.();
      };
      utterance.onerror = () => {
        this.playRogerBeep();
        onEnd?.();
      };

      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => {
        this.playRogerBeep();
        onEnd?.();
      }, (durationSeconds || 3) * 1000);
    }
  }

  // Stop all active synthesizers
  public stopAllAudio() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const soundEngine = new SoundEngine();
