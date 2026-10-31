/**
 * Gestione Database Locale (IndexedDB con fallback LocalStorage) per TrackMaster
 * Include categorie FIDAL, discipline ufficiali e persistenza dati offline.
 */
class AthleticsDB {
  constructor() {
    this.storageKey = 'trackmaster_data_v1';
    this.data = this.getDefaultData();
    this.load();
  }

  getDefaultData() {
    return {
      athletes: [
        {
          id: 'ath-1',
          nome: 'Marco',
          cognome: 'Rossi',
          anno: 2004,
          sesso: 'M',
          categoria: 'Promesse',
          specialita: '100m',
          pb: '10.58',
          sb: '10.64',
          gruppo: 'Velocità',
          note: 'Ottima partenza dai blocchi. Lavorare sulla transizione.'
        },
        {
          id: 'ath-2',
          nome: 'Chiara',
          cognome: 'Bianchi',
          anno: 2006,
          sesso: 'F',
          categoria: 'Juniores',
          specialita: '400m',
          pb: '54.92',
          sb: '55.30',
          gruppo: 'Velocità prolungata',
          note: 'Passaggio ideale ai 200m in 25.8.'
        },
        {
          id: 'ath-3',
          nome: 'Davide',
          cognome: 'Ferrari',
          anno: 2002,
          sesso: 'M',
          categoria: 'Seniores',
          specialita: '800m',
          pb: '1:48.30',
          sb: '1:49.12',
          gruppo: 'Mezzofondo',
          note: 'Test aerobico VO2max eccellente.'
        },
        {
          id: 'ath-4',
          nome: 'Sofia',
          cognome: 'Romano',
          anno: 2008,
          sesso: 'F',
          categoria: 'Allieve',
          specialita: 'Salto in Lungo',
          pb: '5.82m',
          sb: '5.75m',
          gruppo: 'Salti',
          note: 'Rincorsa a 16 passi controllata.'
        }
      ],
      groups: [
        { id: 'grp-1', nome: 'Velocità', colore: '#f97316' },
        { id: 'grp-2', nome: 'Velocità prolungata', colore: '#eab308' },
        { id: 'grp-3', nome: 'Mezzofondo', colore: '#06b6d4' },
        { id: 'grp-4', nome: 'Salti', colore: '#a855f7' },
        { id: 'grp-5', nome: 'Lanci', colore: '#10b981' }
      ],
      workouts: [
        {
          id: 'wo-1',
          titolo: 'Ripetute Veloci Pre-Gara',
          data: '2026-10-18',
          gruppo: 'Velocità',
          struttura: 'Riscaldamento + 4x60m blocchi + 3x150m rec. 4\'',
          note: 'Focus su reattività e frequenza passi.'
        },
        {
          id: 'wo-2',
          titolo: 'Capacità Lattacida 400m',
          data: '2026-10-17',
          gruppo: 'Velocità prolungata',
          struttura: '3x300m rec. 6\' al 95%',
          note: 'Verifica passaggio e acido lattico.'
        },
        {
          id: 'wo-3',
          titolo: 'Ritmo Gara 800m',
          data: '2026-10-16',
          gruppo: 'Mezzofondo',
          struttura: '2x (500m rec. 2\' + 300m) rec. 8\' tra le serie',
          note: 'Simulazione chiusura in progressione.'
        }
      ],
      results: [
        {
          id: 'res-1',
          data: '2026-10-18 10:30',
          atletaId: 'ath-1',
          atletaNome: 'Marco Rossi',
          evento: '60m dai blocchi',
          tempoMs: 6920,
          tempoStr: '06.92',
          splits: ['01.82 (30m)', '06.92 (60m)'],
          note: 'Vento +0.8 m/s, ottima uscita.'
        },
        {
          id: 'res-2',
          data: '2026-10-18 10:45',
          atletaId: 'ath-2',
          atletaNome: 'Chiara Bianchi',
          evento: '300m',
          tempoMs: 39400,
          tempoStr: '39.40',
          splits: ['12.80 (100m)', '25.60 (200m)', '39.40 (300m)'],
          note: 'Passaggio perfetto ai 200m.'
        }
      ],
      settings: {
        starterDelayMin: 1.5,
        starterDelayMax: 2.5,
        soundEnabled: true,
        keepAwake: true,
        highContrast: false
      },
      strengthWorkouts: [
        {
          id: 'swo-1',
          titolo: 'Forza Esplosiva & Reattività (Velocità / Ostacoli)',
          gruppo: 'Velocità',
          esercizi: [
            { nome: 'Power Clean (Girata al petto)', serie: '4', reps: '3', carico: '80% 1RM', rec: '3 min', note: 'Esplosività massima' },
            { nome: 'Mezzo Back Squat dinamico', serie: '4', reps: '4', carico: '75% 1RM', rec: '2.5 min', note: 'Spinta accelerata' },
            { nome: 'Hip Thrust con bilanciere', serie: '3', reps: '6', carico: '80% 1RM', rec: '2 min', note: 'Estensione anca per sprint' },
            { nome: 'Balzi continui tra 5 ostacoli', serie: '4', reps: '5 balzi', carico: 'Corpo libero', rec: '2 min', note: 'Reattività piede e ginocchia al petto' },
            { nome: 'Nordic Hamstring Curl', serie: '3', reps: '6', carico: 'Corpo libero / elastico', rec: '90s', note: 'Fase eccentrica lenta 4s' }
          ],
          note: 'Ideale 48-72h prima delle sedute di sprint veloce.'
        },
        {
          id: 'swo-2',
          titolo: 'Forza Elastico-Riflessa & Pliometria (Salti & Sprinter)',
          gruppo: 'Salti',
          esercizi: [
            { nome: 'Drop Jump da plinto 35cm + sprint 10m', serie: '4', reps: '5', carico: 'Corpo libero', rec: '2 min', note: 'Minimo tempo di contatto al suolo' },
            { nome: 'Back Squat profondo', serie: '4', reps: '5', carico: '80% 1RM', rec: '3 min', note: 'Forza di base' },
            { nome: 'Single-Leg Romanian Deadlift (RDL)', serie: '3', reps: '8 per gamba', carico: 'Manubrio 16-24kg', rec: '90s', note: 'Stabilità bacino e catena posteriore' },
            { nome: 'Pogo Jumps reattivi caviglia', serie: '3', reps: '25 secondi', carico: 'Corpo libero', rec: '60s', note: 'Stiffness del tendine d\'Achille' },
            { nome: 'Affondi bulgari con manubri', serie: '3', reps: '6 per gamba', carico: 'Medio', rec: '90s', note: 'Forza monopodalica' }
          ],
          note: 'Focus su spinta elastica e stiffness articolare.'
        },
        {
          id: 'swo-3',
          titolo: 'Resistenza alla Forza & Core Stability (Mezzofondo & Fondo)',
          gruppo: 'Mezzofondo',
          esercizi: [
            { nome: 'Step-up esplosivi su box con manubri', serie: '3', reps: '10 per gamba', carico: '10-15kg', rec: '90s', note: 'Frequenza e tenuta del passo' },
            { nome: 'Affondi camminati con sovraccarico', serie: '3', reps: '16 passi', carico: 'Manubri', rec: '90s', note: 'Stabilità quadricipiti e glutei' },
            { nome: 'Eccentric Heel Drops su gradino', serie: '4', reps: '12 per piede', carico: 'Corpo libero + peso', rec: '60s', note: 'Prevenzione tendinopatia achillea' },
            { nome: 'Circuito Core (Plank + Hollow + Bird-Dog)', serie: '3', reps: '45s ciascuno', carico: 'Corpo libero', rec: '60s', note: 'Tenuta posturale negli ultimi 300m' },
            { nome: 'Pallof Press anti-rotazione', serie: '3', reps: '12 per lato', carico: 'Cavo/Elastico', rec: '60s', note: 'Stabilità tronco in curva' }
          ],
          note: 'Migliora l\'economia di corsa e ritarda l\'affaticamento.'
        },
        {
          id: 'swo-4',
          titolo: 'Potenza e Catena Cinetica (Lanciatori)',
          gruppo: 'Lanci',
          esercizi: [
            { nome: 'Strappo da sospensione (Hang Snatch)', serie: '4', reps: '3', carico: '75% 1RM', rec: '3 min', note: 'Tripla estensione esplosiva' },
            { nome: 'Panca Piana esplosiva con fermo al petto', serie: '4', reps: '5', carico: '85% 1RM', rec: '3 min', note: 'Spinta pettorali e tricipiti' },
            { nome: 'Push Press con bilanciere', serie: '4', reps: '4', carico: '80% 1RM', rec: '2.5 min', note: 'Spinta gambe trasferita alle braccia' },
            { nome: 'Lanci torsionali con palla medica 5kg al muro', serie: '4', reps: '8 per lato', carico: 'Medball', rec: '90s', note: 'Velocità di rotazione del busto' },
            { nome: 'Landmine Rotations', serie: '3', reps: '10 per lato', carico: 'Bilanciere', rec: '90s', note: 'Forza diagonale degli obliqui' }
          ],
          note: 'Massima espressione di potenza e coordinazione intra-muscolare.'
        },
        {
          id: 'swo-5',
          titolo: 'Prevenzione Infortuni & Catena Posteriore (Tutte le specialità)',
          gruppo: 'Generale',
          esercizi: [
            { nome: 'Nordic Hamstring Curl assistito', serie: '3', reps: '6', carico: 'Corpo libero', rec: '90s', note: 'Prevenzione lesioni bicipite femorale' },
            { nome: 'Copenhagen Adductor Plank', serie: '3', reps: '30s per lato', carico: 'Isometrico', rec: '60s', note: 'Prevenzione pubalgia e adduttori' },
            { nome: 'Tibiale anteriore con elastico', serie: '3', reps: '15 per piede', carico: 'Elastico', rec: '45s', note: 'Prevenzione periostite tibiale' },
            { nome: 'Spanish Squat isometrico', serie: '4', reps: '40s', carico: 'Elastico pesante', rec: '60s', note: 'Salute tendine rotuleo' }
          ],
          note: 'Da eseguire 2 volte a settimana per azzerare gli infortuni tipici della pista.'
        }
      ],
      strengthLogs: [
        {
          id: 'slog-1',
          data: '2026-10-18 11:30',
          atletaId: 'ath-1',
          atletaNome: 'Marco Rossi',
          esercizio: 'Power Clean',
          caricoKg: 85,
          serie: '4',
          reps: '3',
          note: 'Ottima traiettoria e reattività sotto il bilanciere.'
        },
        {
          id: 'slog-2',
          data: '2026-10-18 11:55',
          atletaId: 'ath-1',
          atletaNome: 'Marco Rossi',
          esercizio: 'Mezzo Squat Dinamico',
          caricoKg: 120,
          serie: '4',
          reps: '4',
          note: 'Spinta fluida in salita.'
        },
        {
          id: 'slog-3',
          data: '2026-10-17 16:45',
          atletaId: 'ath-2',
          atletaNome: 'Chiara Bianchi',
          esercizio: 'Hip Thrust con bilanciere',
          caricoKg: 95,
          serie: '3',
          reps: '6',
          note: 'Fermo 2s in alto.'
        }
      ],
      sheetSessions: [
        {
          id: 'sheet-1',
          data: '2026-10-30 10:15',
          persona: 'Marco Rossi',
          tipo: 'Corsa Veloce - 60m',
          durataStr: '06.92',
          durataSecs: 7,
          note: 'Partenza reattiva dai blocchi'
        },
        {
          id: 'sheet-2',
          data: '2026-10-30 10:40',
          persona: 'Chiara Bianchi',
          tipo: 'Ripetute 300m',
          durataStr: '39.40',
          durataSecs: 39,
          note: 'Passaggio regolare ai 200m'
        },
        {
          id: 'sheet-3',
          data: '2026-10-30 11:10',
          persona: 'Davide Ferrari',
          tipo: 'Fondo / Cardio 5km',
          durataStr: "18' 30\"",
          durataSecs: 1110,
          note: 'Ritmo costante 3:42/km'
        }
      ],
      chronoEvents: [
        { id: 'ev-1', nome: '60m Piani', categoria: 'Velocità' },
        { id: 'ev-2', nome: '100m Piani', categoria: 'Velocità' },
        { id: 'ev-3', nome: '200m Piani', categoria: 'Velocità' },
        { id: 'ev-4', nome: '300m Ripetuta', categoria: 'Velocità prolungata' },
        { id: 'ev-5', nome: '400m Piani', categoria: 'Velocità prolungata' },
        { id: 'ev-6', nome: '600m Mezzofondo', categoria: 'Mezzofondo' },
        { id: 'ev-7', nome: '800m Mezzofondo', categoria: 'Mezzofondo' },
        { id: 'ev-8', nome: '1000m Test', categoria: 'Mezzofondo' },
        { id: 'ev-9', nome: '1500m', categoria: 'Mezzofondo' },
        { id: 'ev-10', nome: '3000m', categoria: 'Mezzofondo' },
        { id: 'ev-11', nome: '100hs / 110hs', categoria: 'Ostacoli' },
        { id: 'ev-12', nome: 'Salto / Rincorsa', categoria: 'Salti' },
        { id: 'ev-13', nome: 'Ripetute Libere', categoria: 'Generale' }
      ]
    };
  }

  load() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.data = { ...this.getDefaultData(), ...parsed };
        if (!this.data.strengthWorkouts || this.data.strengthWorkouts.length === 0) {
          this.data.strengthWorkouts = this.getDefaultData().strengthWorkouts;
        }
        if (!this.data.strengthLogs) {
          this.data.strengthLogs = this.getDefaultData().strengthLogs;
        }
        if (!this.data.sheetSessions || this.data.sheetSessions.length === 0) {
          this.data.sheetSessions = this.getDefaultData().sheetSessions;
        }
        if (!this.data.chronoEvents || this.data.chronoEvents.length === 0) {
          this.data.chronoEvents = this.getDefaultData().chronoEvents;
        }
      } else {
        this.save();
      }
    } catch (e) {
      console.warn('Errore lettura dati da storage, uso dati default:', e);
    }
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (e) {
      console.error('Errore salvataggio storage:', e);
    }
  }

  // --- Atleti ---
  getAthletes() {
    return this.data.athletes || [];
  }

  getAthlete(id) {
    return this.getAthletes().find(a => a.id === id);
  }

  saveAthlete(athlete) {
    if (!athlete.id) {
      athlete.id = 'ath-' + Date.now();
      this.data.athletes.unshift(athlete);
    } else {
      const index = this.data.athletes.findIndex(a => a.id === athlete.id);
      if (index >= 0) {
        this.data.athletes[index] = athlete;
      } else {
        this.data.athletes.push(athlete);
      }
    }
    this.save();
    return athlete;
  }

  deleteAthlete(id) {
    this.data.athletes = this.data.athletes.filter(a => a.id !== id);
    this.save();
  }

  // --- Gruppi ---
  getGroups() {
    return this.data.groups || [];
  }

  saveGroup(group) {
    if (!group.id) {
      group.id = 'grp-' + Date.now();
      this.data.groups.push(group);
    } else {
      const idx = this.data.groups.findIndex(g => g.id === group.id);
      if (idx >= 0) this.data.groups[idx] = group;
      else this.data.groups.push(group);
    }
    this.save();
    return group;
  }

  // --- Schede / Allenamenti ---
  getWorkouts() {
    return this.data.workouts || [];
  }

  saveWorkout(workout) {
    if (!workout.id) {
      workout.id = 'wo-' + Date.now();
      this.data.workouts.unshift(workout);
    } else {
      const idx = this.data.workouts.findIndex(w => w.id === workout.id);
      if (idx >= 0) this.data.workouts[idx] = workout;
      else this.data.workouts.push(workout);
    }
    this.save();
    return workout;
  }

  deleteWorkout(id) {
    this.data.workouts = this.data.workouts.filter(w => w.id !== id);
    this.save();
  }

  // --- Risultati & Crono ---
  getResults() {
    return this.data.results || [];
  }

  saveResult(result) {
    if (!result.id) {
      result.id = 'res-' + Date.now();
    }
    this.data.results.unshift(result);
    this.save();
    return result;
  }

  deleteResult(id) {
    this.data.results = this.data.results.filter(r => r.id !== id);
    this.save();
  }

  // --- Schede Potenziamento Muscolare Atletica ---
  getStrengthWorkouts() {
    return this.data.strengthWorkouts || [];
  }

  saveStrengthWorkout(workout) {
    if (!workout.id) {
      workout.id = 'swo-' + Date.now();
      this.data.strengthWorkouts.unshift(workout);
    } else {
      const idx = this.data.strengthWorkouts.findIndex(w => w.id === workout.id);
      if (idx >= 0) this.data.strengthWorkouts[idx] = workout;
      else this.data.strengthWorkouts.push(workout);
    }
    this.save();
    return workout;
  }

  deleteStrengthWorkout(id) {
    this.data.strengthWorkouts = this.data.strengthWorkouts.filter(w => w.id !== id);
    this.save();
  }

  // --- Registro / Diario Carichi Potenziamento ---
  getStrengthLogs() {
    return this.data.strengthLogs || [];
  }

  saveStrengthLog(log) {
    if (!log.id) {
      log.id = 'slog-' + Date.now();
    }
    this.data.strengthLogs.unshift(log);
    this.save();
    return log;
  }

  deleteStrengthLog(id) {
    this.data.strengthLogs = this.data.strengthLogs.filter(l => l.id !== id);
    this.save();
  }

  // --- Sessioni Foglio Rapido Minimale ---
  getSheetSessions() {
    return this.data.sheetSessions || [];
  }

  saveSheetSession(session) {
    if (!session.id) {
      session.id = 'sheet-' + Date.now();
    }
    this.data.sheetSessions = this.data.sheetSessions || [];
    this.data.sheetSessions.unshift(session);
    this.save();
    return session;
  }

  deleteSheetSession(id) {
    this.data.sheetSessions = (this.data.sheetSessions || []).filter(s => s.id !== id);
    this.save();
  }

  clearSheetSessions() {
    this.data.sheetSessions = [];
    this.save();
  }

  // --- Tipi di Allenamento / Eventi Cronometro ---
  getChronoEvents() {
    return this.data.chronoEvents || [];
  }

  saveChronoEvent(eventObjOrName) {
    const nome = typeof eventObjOrName === 'string' ? eventObjOrName.trim() : eventObjOrName.nome.trim();
    if (!nome) return null;
    
    this.data.chronoEvents = this.data.chronoEvents || [];
    const existing = this.data.chronoEvents.find(e => e.nome.toLowerCase() === nome.toLowerCase());
    if (existing) return existing;

    const newEvent = {
      id: 'ev-' + Date.now(),
      nome: nome,
      categoria: typeof eventObjOrName === 'object' && eventObjOrName.categoria ? eventObjOrName.categoria : 'Personalizzato'
    };
    this.data.chronoEvents.push(newEvent);
    this.save();
    return newEvent;
  }

  deleteChronoEvent(idOrName) {
    this.data.chronoEvents = (this.data.chronoEvents || []).filter(e => e.id !== idOrName && e.nome !== idOrName);
    this.save();
  }

  // --- Impostazioni ---
  getSettings() {
    return this.data.settings || {};
  }

  saveSettings(settings) {
    this.data.settings = { ...this.data.settings, ...settings };
    this.save();
  }

  // Esportazione e importazione dati JSON (backup/condivisione tra iPhone e iPad)
  exportJSON() {
    return JSON.stringify(this.data, null, 2);
  }

  importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && parsed.athletes) {
        this.data = parsed;
        this.save();
        return true;
      }
    } catch (e) {
      console.error('Import fallito:', e);
    }
    return false;
  }

  resetToDefault() {
    this.data = this.getDefaultData();
    this.save();
  }
}

window.athleticsDB = new AthleticsDB();
