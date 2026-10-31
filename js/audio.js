/**
 * Audio Engine per TrackMaster
 * Genera suoni sintetizzati con Web Audio API per countdown, start e recuperi
 */
class AthleticsAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  beep(freq = 440, duration = 0.15, type = 'sine', volume = 0.5) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  // Segnale di "Pronti" (tono medio)
  playReady() {
    this.beep(520, 0.25, 'triangle', 0.6);
  }

  // Segnale di "Ai vostri posti" (tono basso)
  playOnYourMarks() {
    this.beep(392, 0.35, 'sine', 0.5);
  }

  // Sparo / Segnale di Start (tono squillante e forte)
  playStartGun() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      // Combiniamo un impulso di rumore bianco + onda quadra per simulare lo sparo dello starter
      const bufferSize = this.ctx.sampleRate * 0.2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(1200, this.ctx.currentTime);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.9, this.ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      noise.start();

      // Accompagnamento con tono alto 880Hz
      this.beep(880, 0.2, 'sawtooth', 0.5);
    } catch (e) {
      this.beep(880, 0.3, 'square', 0.7);
    }
  }

  // Segnale Lap / Split
  playLap() {
    this.beep(784, 0.08, 'sine', 0.4);
  }

  // Segnale fine recupero
  playRecoveryEnd() {
    this.beep(659.25, 0.15, 'sine', 0.6);
    setTimeout(() => this.beep(880, 0.4, 'triangle', 0.7), 160);
  }

  // Countdown 3-2-1
  playCountdownTick() {
    this.beep(440, 0.1, 'sine', 0.4);
  }

  // Segnale Inizio Lavoro / Round (EMOM & Tabata)
  playWorkStart() {
    this.beep(587.33, 0.12, 'triangle', 0.6);
    setTimeout(() => this.beep(880, 0.28, 'triangle', 0.7), 130);
  }

  // Segnale Inizio Riposo (Tabata)
  playRestStart() {
    this.beep(440, 0.15, 'sine', 0.5);
    setTimeout(() => this.beep(330, 0.3, 'sine', 0.5), 160);
  }

  // Segnale Completamento Allenamento
  playSessionDone() {
    this.beep(523.25, 0.15, 'sine', 0.6);
    setTimeout(() => this.beep(659.25, 0.15, 'sine', 0.6), 150);
    setTimeout(() => this.beep(783.99, 0.15, 'sine', 0.6), 300);
    setTimeout(() => this.beep(1046.50, 0.4, 'triangle', 0.8), 450);
  }
}

window.athleticsAudio = new AthleticsAudio();
