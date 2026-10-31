/**
 * Motore Cronometro Professionale per Atletica Leggera
 * Supporta Cronometro Singolo con Split/Lap, Multi-Corsia (Multi-Atleta),
 * Procedura Starter Ufficiale e Timer di Recupero automatico.
 */
class AthleticsStopwatch {
  constructor() {
    this.running = false;
    this.startTime = 0;
    this.elapsedTime = 0;
    this.timerId = null;
    this.laps = [];
    this.currentAthleteId = null;
    this.currentEventName = '100m';

    // Multi-corsia (fino a 6 corsie per tablet/iPad)
    this.multiActive = false;
    this.lanes = [
      { id: 1, athleteId: null, athleteName: 'Corsia 1', time: 0, finished: false, formatted: '00:00.00' },
      { id: 2, athleteId: null, athleteName: 'Corsia 2', time: 0, finished: false, formatted: '00:00.00' },
      { id: 3, athleteId: null, athleteName: 'Corsia 3', time: 0, finished: false, formatted: '00:00.00' },
      { id: 4, athleteId: null, athleteName: 'Corsia 4', time: 0, finished: false, formatted: '00:00.00' },
      { id: 5, athleteId: null, athleteName: 'Corsia 5', time: 0, finished: false, formatted: '00:00.00' },
      { id: 6, athleteId: null, athleteName: 'Corsia 6', time: 0, finished: false, formatted: '00:00.00' },
    ];

    // Timer di recupero
    this.recoveryDuration = 180; // 3 minuti default in secondi
    this.recoveryRemaining = 0;
    this.recoveryInterval = null;

    // Wake Lock per impedire lo standby dello schermo su iPad/iPhone
    this.wakeLock = null;
    this.initWakeLock();
  }

  async initWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        this.wakeLock = await navigator.wakeLock.request('screen');
      } catch (err) {
        console.log('Wake Lock non disponibile o rifiutato:', err);
      }
    }
  }

  // Avvio / Stop del cronometro principale
  toggle() {
    if (this.running) {
      this.stop();
    } else {
      this.start();
    }
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.startTime = performance.now() - this.elapsedTime;

    if (this.multiActive) {
      this.lanes.forEach(l => {
        l.time = 0;
        l.finished = false;
        l.formatted = '00:00.00';
      });
    }

    const tick = () => {
      if (!this.running) return;
      this.elapsedTime = performance.now() - this.startTime;
      this.updateDisplay();
      this.timerId = requestAnimationFrame(tick);
    };
    this.timerId = requestAnimationFrame(tick);

    if (window.athleticsAudio) {
      window.athleticsAudio.playStartGun();
    }
    this.onStateChange('start');
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    cancelAnimationFrame(this.timerId);
    this.updateDisplay();

    // Se multi-atleta, ferma chi non era ancora arrivato
    if (this.multiActive) {
      this.lanes.forEach(l => {
        if (!l.finished) {
          l.time = this.elapsedTime;
          l.finished = true;
          l.formatted = this.formatTime(this.elapsedTime);
        }
      });
    }

    this.onStateChange('stop');
  }

  reset() {
    this.running = false;
    cancelAnimationFrame(this.timerId);
    this.elapsedTime = 0;
    this.laps = [];
    if (this.multiActive) {
      this.lanes.forEach(l => {
        l.time = 0;
        l.finished = false;
        l.formatted = '00:00.00';
      });
    }
    this.updateDisplay();
    this.onStateChange('reset');
  }

  // Registra parziale (Split/Lap)
  recordLap() {
    if (!this.running) return;
    const currentLapTime = this.elapsedTime;
    const prevLapTime = this.laps.length > 0 ? this.laps[0].totalMs : 0;
    const splitMs = currentLapTime - prevLapTime;

    const lapData = {
      index: this.laps.length + 1,
      totalMs: currentLapTime,
      totalStr: this.formatTime(currentLapTime),
      splitMs: splitMs,
      splitStr: this.formatTime(splitMs)
    };

    this.laps.unshift(lapData);
    if (window.athleticsAudio) window.athleticsAudio.playLap();
    this.onLapsChange(this.laps);
  }

  // Arresto corsia singola (Multi-corsia)
  stopLane(laneId) {
    if (!this.running) return;
    const lane = this.lanes.find(l => l.id === laneId);
    if (lane && !lane.finished) {
      lane.time = this.elapsedTime;
      lane.finished = true;
      lane.formatted = this.formatTime(lane.time);
      if (window.athleticsAudio) window.athleticsAudio.playLap();
      this.onLanesChange(this.lanes);

      // Se tutte le corsie sono arrivate, arresta il cronometro generale
      const allFinished = this.lanes.every(l => l.finished);
      if (allFinished) {
        this.stop();
      }
    }
  }

  // Starter Automatico Ufficiale FIDAL
  triggerOfficialStart(onStatusCallback) {
    if (this.running) return;
    this.reset();

    // 1. "Ai vostri posti"
    if (onStatusCallback) onStatusCallback('Ai vostri posti...');
    if (window.athleticsAudio) window.athleticsAudio.playOnYourMarks();

    setTimeout(() => {
      // 2. "Pronti"
      if (onStatusCallback) onStatusCallback('Pronti...');
      if (window.athleticsAudio) window.athleticsAudio.playReady();

      // 3. Tempo casuale tra 1.5s e 2.3s prima dello sparo
      const randomDelay = 1500 + Math.random() * 800;
      setTimeout(() => {
        if (onStatusCallback) onStatusCallback('VIA!');
        this.start();
        setTimeout(() => {
          if (onStatusCallback) onStatusCallback('');
        }, 1200);
      }, randomDelay);
    }, 2500);
  }

  // Timer di recupero
  startRecovery(seconds = null, onTickCallback, onEndCallback) {
    if (seconds) this.recoveryDuration = seconds;
    this.recoveryRemaining = this.recoveryDuration;

    if (this.recoveryInterval) clearInterval(this.recoveryInterval);

    this.recoveryInterval = setInterval(() => {
      this.recoveryRemaining--;
      if (this.recoveryRemaining <= 3 && this.recoveryRemaining > 0) {
        if (window.athleticsAudio) window.athleticsAudio.playCountdownTick();
      }

      if (onTickCallback) {
        onTickCallback(this.formatSeconds(this.recoveryRemaining), this.recoveryRemaining);
      }

      if (this.recoveryRemaining <= 0) {
        clearInterval(this.recoveryInterval);
        this.recoveryInterval = null;
        if (window.athleticsAudio) window.athleticsAudio.playRecoveryEnd();
        if (onEndCallback) onEndCallback();
      }
    }, 1000);
  }

  stopRecovery() {
    if (this.recoveryInterval) {
      clearInterval(this.recoveryInterval);
      this.recoveryInterval = null;
    }
  }

  // Formattazione tempo MM:SS.CC (o SS.CC per < 1 min)
  formatTime(ms) {
    if (ms < 0) ms = 0;
    const totalCentis = Math.floor(ms / 10);
    const centis = totalCentis % 100;
    const totalSecs = Math.floor(totalCentis / 100);
    const secs = totalSecs % 60;
    const mins = Math.floor(totalSecs / 60);

    const pad = (n, len = 2) => String(n).padStart(len, '0');
    return `${pad(mins)}:${pad(secs)}.${pad(centis)}`;
  }

  formatSeconds(totalSecs) {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(mins)}:${pad(secs)}`;
  }

  updateDisplay() {
    const formatted = this.formatTime(this.elapsedTime);
    this.onTick(formatted, this.elapsedTime);
  }

  // Hooks per UI
  onTick(formatted, ms) {}
  onStateChange(state) {}
  onLapsChange(laps) {}
  onLanesChange(lanes) {}
}

window.athleticsStopwatch = new AthleticsStopwatch();
