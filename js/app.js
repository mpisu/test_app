/**
 * TrackMaster - Controller Principale dell'Applicazione
 * Coordina Navigazione, Cronometro, Atleti, Schede, Audio e Service Worker PWA.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Registrazione Service Worker per supporto Offline
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('TrackMaster Service Worker attivo:', reg.scope))
      .catch(err => console.log('Registrazione SW fallita:', err));
  }

  // Rilevamento Standalone iOS / PWA
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
  if (isIos && !isStandalone) {
    const tip = document.getElementById('ios-pwa-tip');
    if (tip) tip.style.display = 'flex';
  }

  const btnCloseTip = document.getElementById('btn-close-pwa-tip');
  if (btnCloseTip) {
    btnCloseTip.addEventListener('click', () => {
      document.getElementById('ios-pwa-tip').style.display = 'none';
    });
  }

  // =========================================================================
  // GESTIONE NAVIGAZIONE TAB & PAGINA INIZIALE
  // =========================================================================
  const tabs = document.querySelectorAll('.nav-tab');
  const sections = document.querySelectorAll('.view-section');

  function navigateTo(targetId) {
    tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.target === targetId);
    });
    sections.forEach(sec => {
      sec.classList.toggle('active', sec.id === targetId);
    });
    if (targetId === 'view-home') {
      updateHomeStats();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      navigateTo(tab.dataset.target);
    });
  });

  // Tasti rapidi per tornare alla Home
  document.getElementById('brand-header-home')?.addEventListener('click', () => navigateTo('view-home'));
  document.getElementById('btn-header-home')?.addEventListener('click', () => navigateTo('view-home'));
  document.querySelectorAll('.btn-back-home').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.target || 'view-home'));
  });

  // I DUE TASTI PRINCIPALI DELLA PAGINA INIZIALE + FOGLIO RAPIDO
  const btnGoAthletics = document.getElementById('btn-go-athletics');
  if (btnGoAthletics) {
    btnGoAthletics.addEventListener('click', () => {
      navigateTo('view-stopwatch');
      showToast('Sessione Atletica (Pista & Cronometro) avviata!');
    });
  }

  const btnGoStrength = document.getElementById('btn-go-strength');
  if (btnGoStrength) {
    btnGoStrength.addEventListener('click', () => {
      navigateTo('view-strength');
      showToast('Sessione Potenziamento Muscolare avviata!');
    });
  }

  const btnGoSheet = document.getElementById('btn-go-sheet');
  if (btnGoSheet) {
    btnGoSheet.addEventListener('click', () => {
      navigateTo('view-sheet');
      showToast('Foglio Rapido aperto!');
    });
  }

  const btnHeaderSheet = document.getElementById('btn-header-sheet');
  if (btnHeaderSheet) {
    btnHeaderSheet.addEventListener('click', () => navigateTo('view-sheet'));
  }

  function updateHomeStats() {
    const athletes = window.athleticsDB.getAthletes();
    const results = window.athleticsDB.getResults();
    const strLogs = window.athleticsDB.getStrengthLogs();
    const sheetSessions = window.athleticsDB.getSheetSessions();

    const statAth = document.getElementById('home-stat-athletes');
    if (statAth) statAth.textContent = `${athletes.length} atleti`;

    const statSheet = document.getElementById('home-stat-sheet');
    if (statSheet) statSheet.textContent = `${sheetSessions.length} salvate`;

    const statChrono = document.getElementById('home-stat-chrono');
    if (statChrono) {
      if (results.length > 0) {
        statChrono.textContent = `${results[0].tempoStr} (${results[0].atletaNome})`;
      } else {
        statChrono.textContent = 'Nessuno';
      }
    }

    const statStr = document.getElementById('home-stat-strength');
    if (statStr) {
      if (strLogs.length > 0) {
        statStr.textContent = `${strLogs[0].esercizio} ${strLogs[0].caricoKg}kg (${strLogs[0].atletaNome})`;
      } else {
        statStr.textContent = 'Nessuno';
      }
    }
  }

  // =========================================================================
  // GESTIONE CRONOMETRO SINGOLO & MULTI-CORSIA
  // =========================================================================
  const displayMain = document.getElementById('main-stopwatch-display');
  const btnToggleMain = document.getElementById('btn-toggle-main');
  const btnToggleText = document.getElementById('btn-toggle-text');
  const btnReset = document.getElementById('btn-reset');
  const btnLap = document.getElementById('btn-lap');
  const btnOfficialStarter = document.getElementById('btn-official-starter');
  const starterStatus = document.getElementById('starter-status');
  const splitsBody = document.getElementById('splits-body');

  const btnModeSingle = document.getElementById('btn-mode-single');
  const btnModeMulti = document.getElementById('btn-mode-multi');
  const singleControls = document.getElementById('single-controls');
  const multiControls = document.getElementById('multi-controls');
  const splitsSection = document.getElementById('splits-section');
  const lanesContainer = document.getElementById('lanes-container');

  const chronoSelectAthlete = document.getElementById('chrono-select-athlete');
  const chronoSelectEvent = document.getElementById('chrono-select-event');
  const btnAddChronoEvent = document.getElementById('btn-add-chrono-event');
  const modalAddChronoEvent = document.getElementById('modal-add-chrono-event');
  const formAddChronoEvent = document.getElementById('form-add-chrono-event');
  const inputNewEventName = document.getElementById('input-new-event-name');
  const selectNewEventCategory = document.getElementById('select-new-event-category');

  let lastSelectedChronoEvent = '100m Piani';

  function populateChronoEvents(preferredSelection = null) {
    if (!chronoSelectEvent) return;
    const events = window.athleticsDB.getChronoEvents();
    const currentVal = preferredSelection || chronoSelectEvent.value || lastSelectedChronoEvent;

    let html = '';
    events.forEach(ev => {
      const isSel = ev.nome === currentVal;
      html += `<option value="${ev.nome}" ${isSel ? 'selected' : ''}>${ev.nome}</option>`;
    });

    html += `<option value="__ADD_NEW__">➕ Aggiungi Nuovo Tipo...</option>`;
    chronoSelectEvent.innerHTML = html;

    if (currentVal && currentVal !== '__ADD_NEW__') {
      chronoSelectEvent.value = currentVal;
      lastSelectedChronoEvent = currentVal;
    }
  }

  chronoSelectEvent?.addEventListener('change', (e) => {
    if (e.target.value === '__ADD_NEW__') {
      chronoSelectEvent.value = lastSelectedChronoEvent;
      openAddChronoEventModal();
    } else {
      lastSelectedChronoEvent = e.target.value;
    }
  });

  function openAddChronoEventModal() {
    if (formAddChronoEvent) formAddChronoEvent.reset();
    modalAddChronoEvent?.classList.add('open');
    setTimeout(() => inputNewEventName?.focus(), 150);
  }

  btnAddChronoEvent?.addEventListener('click', openAddChronoEventModal);

  formAddChronoEvent?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = inputNewEventName?.value.trim();
    if (!name) return;
    const cat = selectNewEventCategory?.value || 'Personalizzato';

    const saved = window.athleticsDB.saveChronoEvent({ nome: name, categoria: cat });
    modalAddChronoEvent?.classList.remove('open');
    populateChronoEvents(saved.nome);
    showToast(`Nuovo tipo di allenamento "${saved.nome}" aggiunto e selezionato!`);
  });

  const recoveryBox = document.getElementById('recovery-timer-box');
  const recoveryRemainingText = document.getElementById('recovery-remaining-text');
  const btnCancelRecovery = document.getElementById('btn-cancel-recovery');

  // Aggiornamento display cronometro
  window.athleticsStopwatch.onTick = (formatted, ms) => {
    displayMain.textContent = formatted;

    // Se in modalità multi, aggiorna i tempi delle corsie ancora attive
    if (window.athleticsStopwatch.multiActive) {
      window.athleticsStopwatch.lanes.forEach(l => {
        if (!l.finished) {
          const el = document.getElementById(`lane-time-${l.id}`);
          if (el) el.textContent = formatted;
        }
      });
    }
  };

  window.athleticsStopwatch.onStateChange = (state) => {
    if (state === 'start') {
      btnToggleMain.classList.remove('btn-start');
      btnToggleMain.classList.add('btn-stop');
      btnToggleText.textContent = 'FERMA';
    } else if (state === 'stop') {
      btnToggleMain.classList.remove('btn-stop');
      btnToggleMain.classList.add('btn-start');
      btnToggleText.textContent = 'AVVIA';

      // Avvio automatico timer di recupero se impostato
      if (currentRecoveryPreset > 0) {
        startRecoveryCountdown(currentRecoveryPreset);
      }
    } else if (state === 'reset') {
      btnToggleMain.classList.remove('btn-stop');
      btnToggleMain.classList.add('btn-start');
      btnToggleText.textContent = 'AVVIA';
      renderSplits([]);
      renderLanes();
    }
  };

  btnToggleMain.addEventListener('click', () => {
    window.athleticsStopwatch.toggle();
  });

  btnReset.addEventListener('click', () => {
    window.athleticsStopwatch.reset();
  });

  btnLap.addEventListener('click', () => {
    window.athleticsStopwatch.recordLap();
  });

  btnOfficialStarter.addEventListener('click', () => {
    window.athleticsStopwatch.triggerOfficialStart((statusText) => {
      starterStatus.textContent = statusText;
    });
  });

  // Modalità Singolo vs Multi
  btnModeSingle.addEventListener('click', () => {
    btnModeSingle.classList.add('active');
    btnModeMulti.classList.remove('active');
    window.athleticsStopwatch.multiActive = false;
    multiControls.style.display = 'none';
    splitsSection.style.display = 'block';
  });

  btnModeMulti.addEventListener('click', () => {
    btnModeMulti.classList.add('active');
    btnModeSingle.classList.remove('active');
    window.athleticsStopwatch.multiActive = true;
    multiControls.style.display = 'block';
    splitsSection.style.display = 'none';
    renderLanes();
  });

  // Render Corsie Multi-Atleta
  function renderLanes() {
    if (!lanesContainer) return;
    const athletes = window.athleticsDB.getAthletes();
    lanesContainer.innerHTML = '';

    window.athleticsStopwatch.lanes.forEach(lane => {
      const card = document.createElement('div');
      card.className = `lane-card ${lane.finished ? 'finished' : ''}`;
      card.id = `lane-card-${lane.id}`;

      let athleteOptions = `<option value="">-- Assegna Atleta --</option>`;
      athletes.forEach(a => {
        const selected = lane.athleteId === a.id ? 'selected' : '';
        athleteOptions += `<option value="${a.id}" ${selected}>${a.nome} ${a.cognome}</option>`;
      });

      card.innerHTML = `
        <div class="lane-header">
          <span class="lane-badge">Corsia ${lane.id}</span>
          <select class="lane-athlete-select" data-lane-id="${lane.id}">
            ${athleteOptions}
          </select>
        </div>
        <div class="lane-time" id="lane-time-${lane.id}">
          ${lane.formatted}
        </div>
        <button class="btn-lane-stop" data-lane-id="${lane.id}" ${lane.finished ? 'disabled' : ''}>
          ${lane.finished ? 'ARRIVATO ✓' : 'STOP CORSIA'}
        </button>
      `;
      lanesContainer.appendChild(card);
    });

    // Event listeners per selezione atleta corsia
    lanesContainer.querySelectorAll('.lane-athlete-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const lId = parseInt(e.target.dataset.laneId);
        const lane = window.athleticsStopwatch.lanes.find(l => l.id === lId);
        if (lane) {
          lane.athleteId = e.target.value;
          const a = athletes.find(x => x.id === e.target.value);
          lane.athleteName = a ? `${a.nome} ${a.cognome}` : `Corsia ${lId}`;
        }
      });
    });

    // Event listeners per Stop singola corsia
    lanesContainer.querySelectorAll('.btn-lane-stop').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const lId = parseInt(e.target.dataset.laneId);
        window.athleticsStopwatch.stopLane(lId);
        renderLanes();
      });
    });
  }

  // Intertempi (Split)
  window.athleticsStopwatch.onLapsChange = (laps) => {
    renderSplits(laps);
  };

  function renderSplits(laps) {
    if (!splitsBody) return;
    if (laps.length === 0) {
      splitsBody.innerHTML = `
        <tr>
          <td colspan="3" style="text-align: center; color: var(--text-muted); padding: 18px;">
            Nessun intertempo registrato. Premi 'INTERTEMPO' durante la corsa per registrare i passaggi.
          </td>
        </tr>`;
      return;
    }

    splitsBody.innerHTML = laps.map(lap => `
      <tr>
        <td style="font-weight: 700; color: var(--accent-cyan);">#${lap.index}</td>
        <td style="font-weight: 700; font-size: 1rem;">${lap.totalStr}</td>
        <td style="color: var(--accent-yellow);">+${lap.splitStr}</td>
      </tr>
    `).join('');
  }

  // Timer di Recupero
  let currentRecoveryPreset = 180; // default 3 min
  document.querySelectorAll('.btn-rec-preset').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.btn-rec-preset').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentRecoveryPreset = parseInt(e.target.dataset.seconds);
      document.getElementById('custom-recovery-label').textContent = `Impostato: ${window.athleticsStopwatch.formatSeconds(currentRecoveryPreset)}`;
      showToast(`Recupero impostato a ${window.athleticsStopwatch.formatSeconds(currentRecoveryPreset)}`);
    });
  });

  document.getElementById('btn-start-manual-rec').addEventListener('click', () => {
    startRecoveryCountdown(currentRecoveryPreset);
  });

  btnCancelRecovery.addEventListener('click', () => {
    window.athleticsStopwatch.stopRecovery();
    recoveryBox.style.display = 'none';
  });

  function startRecoveryCountdown(secs) {
    recoveryBox.style.display = 'inline-flex';
    window.athleticsStopwatch.startRecovery(
      secs,
      (text) => {
        recoveryRemainingText.textContent = text;
      },
      () => {
        recoveryBox.style.display = 'none';
        showToast('🔔 RECUPERO TERMINATO! Pronto per la prossima serie.');
      }
    );
  }

  // Salva Risultato Singolo
  document.getElementById('btn-save-single-result').addEventListener('click', () => {
    if (window.athleticsStopwatch.elapsedTime === 0) {
      showToast('Nessun tempo da salvare!');
      return;
    }
    const athleteId = chronoSelectAthlete.value;
    const athlete = window.athleticsDB.getAthlete(athleteId);
    const athleteName = athlete ? `${athlete.nome} ${athlete.cognome}` : 'Atleta non assegnato';
    const eventName = chronoSelectEvent.value;
    const formatted = window.athleticsStopwatch.formatTime(window.athleticsStopwatch.elapsedTime);

    const result = {
      data: new Date().toLocaleString('it-IT'),
      atletaId: athleteId || null,
      atletaNome: athleteName,
      evento: eventName,
      tempoMs: window.athleticsStopwatch.elapsedTime,
      tempoStr: formatted,
      splits: window.athleticsStopwatch.laps.map(l => `${l.totalStr} (Intertempo #${l.index})`),
      note: ''
    };

    window.athleticsDB.saveResult(result);
    showToast(`Tempo di ${formatted} salvato con successo!`);
    renderResults();
  });

  // Salva Risultati Multi-Corsia
  document.getElementById('btn-save-multi-results').addEventListener('click', () => {
    const activeLanes = window.athleticsStopwatch.lanes.filter(l => l.time > 0);
    if (activeLanes.length === 0) {
      showToast('Nessun tempo registrato nelle corsie!');
      return;
    }

    const eventName = chronoSelectEvent.value;
    const dateStr = new Date().toLocaleString('it-IT');

    activeLanes.forEach(l => {
      window.athleticsDB.saveResult({
        data: dateStr,
        atletaId: l.athleteId || null,
        atletaNome: l.athleteName,
        evento: `${eventName} (Corsia ${l.id})`,
        tempoMs: l.time,
        tempoStr: l.formatted,
        splits: [],
        note: 'Gara/Test Multi-corsia'
      });
    });

    showToast(`Salvati i tempi di ${activeLanes.length} corsie!`);
    renderResults();
  });

  // =========================================================================
  // GESTIONE ATLETI
  // =========================================================================
  const athletesContainer = document.getElementById('athletes-list-container');
  const athleteSearch = document.getElementById('athlete-search');
  const modalAthlete = document.getElementById('modal-athlete');
  const formAthlete = document.getElementById('form-athlete');

  function renderAthletes(filterText = '') {
    if (!athletesContainer) return;
    const all = window.athleticsDB.getAthletes();
    const query = filterText.toLowerCase().trim();

    const filtered = all.filter(a => {
      const full = `${a.nome} ${a.cognome} ${a.specialita} ${a.categoria} ${a.gruppo}`.toLowerCase();
      return full.includes(query);
    });

    // Popola anche il selettore nel cronometro
    populateChronoAthletes(all);

    if (filtered.length === 0) {
      athletesContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
          Nessun atleta trovato. Tocca <strong>"+ Nuovo Atleta"</strong> per aggiungerne uno.
        </div>`;
      return;
    }

    athletesContainer.innerHTML = filtered.map(a => `
      <div class="athlete-card">
        <div class="athlete-top">
          <div>
            <h4 class="athlete-name">${a.nome} ${a.cognome}</h4>
            <span style="font-size: 0.8rem; color: var(--text-muted);">${a.anno} • ${a.gruppo || 'Generale'}</span>
          </div>
          <span class="athlete-category">${a.categoria}</span>
        </div>

        <div class="athlete-stats">
          <div class="stat-item">
            <span class="stat-label">Specialità</span>
            <span style="font-weight: 600; color: #fff; font-size: 0.95rem;">${a.specialita || '-'}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Personal Best (PB)</span>
            <span class="stat-value">${a.pb || '-'}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Season Best (SB)</span>
            <span class="stat-value" style="color: var(--accent-cyan);">${a.sb || '-'}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Note</span>
            <span style="font-size: 0.78rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${a.note || 'Nessuna'}
            </span>
          </div>
        </div>

        <div class="athlete-actions">
          <button class="btn-icon-subtle btn-chrono-ath" data-id="${a.id}" data-name="${a.nome} ${a.cognome}" style="color: var(--accent-cyan); border-color: var(--accent-cyan);">
            ⏱️ Cronometra
          </button>
          <button class="btn-icon-subtle btn-edit-ath" data-id="${a.id}">
            ✏️ Modifica
          </button>
          <button class="btn-icon-subtle btn-del-ath" data-id="${a.id}" style="color: var(--accent-red);">
            🗑️
          </button>
        </div>
      </div>
    `).join('');

    // Event listeners su card
    athletesContainer.querySelectorAll('.btn-chrono-ath').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        chronoSelectAthlete.value = id;
        navigateTo('view-stopwatch');
        showToast(`Selezionato: ${e.currentTarget.dataset.name}`);
      });
    });

    athletesContainer.querySelectorAll('.btn-edit-ath').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        openAthleteModal(id);
      });
    });

    athletesContainer.querySelectorAll('.btn-del-ath').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        if (confirm('Sei sicuro di voler eliminare questo atleta?')) {
          window.athleticsDB.deleteAthlete(id);
          renderAthletes(athleteSearch.value);
          showToast('Atleta rimosso.');
        }
      });
    });
  }

  function populateChronoAthletes(athletes) {
    if (chronoSelectAthlete) {
      const currentVal = chronoSelectAthlete.value;
      chronoSelectAthlete.innerHTML = `<option value="">-- Seleziona Atleta (Opzionale) --</option>` +
        athletes.map(a => `<option value="${a.id}">${a.nome} ${a.cognome} (${a.specialita})</option>`).join('');
      chronoSelectAthlete.value = currentVal;
    }

    const strAthSelect = document.getElementById('strength-select-athlete');
    if (strAthSelect) {
      const currVal = strAthSelect.value;
      strAthSelect.innerHTML = `<option value="">-- Seleziona Atleta per Potenziamento --</option>` +
        athletes.map(a => `<option value="${a.id}">${a.nome} ${a.cognome} (${a.gruppo || a.specialita})</option>`).join('');
      strAthSelect.value = currVal;
    }

    const logAthSelect = document.getElementById('log-form-athlete');
    if (logAthSelect) {
      const currVal = logAthSelect.value;
      logAthSelect.innerHTML = athletes.map(a => `<option value="${a.id}">${a.nome} ${a.cognome} (${a.specialita || a.gruppo})</option>`).join('');
      if (currVal) logAthSelect.value = currVal;
    }

    // Popola datalist del Foglio Rapido
    const sheetDatalist = document.getElementById('athletes-datalist');
    if (sheetDatalist) {
      sheetDatalist.innerHTML = athletes.map(a => `<option value="${a.nome} ${a.cognome}">${a.specialita || a.gruppo}</option>`).join('');
    }

    // Popola tags veloci atleti nel Foglio Rapido
    const sheetQuickAth = document.getElementById('sheet-quick-athletes');
    if (sheetQuickAth) {
      sheetQuickAth.innerHTML = athletes.map(a => `
        <button type="button" class="sheet-quick-tag" data-name="${a.nome} ${a.cognome}">
          + ${a.nome}
        </button>
      `).join('');

      sheetQuickAth.querySelectorAll('.sheet-quick-tag').forEach(tag => {
        tag.addEventListener('click', (e) => {
          const personInput = document.getElementById('sheet-input-person');
          if (personInput) {
            personInput.value = e.currentTarget.dataset.name;
            personInput.focus();
          }
        });
      });
    }

    renderMultiAthletesChips();
    updateHomeStats();
  }

  if (athleteSearch) {
    athleteSearch.addEventListener('input', (e) => renderAthletes(e.target.value));
  }

  document.getElementById('btn-open-new-athlete').addEventListener('click', () => {
    openAthleteModal(null);
  });

  function openAthleteModal(athleteId = null) {
    formAthlete.reset();
    document.getElementById('ath-form-id').value = '';
    const modalTitle = document.getElementById('modal-athlete-title');

    if (athleteId) {
      const a = window.athleticsDB.getAthlete(athleteId);
      if (a) {
        modalTitle.textContent = `Modifica ${a.nome} ${a.cognome}`;
        document.getElementById('ath-form-id').value = a.id;
        document.getElementById('ath-form-nome').value = a.nome;
        document.getElementById('ath-form-cognome').value = a.cognome;
        document.getElementById('ath-form-anno').value = a.anno || 2005;
        document.getElementById('ath-form-categoria').value = a.categoria || 'Promesse';
        document.getElementById('ath-form-specialita').value = a.specialita || '';
        document.getElementById('ath-form-gruppo').value = a.gruppo || 'Velocità';
        document.getElementById('ath-form-pb').value = a.pb || '';
        document.getElementById('ath-form-sb').value = a.sb || '';
        document.getElementById('ath-form-note').value = a.note || '';
      }
    } else {
      modalTitle.textContent = 'Nuovo Atleta';
    }

    modalAthlete.classList.add('open');
  }

  formAthlete.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('ath-form-id').value;
    const athleteData = {
      id: id || null,
      nome: document.getElementById('ath-form-nome').value.trim(),
      cognome: document.getElementById('ath-form-cognome').value.trim(),
      anno: parseInt(document.getElementById('ath-form-anno').value) || 2005,
      categoria: document.getElementById('ath-form-categoria').value,
      specialita: document.getElementById('ath-form-specialita').value.trim(),
      gruppo: document.getElementById('ath-form-gruppo').value,
      pb: document.getElementById('ath-form-pb').value.trim(),
      sb: document.getElementById('ath-form-sb').value.trim(),
      note: document.getElementById('ath-form-note').value.trim()
    };

    window.athleticsDB.saveAthlete(athleteData);
    modalAthlete.classList.remove('open');
    renderAthletes(athleteSearch.value);
    showToast(`Atleta ${athleteData.nome} salvato!`);
  });

  // =========================================================================
  // GESTIONE SCHEDE ALLENAMENTO
  // =========================================================================
  const workoutsContainer = document.getElementById('workouts-list-container');
  const modalWorkout = document.getElementById('modal-workout');
  const formWorkout = document.getElementById('form-workout');

  function renderWorkouts() {
    if (!workoutsContainer) return;
    const workouts = window.athleticsDB.getWorkouts();

    if (workouts.length === 0) {
      workoutsContainer.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-muted);">
          Nessuna scheda presente. Tocca <strong>"+ Nuova Scheda"</strong> per pianificare una sessione.
        </div>`;
      return;
    }

    workoutsContainer.innerHTML = workouts.map(w => `
      <div class="workout-card">
        <div class="workout-header">
          <div>
            <h4 class="workout-title">${w.titolo}</h4>
            <span class="workout-date">📅 ${w.data} • Gruppo: <strong>${w.gruppo}</strong></span>
          </div>
          <button class="btn-icon-subtle btn-del-workout" data-id="${w.id}" style="color: var(--accent-red);">
            🗑️
          </button>
        </div>
        <div class="workout-structure">
          🏃‍♂️ ${w.struttura}
        </div>
        ${w.note ? `<div style="font-size: 0.85rem; color: var(--text-secondary);">💡 Note: ${w.note}</div>` : ''}
      </div>
    `).join('');

    workoutsContainer.querySelectorAll('.btn-del-workout').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        if (confirm('Vuoi cancellare questa scheda?')) {
          window.athleticsDB.deleteWorkout(id);
          renderWorkouts();
          showToast('Scheda eliminata.');
        }
      });
    });
  }

  document.getElementById('btn-open-new-workout').addEventListener('click', () => {
    formWorkout.reset();
    document.getElementById('wo-form-data').value = new Date().toISOString().split('T')[0];
    modalWorkout.classList.add('open');
  });

  formWorkout.addEventListener('submit', (e) => {
    e.preventDefault();
    const workoutData = {
      titolo: document.getElementById('wo-form-titolo').value.trim(),
      data: document.getElementById('wo-form-data').value,
      gruppo: document.getElementById('wo-form-gruppo').value,
      struttura: document.getElementById('wo-form-struttura').value.trim(),
      note: document.getElementById('wo-form-note').value.trim()
    };

    window.athleticsDB.saveWorkout(workoutData);
    modalWorkout.classList.remove('open');
    renderWorkouts();
    showToast('Scheda salvata!');
  });

  // =========================================================================
  // GESTIONE STORICO RISULTATI
  // =========================================================================
  const resultsContainer = document.getElementById('results-list-container');

  function renderResults() {
    if (!resultsContainer) return;
    const results = window.athleticsDB.getResults();

    if (results.length === 0) {
      resultsContainer.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-muted);">
          Nessun risultato salvato. Cronometra un test e premi <strong>"Salva Risultato"</strong>.
        </div>`;
      return;
    }

    resultsContainer.innerHTML = results.map(r => `
      <div class="card" style="margin-bottom: 12px; padding: 14px 18px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.15rem; font-weight: 700; color: #fff;">${r.atletaNome}</span>
              <span style="font-size: 0.75rem; background: var(--bg-input); padding: 2px 8px; border-radius: 4px; color: var(--accent-cyan);">${r.evento}</span>
            </div>
            <span style="font-size: 0.78rem; color: var(--text-muted);">${r.data}</span>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 1.4rem; font-weight: 800; color: var(--accent-yellow); font-family: 'SF Mono', monospace;">
              ${r.tempoStr}
            </div>
            <button class="btn-icon-subtle btn-del-res" data-id="${r.id}" style="padding: 2px 6px; font-size: 0.75rem; color: var(--accent-red); margin-top: 4px;">
              Elimina
            </button>
          </div>
        </div>

        ${r.splits && r.splits.length > 0 ? `
          <div style="margin-top: 8px; font-size: 0.8rem; color: var(--text-secondary); background: var(--bg-input); padding: 6px 10px; border-radius: 6px;">
            <strong>Intertempi:</strong> ${r.splits.join(' | ')}
          </div>
        ` : ''}
      </div>
    `).join('');

    resultsContainer.querySelectorAll('.btn-del-res').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        window.athleticsDB.deleteResult(id);
        renderResults();
        showToast('Risultato rimosso.');
      });
    });
  }

  // Esportazione CSV
  document.getElementById('btn-export-csv').addEventListener('click', () => {
    const results = window.athleticsDB.getResults();
    if (results.length === 0) {
      showToast('Nessun dato da esportare!');
      return;
    }

    let csv = 'Data,Atleta,Evento,Tempo,Intertempi,Note\n';
    results.forEach(r => {
      const splitsStr = (r.splits || []).join('; ');
      csv += `"${r.data}","${r.atletaNome}","${r.evento}","${r.tempoStr}","${splitsStr}","${r.note || ''}"\n`;
    });

    downloadFile(csv, `trackmaster_risultati_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
    showToast('File CSV esportato!');
  });

  // =========================================================================
  // GESTIONE IMPOSTAZIONI & BACKUP
  // =========================================================================
  const settingSound = document.getElementById('setting-sound');
  const btnAudioToggle = document.getElementById('btn-audio-toggle');

  if (settingSound) {
    settingSound.addEventListener('change', (e) => {
      window.athleticsAudio.muted = !e.target.checked;
      btnAudioToggle.textContent = e.target.checked ? '🔊' : '🔇';
    });
  }

  btnAudioToggle.addEventListener('click', () => {
    window.athleticsAudio.muted = !window.athleticsAudio.muted;
    btnAudioToggle.textContent = window.athleticsAudio.muted ? '🔇' : '🔊';
    if (settingSound) settingSound.checked = !window.athleticsAudio.muted;
    showToast(window.athleticsAudio.muted ? 'Audio disattivato' : 'Audio attivato');
  });

  // Esporta Backup JSON
  document.getElementById('btn-export-json').addEventListener('click', () => {
    const json = window.athleticsDB.exportJSON();
    downloadFile(json, `trackmaster_backup_${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
    showToast('Backup JSON esportato con successo!');
  });

  // Ripristina Backup JSON
  const fileImport = document.getElementById('file-import-json');
  fileImport.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const ok = window.athleticsDB.importJSON(event.target.result);
      if (ok) {
        renderAthletes();
        renderWorkouts();
        renderResults();
        populateChronoEvents();
        showToast('Backup ripristinato con successo!');
      } else {
        alert('File JSON non valido o corrotto.');
      }
    };
    reader.readAsText(file);
  });

  // Reset database default
  document.getElementById('btn-reset-db').addEventListener('click', () => {
    if (confirm('Vuoi ripristinare il database allo stato iniziale FIDAL? I dati correnti verranno sovrascritti.')) {
      window.athleticsDB.resetToDefault();
      renderAthletes();
      renderWorkouts();
      renderResults();
      populateChronoEvents();
      showToast('Database ripristinato ai valori iniziali.');
    }
  });

  // Helper download file
  function downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Chiusura di tutti i modali
  document.querySelectorAll('.btn-close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('open');
    });
  });

  document.getElementById('btn-pwa-guide').addEventListener('click', () => {
    // Rileva automaticamente se siamo su Android o iOS
    const isAndroid = /Android/i.test(navigator.userAgent);
    if (isAndroid) {
      showGuideTab('android');
    } else {
      showGuideTab('ios');
    }
    document.getElementById('modal-install-guide').classList.add('open');
  });

  // Gestione Tab Guida Installazione iOS vs Android
  const tabGuideIos = document.getElementById('tab-guide-ios');
  const tabGuideAndroid = document.getElementById('tab-guide-android');
  const guideContentIos = document.getElementById('guide-content-ios');
  const guideContentAndroid = document.getElementById('guide-content-android');

  function showGuideTab(os) {
    if (os === 'android') {
      tabGuideAndroid.style.background = 'var(--accent-blue)';
      tabGuideAndroid.style.color = '#fff';
      tabGuideIos.style.background = 'none';
      tabGuideIos.style.color = 'var(--text-secondary)';
      guideContentAndroid.style.display = 'block';
      guideContentIos.style.display = 'none';
    } else {
      tabGuideIos.style.background = 'var(--accent-blue)';
      tabGuideIos.style.color = '#fff';
      tabGuideAndroid.style.background = 'none';
      tabGuideAndroid.style.color = 'var(--text-secondary)';
      guideContentIos.style.display = 'block';
      guideContentAndroid.style.display = 'none';
    }
  }

  if (tabGuideIos) tabGuideIos.addEventListener('click', () => showGuideTab('ios'));
  if (tabGuideAndroid) tabGuideAndroid.addEventListener('click', () => showGuideTab('android'));

  // Gestione Evento Nativo Android beforeinstallprompt
  let deferredPrompt = null;
  const androidBannerBox = document.getElementById('android-install-banner-box');
  const btnTriggerAndroid = document.getElementById('btn-trigger-android-install');

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (androidBannerBox) androidBannerBox.style.display = 'block';
  });

  if (btnTriggerAndroid) {
    btnTriggerAndroid.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          showToast('Installazione avviata su Android!');
        }
        deferredPrompt = null;
        if (androidBannerBox) androidBannerBox.style.display = 'none';
      }
    });
  }

  // Toast Helper
  const toast = document.getElementById('app-toast');
  let toastTimer = null;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  // =========================================================================
  // GESTIONE SESSIONE POTENZIAMENTO MUSCOLARE (PER L'ATLETICA)
  // =========================================================================

  // 1. Sotto-navigazione pannelli Potenziamento
  const strSubBtns = document.querySelectorAll('.strength-nav-btn');
  const strSubPanels = document.querySelectorAll('.strength-subpanel');

  function navigateStrengthSub(panelId) {
    strSubBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.sub === panelId));
    strSubPanels.forEach(panel => {
      const isActive = panel.id === panelId;
      panel.classList.toggle('active', isActive);
      panel.style.display = isActive ? 'block' : 'none';
    });
  }

  strSubBtns.forEach(btn => {
    btn.addEventListener('click', () => navigateStrengthSub(btn.dataset.sub));
  });

  // 2. Selettore modalità Timer Potenziamento (Recupero Serie | EMOM | Tabata)
  const btnStrModeRest = document.getElementById('btn-str-mode-rest');
  const btnStrModeEmom = document.getElementById('btn-str-mode-emom');
  const btnStrModeTabata = document.getElementById('btn-str-mode-tabata');

  const strModeRestBox = document.getElementById('str-mode-rest-box');
  const strModeEmomBox = document.getElementById('str-mode-emom-box');
  const strModeTabataBox = document.getElementById('str-mode-tabata-box');

  function setStrengthTimerMode(mode) {
    btnStrModeRest?.classList.toggle('active', mode === 'rest');
    btnStrModeEmom?.classList.toggle('active', mode === 'emom');
    btnStrModeTabata?.classList.toggle('active', mode === 'tabata');

    if (strModeRestBox) strModeRestBox.style.display = mode === 'rest' ? 'block' : 'none';
    if (strModeEmomBox) strModeEmomBox.style.display = mode === 'emom' ? 'block' : 'none';
    if (strModeTabataBox) strModeTabataBox.style.display = mode === 'tabata' ? 'block' : 'none';
  }

  btnStrModeRest?.addEventListener('click', () => setStrengthTimerMode('rest'));
  btnStrModeEmom?.addEventListener('click', () => setStrengthTimerMode('emom'));
  btnStrModeTabata?.addEventListener('click', () => setStrengthTimerMode('tabata'));

  // 3. Timer Recupero Serie Pesi
  let strRestPresetSecs = 120;
  let strRestRemainingSecs = 120;
  let strRestInterval = null;
  let strSeriesCount = 0;

  const strRestDisplay = document.getElementById('str-rest-display');
  const strRestStatusBadge = document.getElementById('str-rest-status-badge');
  const btnStrRestStart = document.getElementById('btn-str-rest-start');
  const btnStrRestReset = document.getElementById('btn-str-rest-reset');
  const strSeriesCountDisplay = document.getElementById('str-series-count');
  const btnStrSeriesMinus = document.getElementById('btn-str-series-minus');
  const btnStrSeriesPlus = document.getElementById('btn-str-series-plus');

  function formatTimeMMSS(secs) {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function updateStrRestDisplay() {
    if (strRestDisplay) {
      strRestDisplay.textContent = formatTimeMMSS(strRestRemainingSecs);
    }
  }

  document.querySelectorAll('.btn-str-rec-preset').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.btn-str-rec-preset').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      strRestPresetSecs = parseInt(e.target.dataset.secs);
      if (!strRestInterval) {
        strRestRemainingSecs = strRestPresetSecs;
        updateStrRestDisplay();
      }
      showToast(`Recupero impostato a ${formatTimeMMSS(strRestPresetSecs)}`);
    });
  });

  btnStrSeriesMinus?.addEventListener('click', () => {
    if (strSeriesCount > 0) {
      strSeriesCount--;
      if (strSeriesCountDisplay) strSeriesCountDisplay.textContent = strSeriesCount;
    }
  });

  btnStrSeriesPlus?.addEventListener('click', () => {
    strSeriesCount++;
    if (strSeriesCountDisplay) strSeriesCountDisplay.textContent = strSeriesCount;
  });

  function stopStrRestTimer() {
    if (strRestInterval) {
      clearInterval(strRestInterval);
      strRestInterval = null;
    }
    if (btnStrRestStart) {
      btnStrRestStart.textContent = '▶ AVVIA RECUPERO';
      btnStrRestStart.style.background = 'linear-gradient(135deg, #f97316, #ea580c)';
    }
  }

  btnStrRestStart?.addEventListener('click', () => {
    if (strRestInterval) {
      stopStrRestTimer();
      if (strRestStatusBadge) {
        strRestStatusBadge.textContent = 'RECUPERO IN PAUSA';
        strRestStatusBadge.style.color = 'var(--accent-yellow)';
      }
    } else {
      if (strRestRemainingSecs <= 0) {
        strRestRemainingSecs = strRestPresetSecs;
      }
      if (btnStrRestStart) {
        btnStrRestStart.textContent = '⏹ FERMA RECUPERO';
        btnStrRestStart.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
      }
      if (strRestStatusBadge) {
        strRestStatusBadge.textContent = 'RECUPERO IN CORSO...';
        strRestStatusBadge.style.color = 'var(--accent-orange)';
      }

      strRestInterval = setInterval(() => {
        strRestRemainingSecs--;
        updateStrRestDisplay();

        if (strRestRemainingSecs <= 3 && strRestRemainingSecs > 0) {
          window.athleticsAudio.playCountdownTick();
        }

        if (strRestRemainingSecs <= 0) {
          stopStrRestTimer();
          window.athleticsAudio.playRecoveryEnd();
          strSeriesCount++;
          if (strSeriesCountDisplay) strSeriesCountDisplay.textContent = strSeriesCount;
          if (strRestStatusBadge) {
            strRestStatusBadge.textContent = 'PRONTO PER LA SERIE!';
            strRestStatusBadge.style.color = 'var(--accent-green)';
          }
          showToast(`🔔 RECUPERO TERMINATO! Serie #${strSeriesCount} completata.`);
          strRestRemainingSecs = strRestPresetSecs;
          updateStrRestDisplay();
        }
      }, 1000);
    }
  });

  btnStrRestReset?.addEventListener('click', () => {
    stopStrRestTimer();
    strRestRemainingSecs = strRestPresetSecs;
    updateStrRestDisplay();
    if (strRestStatusBadge) {
      strRestStatusBadge.textContent = 'PRONTO PER LA SERIE';
      strRestStatusBadge.style.color = 'var(--accent-orange)';
    }
  });

  // 4. Timer EMOM (Every Minute On the Minute)
  const strEmomDisplay = document.getElementById('str-emom-display');
  const strEmomRoundBadge = document.getElementById('str-emom-round-badge');
  const strEmomMinutesSelect = document.getElementById('str-emom-minutes-select');
  const btnStrEmomStart = document.getElementById('btn-str-emom-start');
  const btnStrEmomReset = document.getElementById('btn-str-emom-reset');

  let strEmomInterval = null;
  let strEmomTotalMins = 10;
  let strEmomCurrentRound = 1;
  let strEmomSecs = 60;

  function stopEmomTimer() {
    if (strEmomInterval) {
      clearInterval(strEmomInterval);
      strEmomInterval = null;
    }
    if (btnStrEmomStart) {
      btnStrEmomStart.textContent = '▶ AVVIA EMOM';
      btnStrEmomStart.style.background = 'linear-gradient(135deg, #0ea5e9, #0284c7)';
    }
  }

  btnStrEmomStart?.addEventListener('click', () => {
    if (strEmomInterval) {
      stopEmomTimer();
      showToast('EMOM in pausa');
    } else {
      strEmomTotalMins = parseInt(strEmomMinutesSelect?.value || '10');
      if (btnStrEmomStart) {
        btnStrEmomStart.textContent = '⏹ FERMA EMOM';
        btnStrEmomStart.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
      }
      window.athleticsAudio.playWorkStart();
      showToast(`⚡ EMOM Avviato: Round 1 di ${strEmomTotalMins}!`);

      strEmomInterval = setInterval(() => {
        strEmomSecs--;
        if (strEmomDisplay) strEmomDisplay.textContent = formatTimeMMSS(strEmomSecs);

        if (strEmomSecs <= 3 && strEmomSecs > 0) {
          window.athleticsAudio.playCountdownTick();
        }

        if (strEmomSecs <= 0) {
          if (strEmomCurrentRound < strEmomTotalMins) {
            strEmomCurrentRound++;
            strEmomSecs = 60;
            if (strEmomRoundBadge) {
              strEmomRoundBadge.textContent = `ROUND ${strEmomCurrentRound} DI ${strEmomTotalMins}`;
            }
            window.athleticsAudio.playWorkStart();
            showToast(`⚡ EMOM: Round ${strEmomCurrentRound} di ${strEmomTotalMins}!`);
          } else {
            stopEmomTimer();
            window.athleticsAudio.playSessionDone();
            if (strEmomRoundBadge) strEmomRoundBadge.textContent = 'EMOM COMPLETATO! 🏆';
            showToast('🏆 SESSIONE EMOM COMPLETATA!');
          }
        }
      }, 1000);
    }
  });

  btnStrEmomReset?.addEventListener('click', () => {
    stopEmomTimer();
    strEmomCurrentRound = 1;
    strEmomSecs = 60;
    strEmomTotalMins = parseInt(strEmomMinutesSelect?.value || '10');
    if (strEmomDisplay) strEmomDisplay.textContent = '01:00';
    if (strEmomRoundBadge) strEmomRoundBadge.textContent = `ROUND 1 DI ${strEmomTotalMins}`;
  });

  // 5. Timer TABATA / Interval Training
  const strTabataDisplay = document.getElementById('str-tabata-display');
  const strTabataPhaseBadge = document.getElementById('str-tabata-phase-badge');
  const strTabataRoundBadge = document.getElementById('str-tabata-round-badge');
  const strTabataWorkInput = document.getElementById('str-tabata-work-secs');
  const strTabataRestInput = document.getElementById('str-tabata-rest-secs');
  const strTabataRoundsInput = document.getElementById('str-tabata-rounds-total');
  const btnStrTabataStart = document.getElementById('btn-str-tabata-start');
  const btnStrTabataReset = document.getElementById('btn-str-tabata-reset');

  let strTabataInterval = null;
  let strTabataPhase = 'work'; // 'work' or 'rest'
  let strTabataCurrentRound = 1;
  let strTabataSecsRemaining = 20;

  function stopTabataTimer() {
    if (strTabataInterval) {
      clearInterval(strTabataInterval);
      strTabataInterval = null;
    }
    if (btnStrTabataStart) {
      btnStrTabataStart.textContent = '▶ AVVIA TABATA';
      btnStrTabataStart.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    }
  }

  btnStrTabataStart?.addEventListener('click', () => {
    if (strTabataInterval) {
      stopTabataTimer();
      showToast('Tabata in pausa');
    } else {
      const workSecs = parseInt(strTabataWorkInput?.value || '20');
      const restSecs = parseInt(strTabataRestInput?.value || '10');
      const totalRounds = parseInt(strTabataRoundsInput?.value || '8');

      if (btnStrTabataStart) {
        btnStrTabataStart.textContent = '⏹ FERMA TABATA';
        btnStrTabataStart.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
      }

      window.athleticsAudio.playWorkStart();
      showToast(`🔥 TABATA: Round ${strTabataCurrentRound} di ${totalRounds}!`);

      strTabataInterval = setInterval(() => {
        strTabataSecsRemaining--;
        if (strTabataDisplay) strTabataDisplay.textContent = strTabataSecsRemaining;

        if (strTabataSecsRemaining <= 3 && strTabataSecsRemaining > 0) {
          window.athleticsAudio.playCountdownTick();
        }

        if (strTabataSecsRemaining <= 0) {
          if (strTabataPhase === 'work') {
            // Passa a Riposo
            strTabataPhase = 'rest';
            strTabataSecsRemaining = restSecs;
            if (strTabataDisplay) {
              strTabataDisplay.textContent = strTabataSecsRemaining;
              strTabataDisplay.style.color = 'var(--accent-orange)';
            }
            if (strTabataPhaseBadge) {
              strTabataPhaseBadge.textContent = 'RIPOSO (REST)';
              strTabataPhaseBadge.style.color = 'var(--accent-orange)';
              strTabataPhaseBadge.style.borderColor = 'var(--accent-orange)';
              strTabataPhaseBadge.style.background = 'rgba(249, 115, 22, 0.2)';
            }
            window.athleticsAudio.playRestStart();
          } else {
            // Ha finito il riposo: controlla se ci sono altri round
            if (strTabataCurrentRound < totalRounds) {
              strTabataCurrentRound++;
              strTabataPhase = 'work';
              strTabataSecsRemaining = workSecs;
              if (strTabataDisplay) {
                strTabataDisplay.textContent = strTabataSecsRemaining;
                strTabataDisplay.style.color = 'var(--accent-green)';
              }
              if (strTabataPhaseBadge) {
                strTabataPhaseBadge.textContent = 'LAVORO (PUSH)';
                strTabataPhaseBadge.style.color = 'var(--accent-green)';
                strTabataPhaseBadge.style.borderColor = 'var(--accent-green)';
                strTabataPhaseBadge.style.background = 'rgba(16, 185, 129, 0.2)';
              }
              if (strTabataRoundBadge) {
                strTabataRoundBadge.textContent = `Round ${strTabataCurrentRound} / ${totalRounds}`;
              }
              window.athleticsAudio.playWorkStart();
            } else {
              stopTabataTimer();
              window.athleticsAudio.playSessionDone();
              if (strTabataPhaseBadge) strTabataPhaseBadge.textContent = 'COMPLETATO! 🏆';
              showToast('🏆 TABATA COMPLETATO! Ottima intensità.');
            }
          }
        }
      }, 1000);
    }
  });

  btnStrTabataReset?.addEventListener('click', () => {
    stopTabataTimer();
    strTabataPhase = 'work';
    strTabataCurrentRound = 1;
    const workSecs = parseInt(strTabataWorkInput?.value || '20');
    strTabataSecsRemaining = workSecs;
    const totalRounds = parseInt(strTabataRoundsInput?.value || '8');

    if (strTabataDisplay) {
      strTabataDisplay.textContent = workSecs;
      strTabataDisplay.style.color = 'var(--accent-green)';
    }
    if (strTabataPhaseBadge) {
      strTabataPhaseBadge.textContent = 'LAVORO (PUSH)';
      strTabataPhaseBadge.style.color = 'var(--accent-green)';
      strTabataPhaseBadge.style.borderColor = 'var(--accent-green)';
      strTabataPhaseBadge.style.background = 'rgba(16, 185, 129, 0.2)';
    }
    if (strTabataRoundBadge) {
      strTabataRoundBadge.textContent = `Round 1 / ${totalRounds}`;
    }
  });

  // 6. Calcolatore Massimale 1RM & Percentuali
  const calcWeightInput = document.getElementById('calc-weight-input');
  const calcRepsInput = document.getElementById('calc-reps-input');
  const calcExerciseSelect = document.getElementById('calc-exercise-select');
  const calc1rmDisplay = document.getElementById('calc-1rm-display');
  const calcPercentagesBody = document.getElementById('calc-percentages-body');
  const btnSave1rmToLog = document.getElementById('btn-save-1rm-to-log');

  let calculatedCurrent1RM = 93.3;

  function calculate1RM() {
    const weight = parseFloat(calcWeightInput?.value) || 0;
    const reps = parseInt(calcRepsInput?.value) || 1;

    if (weight <= 0) return;

    // Formula di Epley: 1RM = weight * (1 + reps / 30)
    calculatedCurrent1RM = reps === 1 ? weight : Math.round((weight * (1 + reps / 30)) * 10) / 10;

    if (calc1rmDisplay) {
      calc1rmDisplay.textContent = `${calculatedCurrent1RM} Kg`;
    }

    render1RMPercentages(calculatedCurrent1RM);
  }

  function render1RMPercentages(oneRm) {
    if (!calcPercentagesBody) return;

    const brackets = [
      { pct: 95, desc: 'Forza Massimale Pura (1-2 rip.)' },
      { pct: 90, desc: 'Forza Submassimale (2-3 rip.)' },
      { pct: 85, desc: 'Forza Esplosiva Pesante (4-5 rip.)' },
      { pct: 80, desc: 'Forza Veloce / Trasferimento Sprint (5-6 rip.)' },
      { pct: 75, desc: 'Potenza Dinamica / Balzi con carico' },
      { pct: 70, desc: 'Velocità Esecutiva / Tecnica' },
      { pct: 60, desc: 'Pliometria Guidata & Riscaldamento Specifico' }
    ];

    calcPercentagesBody.innerHTML = brackets.map(b => {
      const kg = Math.round((oneRm * (b.pct / 100)) * 10) / 10;
      return `
        <tr>
          <td style="font-weight: 700; color: var(--accent-orange);">${b.pct}%</td>
          <td style="font-weight: 800; font-size: 1.05rem; font-family: 'SF Mono', monospace;">${kg} Kg</td>
          <td style="color: var(--text-secondary); font-size: 0.85rem;">${b.desc}</td>
        </tr>
      `;
    }).join('');
  }

  calcWeightInput?.addEventListener('input', calculate1RM);
  calcRepsInput?.addEventListener('input', calculate1RM);
  calcExerciseSelect?.addEventListener('change', calculate1RM);

  btnSave1rmToLog?.addEventListener('click', () => {
    const exercise = calcExerciseSelect?.value || 'Esercizio Pesi';
    const logExInput = document.getElementById('log-form-exercise');
    const logWeightInput = document.getElementById('log-form-weight');
    const logSetsRepsInput = document.getElementById('log-form-sets-reps');

    if (logExInput) logExInput.value = exercise;
    if (logWeightInput) logWeightInput.value = calculatedCurrent1RM;
    if (logSetsRepsInput) logSetsRepsInput.value = '1RM Massimale';

    navigateStrengthSub('panel-str-logs');
    showToast(`Dati di ${exercise} (1RM: ${calculatedCurrent1RM}kg) pronti nel diario!`);
  });

  // 7. Schede Tecniche di Potenziamento FIDAL
  const strengthWorkoutsContainer = document.getElementById('strength-workouts-list-container');
  const strengthSelectGroup = document.getElementById('strength-select-group');
  const modalStrengthWorkout = document.getElementById('modal-strength-workout');
  const formStrengthWorkout = document.getElementById('form-strength-workout');
  const btnOpenNewStrengthWorkout = document.getElementById('btn-open-new-strength-workout');

  function renderStrengthWorkouts(filterGroup = 'Tutti') {
    if (!strengthWorkoutsContainer) return;
    const all = window.athleticsDB.getStrengthWorkouts();
    const filtered = filterGroup === 'Tutti' ? all : all.filter(w => w.gruppo === filterGroup || w.gruppo === 'Generale');

    if (filtered.length === 0) {
      strengthWorkoutsContainer.innerHTML = `
        <div style="text-align: center; padding: 36px; color: var(--text-muted);">
          Nessuna scheda trovata per questo gruppo. Tocca <strong>"+ Nuova Scheda"</strong> per crearne una.
        </div>`;
      return;
    }

    strengthWorkoutsContainer.innerHTML = filtered.map(w => {
      let exercisesHtml = '';
      if (Array.isArray(w.esercizi)) {
        exercisesHtml = w.esercizi.map(ex => `
          <div class="strength-ex-item">
            <div>
              <strong style="color: #fff;">${ex.nome}</strong>
              <div style="font-size: 0.78rem; color: var(--text-muted);">${ex.note || ''}</div>
            </div>
            <div style="text-align: right;">
              <span style="font-weight: 700; color: var(--accent-orange);">${ex.serie} x ${ex.reps}</span>
              <div style="font-size: 0.75rem; color: var(--accent-cyan);">${ex.carico} • rec. ${ex.rec}</div>
            </div>
          </div>
        `).join('');
      } else {
        exercisesHtml = `<div style="white-space: pre-wrap; font-size: 0.88rem; color: var(--text-secondary);">${w.esercizi}</div>`;
      }

      return `
        <div class="strength-workout-card">
          <div class="strength-workout-header">
            <div>
              <h4 class="strength-workout-title">${w.titolo}</h4>
              <span style="font-size: 0.8rem; color: var(--accent-orange); font-weight: 600;">Specialità: ${w.gruppo}</span>
            </div>
            <button class="btn-icon-subtle btn-del-str-workout" data-id="${w.id}" style="color: var(--accent-red);" title="Elimina Scheda">
              🗑️
            </button>
          </div>

          <div class="strength-exercises-list">
            ${exercisesHtml}
          </div>

          ${w.note ? `<p style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 12px;">💡 <strong>Focus Tecnico:</strong> ${w.note}</p>` : ''}

          <button class="btn-action btn-apply-str-workout" data-title="${w.titolo}" style="width: 100%; justify-content: center; background: rgba(249, 115, 22, 0.15); color: var(--accent-orange); border: 1px solid rgba(249, 115, 22, 0.4);">
            ▶ Usa Scheda nel Timer di Recupero
          </button>
        </div>
      `;
    }).join('');

    // Event listener eliminazione scheda
    strengthWorkoutsContainer.querySelectorAll('.btn-del-str-workout').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        if (confirm('Vuoi eliminare questa scheda di potenziamento?')) {
          window.athleticsDB.deleteStrengthWorkout(id);
          renderStrengthWorkouts(strengthSelectGroup ? strengthSelectGroup.value : 'Tutti');
          showToast('Scheda di potenziamento rimossa.');
        }
      });
    });

    // Event listener per "Usa Scheda"
    strengthWorkoutsContainer.querySelectorAll('.btn-apply-str-workout').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const title = e.currentTarget.dataset.title;
        navigateStrengthSub('panel-str-timer');
        setStrengthTimerMode('rest');
        showToast(`Scheda attivata: "${title}". Timer pronto!`);
      });
    });
  }

  strengthSelectGroup?.addEventListener('change', (e) => {
    renderStrengthWorkouts(e.target.value);
  });

  btnOpenNewStrengthWorkout?.addEventListener('click', () => {
    formStrengthWorkout?.reset();
    modalStrengthWorkout?.classList.add('open');
  });

  formStrengthWorkout?.addEventListener('submit', (e) => {
    e.preventDefault();
    const workoutData = {
      titolo: document.getElementById('swo-form-titolo').value.trim(),
      gruppo: document.getElementById('swo-form-gruppo').value,
      esercizi: document.getElementById('swo-form-esercizi').value.trim(),
      note: document.getElementById('swo-form-note').value.trim()
    };

    window.athleticsDB.saveStrengthWorkout(workoutData);
    modalStrengthWorkout?.classList.remove('open');
    renderStrengthWorkouts(strengthSelectGroup ? strengthSelectGroup.value : 'Tutti');
    showToast('Nuova scheda di potenziamento salvata!');
  });

  // 8. Registro & Diario Carichi
  const strengthLogsContainer = document.getElementById('strength-logs-list-container');
  const formAddStrengthLog = document.getElementById('form-add-strength-log');
  const btnExportStrengthCsv = document.getElementById('btn-export-strength-csv');

  function renderStrengthLogs() {
    if (!strengthLogsContainer) return;
    const logs = window.athleticsDB.getStrengthLogs();

    if (logs.length === 0) {
      strengthLogsContainer.innerHTML = `
        <div style="text-align: center; padding: 36px; color: var(--text-muted);">
          Nessuna serie registrata nel diario. Inserisci un carico nel form qui sopra.
        </div>`;
      return;
    }

    strengthLogsContainer.innerHTML = logs.map(l => `
      <div class="strength-log-card">
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1.05rem; font-weight: 700; color: #fff;">${l.atletaNome}</span>
            <span style="font-size: 0.75rem; background: rgba(249, 115, 22, 0.15); color: var(--accent-orange); padding: 2px 7px; border-radius: 4px; border: 1px solid rgba(249, 115, 22, 0.3);">
              ${l.esercizio}
            </span>
          </div>
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">
            📅 ${l.data} • <strong>${l.serie || 'Serie'}</strong>
          </div>
          ${l.note ? `<div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;">💡 ${l.note}</div>` : ''}
        </div>
        <div style="text-align: right;">
          <div style="font-size: 1.35rem; font-weight: 800; color: var(--accent-yellow); font-family: 'SF Mono', monospace;">
            ${l.caricoKg} Kg
          </div>
          <button class="btn-icon-subtle btn-del-str-log" data-id="${l.id}" style="padding: 2px 6px; font-size: 0.75rem; color: var(--accent-red); margin-top: 4px;">
            Elimina
          </button>
        </div>
      </div>
    `).join('');

    strengthLogsContainer.querySelectorAll('.btn-del-str-log').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        window.athleticsDB.deleteStrengthLog(id);
        renderStrengthLogs();
        updateHomeStats();
        showToast('Carico eliminato dal diario.');
      });
    });
  }

  formAddStrengthLog?.addEventListener('submit', (e) => {
    e.preventDefault();
    const athleteSelect = document.getElementById('log-form-athlete');
    const athleteId = athleteSelect?.value;
    const athlete = window.athleticsDB.getAthlete(athleteId);
    const athleteName = athlete ? `${athlete.nome} ${athlete.cognome}` : 'Atleta non assegnato';

    const log = {
      data: new Date().toLocaleString('it-IT'),
      atletaId: athleteId || null,
      atletaNome: athleteName,
      esercizio: document.getElementById('log-form-exercise').value.trim(),
      caricoKg: parseFloat(document.getElementById('log-form-weight').value) || 0,
      serie: document.getElementById('log-form-sets-reps').value.trim(),
      note: document.getElementById('log-form-notes').value.trim()
    };

    window.athleticsDB.saveStrengthLog(log);
    formAddStrengthLog.reset();
    renderStrengthLogs();
    updateHomeStats();
    showToast(`Carico di ${log.caricoKg}kg salvato per ${athleteName}!`);
  });

  btnExportStrengthCsv?.addEventListener('click', () => {
    const logs = window.athleticsDB.getStrengthLogs();
    if (logs.length === 0) {
      showToast('Nessun carico da esportare!');
      return;
    }

    let csv = 'Data,Atleta,Esercizio,CaricoKg,SerieERipetizioni,Note\n';
    logs.forEach(l => {
      csv += `"${l.data}","${l.atletaNome}","${l.esercizio}","${l.caricoKg}","${l.serie}","${l.note || ''}"\n`;
    });

    downloadFile(csv, `trackmaster_potenziamento_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
    showToast('File CSV Potenziamento esportato!');
  });

  // =========================================================================
  // GESTIONE FOGLIO RAPIDO MINIMALE & TABELLA RIEPILOGATIVA (SINGOLO & MULTI)
  // =========================================================================
  const sheetDateBadge = document.getElementById('sheet-current-date-badge');
  if (sheetDateBadge) {
    sheetDateBadge.textContent = new Date().toLocaleDateString('it-IT', {
      weekday: 'short', day: 'numeric', month: 'short'
    });
  }

  // 1. Selettore Modalità: Singolo Atleta vs Multi-Atleta (Gruppo)
  let sheetMode = 'single'; // 'single' | 'multi'
  const btnSheetModeSingle = document.getElementById('btn-sheet-mode-single');
  const btnSheetModeMulti = document.getElementById('btn-sheet-mode-multi');
  const sheetSinglePersonBox = document.getElementById('sheet-single-person-box');
  const sheetMultiPersonBox = document.getElementById('sheet-multi-person-box');
  const btnSheetSubmitText = document.getElementById('btn-sheet-submit-text');

  function setSheetMode(mode) {
    sheetMode = mode;
    btnSheetModeSingle?.classList.toggle('active', mode === 'single');
    btnSheetModeMulti?.classList.toggle('active', mode === 'multi');

    if (sheetSinglePersonBox) sheetSinglePersonBox.style.display = mode === 'single' ? 'block' : 'none';
    if (sheetMultiPersonBox) sheetMultiPersonBox.style.display = mode === 'multi' ? 'block' : 'none';

    updateSheetSubmitButtonText();
  }

  btnSheetModeSingle?.addEventListener('click', () => setSheetMode('single'));
  btnSheetModeMulti?.addEventListener('click', () => {
    setSheetMode('multi');
    if (selectedMultiAthletes.length === 0) {
      // Pre-seleziona i primi 2 atleti dal database come suggerimento comodo
      const allAth = window.athleticsDB.getAthletes();
      if (allAth.length > 0) {
        selectedMultiAthletes = allAth.slice(0, 3).map(a => ({
          id: a.id,
          name: `${a.nome} ${a.cognome}`,
          timeStr: '',
          timeSecs: 0,
          stopped: false
        }));
      }
    }
    renderMultiAthletesChips();
    renderMultiAthletesGrid();
  });

  function updateSheetSubmitButtonText() {
    if (!btnSheetSubmitText) return;
    if (sheetMode === 'single') {
      btnSheetSubmitText.textContent = '✍️ REGISTRA SUL FOGLIO & AGGIUNGI A TABELLA';
    } else {
      const count = selectedMultiAthletes.length;
      btnSheetSubmitText.textContent = count > 0 
        ? `✍️ REGISTRA ${count} ATLETI IN TABELLA`
        : '✍️ SELEZIONA ATLETI PER IL GRUPPO';
    }
  }

  // 2. Stato & Gestione Multi-Atleta
  let selectedMultiAthletes = [];
  let sheetTimingMode = 'same'; // 'same' | 'individual'

  const sheetMultiAthletesChips = document.getElementById('sheet-multi-athletes-chips');
  const sheetMultiCountBadge = document.getElementById('sheet-multi-count-badge');
  const sheetMultiAthletesListBox = document.getElementById('sheet-multi-athletes-list-box');
  const sheetMultiAthletesGrid = document.getElementById('sheet-multi-athletes-grid');
  const btnSheetTimeModeSame = document.getElementById('btn-sheet-time-mode-same');
  const btnSheetTimeModeIndiv = document.getElementById('btn-sheet-time-mode-indiv');
  const sheetInputAddMulti = document.getElementById('sheet-input-add-multi');
  const btnSheetAddMultiPerson = document.getElementById('btn-sheet-add-multi-person');

  function renderMultiAthletesChips() {
    if (!sheetMultiAthletesChips) return;
    const all = window.athleticsDB.getAthletes();
    sheetMultiAthletesChips.innerHTML = all.map(a => {
      const fullName = `${a.nome} ${a.cognome}`;
      const isSelected = selectedMultiAthletes.some(item => item.name.toLowerCase() === fullName.toLowerCase());
      return `
        <button type="button" class="sheet-multi-chip ${isSelected ? 'active' : ''}" data-id="${a.id}" data-name="${fullName}">
          <span class="chip-check">${isSelected ? '✓' : '+'}</span>
          <span>${fullName}</span>
        </button>
      `;
    }).join('');

    sheetMultiAthletesChips.querySelectorAll('.sheet-multi-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const name = e.currentTarget.dataset.name;
        toggleMultiAthlete(id, name);
      });
    });
  }

  function toggleMultiAthlete(id, name) {
    const idx = selectedMultiAthletes.findIndex(item => item.name.toLowerCase() === name.toLowerCase());
    if (idx >= 0) {
      selectedMultiAthletes.splice(idx, 1);
    } else {
      selectedMultiAthletes.push({
        id: id || 'custom-' + Date.now(),
        name: name,
        timeStr: '',
        timeSecs: 0,
        stopped: false
      });
    }
    renderMultiAthletesChips();
    renderMultiAthletesGrid();
    updateSheetSubmitButtonText();
  }

  // Aggiungi atleta manuale al volo nel gruppo
  btnSheetAddMultiPerson?.addEventListener('click', () => {
    const name = sheetInputAddMulti?.value.trim();
    if (!name) return;
    if (!selectedMultiAthletes.some(item => item.name.toLowerCase() === name.toLowerCase())) {
      selectedMultiAthletes.push({
        id: 'custom-' + Date.now(),
        name: name,
        timeStr: '',
        timeSecs: 0,
        stopped: false
      });
    }
    if (sheetInputAddMulti) sheetInputAddMulti.value = '';
    renderMultiAthletesChips();
    renderMultiAthletesGrid();
    updateSheetSubmitButtonText();
  });

  // Modalità Tempi Gruppo: Stesso tempo vs Individuali
  btnSheetTimeModeSame?.addEventListener('click', () => {
    sheetTimingMode = 'same';
    btnSheetTimeModeSame.classList.add('active');
    btnSheetTimeModeIndiv?.classList.remove('active');
    if (sheetMultiAthletesListBox) sheetMultiAthletesListBox.style.display = 'none';
  });

  btnSheetTimeModeIndiv?.addEventListener('click', () => {
    sheetTimingMode = 'individual';
    btnSheetTimeModeIndiv.classList.add('active');
    btnSheetTimeModeSame?.classList.remove('active');
    if (sheetMultiAthletesListBox) sheetMultiAthletesListBox.style.display = 'block';
    renderMultiAthletesGrid();
  });

  function renderMultiAthletesGrid() {
    if (sheetMultiCountBadge) {
      sheetMultiCountBadge.textContent = `${selectedMultiAthletes.length} atleti nel gruppo`;
    }

    if (!sheetMultiAthletesGrid) return;

    if (selectedMultiAthletes.length === 0) {
      sheetMultiAthletesGrid.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 12px; font-size: 0.8rem;">
          Nessun atleta selezionato nel gruppo. Tocca i nomi qui sopra.
        </div>`;
      return;
    }

    sheetMultiAthletesGrid.innerHTML = selectedMultiAthletes.map(ath => `
      <div class="sheet-multi-row" id="sheet-row-${ath.id}">
        <span class="sheet-multi-row-name">🏃 ${ath.name}</span>
        <input type="text" class="sheet-multi-row-time" id="sheet-time-input-${ath.id}" 
               data-id="${ath.id}" value="${ath.timeStr || '--:--.--'}" placeholder="00:00.00">
        <button type="button" class="btn-sheet-stop-athlete ${ath.stopped ? 'stopped' : ''}" 
                data-id="${ath.id}" id="btn-stop-ath-${ath.id}">
          ${ath.stopped ? 'ARRIVATO ✓' : 'STOP'}
        </button>
      </div>
    `).join('');

    // Listener per Stop individuale sul crono dal vivo
    sheetMultiAthletesGrid.querySelectorAll('.btn-sheet-stop-athlete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const ath = selectedMultiAthletes.find(a => a.id === id);
        if (!ath) return;

        if (sheetChronoRunning && sheetChronoElapsedTime > 0) {
          ath.timeStr = formatSheetMs(sheetChronoElapsedTime);
          ath.timeSecs = Math.round(sheetChronoElapsedTime / 1000);
          ath.stopped = true;
          window.athleticsAudio.playLap();
        } else {
          // Se non sta girando, alterna lo stato di arrivo
          ath.stopped = !ath.stopped;
        }
        renderMultiAthletesGrid();
      });
    });

    // Listener per modifica manuale del tempo riga
    sheetMultiAthletesGrid.querySelectorAll('.sheet-multi-row-time').forEach(input => {
      input.addEventListener('change', (e) => {
        const id = e.currentTarget.dataset.id;
        const ath = selectedMultiAthletes.find(a => a.id === id);
        if (ath) {
          ath.timeStr = e.currentTarget.value.trim();
        }
      });
    });
  }

  // 3. Gestione Chips Tipo Allenamento
  let sheetSelectedType = 'Corsa Veloce';
  const sheetTypeChips = document.querySelectorAll('#sheet-type-chips .sheet-chip');
  const sheetCustomTypeInput = document.getElementById('sheet-input-custom-type');

  sheetTypeChips.forEach(chip => {
    chip.addEventListener('click', (e) => {
      sheetTypeChips.forEach(c => c.classList.remove('active'));
      e.currentTarget.classList.add('active');
      sheetSelectedType = e.currentTarget.dataset.type;
      if (sheetCustomTypeInput) sheetCustomTypeInput.value = '';
    });
  });

  if (sheetCustomTypeInput) {
    sheetCustomTypeInput.addEventListener('input', (e) => {
      if (e.target.value.trim().length > 0) {
        sheetTypeChips.forEach(c => c.classList.remove('active'));
      }
    });
  }

  // 4. Cronometro Live sul Foglio (Integrato con Singolo e Multi-Arrivi)
  let sheetChronoStartTime = 0;
  let sheetChronoElapsedTime = 0;
  let sheetChronoInterval = null;
  let sheetChronoRunning = false;

  const sheetChronoDisplay = document.getElementById('sheet-chrono-display');
  const sheetChronoStatus = document.getElementById('sheet-chrono-status');
  const btnSheetChronoToggle = document.getElementById('btn-sheet-chrono-toggle');
  const btnSheetChronoReset = document.getElementById('btn-sheet-chrono-reset');

  function formatSheetMs(ms) {
    const totalSecs = Math.floor(ms / 1000);
    const m = Math.floor(totalSecs / 60).toString().padStart(2, '0');
    const s = (totalSecs % 60).toString().padStart(2, '0');
    const cs = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
    return `${m}:${s}.${cs}`;
  }

  function formatSecondsToPretty(totalSecs) {
    if (totalSecs < 60) {
      return `${totalSecs}"`;
    }
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return s > 0 ? `${m}' ${s.toString().padStart(2, '0')}"` : `${m}' min`;
  }

  function startSheetChrono() {
    sheetChronoRunning = true;
    sheetChronoStartTime = performance.now() - sheetChronoElapsedTime;
    if (sheetChronoStatus) {
      sheetChronoStatus.textContent = 'IN CORSO';
      sheetChronoStatus.style.color = 'var(--accent-green)';
      sheetChronoStatus.style.background = 'rgba(16, 185, 129, 0.2)';
    }
    if (btnSheetChronoToggle) {
      btnSheetChronoToggle.textContent = '⏹ FERMA CRONO';
      btnSheetChronoToggle.className = 'btn-sheet-chrono btn-sheet-chrono-stop';
    }

    sheetChronoInterval = setInterval(() => {
      sheetChronoElapsedTime = performance.now() - sheetChronoStartTime;
      const formatted = formatSheetMs(sheetChronoElapsedTime);
      if (sheetChronoDisplay) {
        sheetChronoDisplay.textContent = formatted;
      }

      // Se in modalità multi con tempi individuali, aggiorna i tempi degli atleti ancora in corsa
      if (sheetMode === 'multi' && sheetTimingMode === 'individual') {
        selectedMultiAthletes.forEach(ath => {
          if (!ath.stopped) {
            const inputEl = document.getElementById(`sheet-time-input-${ath.id}`);
            if (inputEl) inputEl.value = formatted;
          }
        });
      }
    }, 30);
  }

  function stopSheetChrono() {
    sheetChronoRunning = false;
    if (sheetChronoInterval) {
      clearInterval(sheetChronoInterval);
      sheetChronoInterval = null;
    }
    if (sheetChronoStatus) {
      sheetChronoStatus.textContent = 'IN PAUSA';
      sheetChronoStatus.style.color = 'var(--accent-yellow)';
      sheetChronoStatus.style.background = 'rgba(251, 191, 36, 0.2)';
    }
    if (btnSheetChronoToggle) {
      btnSheetChronoToggle.textContent = '▶ RIPRENDI';
      btnSheetChronoToggle.className = 'btn-sheet-chrono btn-sheet-chrono-start';
    }
  }

  function resetSheetChrono() {
    stopSheetChrono();
    sheetChronoElapsedTime = 0;
    if (sheetChronoDisplay) {
      sheetChronoDisplay.textContent = '00:00.00';
    }
    if (sheetChronoStatus) {
      sheetChronoStatus.textContent = 'IN ATTESA';
      sheetChronoStatus.style.color = '#94a3b8';
      sheetChronoStatus.style.background = 'rgba(255, 255, 255, 0.1)';
    }
    if (btnSheetChronoToggle) {
      btnSheetChronoToggle.textContent = '▶ AVVIA CRONO';
      btnSheetChronoToggle.className = 'btn-sheet-chrono btn-sheet-chrono-start';
    }

    // Reset tempi individuali atleti se presenti
    selectedMultiAthletes.forEach(ath => {
      ath.stopped = false;
      ath.timeStr = '';
      ath.timeSecs = 0;
    });
    renderMultiAthletesGrid();
  }

  btnSheetChronoToggle?.addEventListener('click', () => {
    if (sheetChronoRunning) {
      stopSheetChrono();
    } else {
      startSheetChrono();
    }
  });

  btnSheetChronoReset?.addEventListener('click', resetSheetChrono);

  // 5. Invio & Salvataggio del Foglio (Supporta Singolo & Multi-Atleta)
  const formQuickSheet = document.getElementById('form-quick-sheet');
  const sheetInputPerson = document.getElementById('sheet-input-person');
  const sheetInputManualMins = document.getElementById('sheet-input-manual-mins');
  const sheetInputManualSecs = document.getElementById('sheet-input-manual-secs');
  const sheetInputNotes = document.getElementById('sheet-input-notes');

  formQuickSheet?.addEventListener('submit', (e) => {
    e.preventDefault();

    // Tipo allenamento
    const customType = sheetCustomTypeInput?.value.trim();
    const finalType = customType || sheetSelectedType;
    const finalNotes = sheetInputNotes?.value.trim() || '';

    // Calcolo durata base principale: cronometro live o manuale
    let mainDurationStr = '';
    let mainDurationSecs = 0;

    if (sheetChronoElapsedTime > 0) {
      mainDurationStr = formatSheetMs(sheetChronoElapsedTime);
      mainDurationSecs = Math.round(sheetChronoElapsedTime / 1000);
    } else {
      const mins = parseInt(sheetInputManualMins?.value || '0', 10);
      const secs = parseInt(sheetInputManualSecs?.value || '0', 10);
      mainDurationSecs = (mins * 60) + secs;
      if (mainDurationSecs > 0) {
        mainDurationStr = formatSecondsToPretty(mainDurationSecs);
      }
    }

    const currentDateStr = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }) + ' ' +
                           new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

    // --- RAMO A: MODALITÀ SINGOLO ATLETA ---
    if (sheetMode === 'single') {
      const person = sheetInputPerson?.value.trim();
      if (!person) {
        showToast('⚠️ Inserisci il nome della persona o atleta!');
        return;
      }
      if (!mainDurationStr) {
        showToast('⚠️ Inserisci una durata o avvia il cronometro!');
        return;
      }

      const session = {
        data: currentDateStr,
        persona: person,
        tipo: finalType,
        durataStr: mainDurationStr,
        durataSecs: mainDurationSecs,
        note: finalNotes
      };

      window.athleticsDB.saveSheetSession(session);
      window.athleticsAudio.playLap();
      showToast(`✍️ Sessione di ${person} registrata nella tabella!`);

    } else {
      // --- RAMO B: MODALITÀ MULTI-ATLETA (GRUPPO) ---
      if (selectedMultiAthletes.length === 0) {
        showToast('⚠️ Seleziona almeno un atleta per il gruppo!');
        return;
      }

      let countSaved = 0;

      selectedMultiAthletes.forEach(ath => {
        let athDurStr = mainDurationStr;
        let athDurSecs = mainDurationSecs;

        // Se in modalità individuale e l'atleta ha un tempo registrato
        if (sheetTimingMode === 'individual' && ath.timeStr && ath.timeStr !== '--:--.--') {
          athDurStr = ath.timeStr;
          athDurSecs = ath.timeSecs || mainDurationSecs;
        }

        if (!athDurStr) {
          athDurStr = '00:00.00';
        }

        const session = {
          data: currentDateStr,
          persona: ath.name,
          tipo: finalType,
          durataStr: athDurStr,
          durataSecs: athDurSecs,
          note: finalNotes ? `${finalNotes} (Gruppo)` : 'Sessione Gruppo'
        };

        window.athleticsDB.saveSheetSession(session);
        countSaved++;
      });

      window.athleticsAudio.playWorkStart();
      showToast(`✍️ Registrate ${countSaved} sessioni per il gruppo nella tabella!`);
    }

    // Reset parziale per il prossimo lavoro
    resetSheetChrono();
    if (sheetInputManualMins) sheetInputManualMins.value = '';
    if (sheetInputManualSecs) sheetInputManualSecs.value = '';
    if (sheetInputNotes) sheetInputNotes.value = '';

    renderSheetTable();
    updateHomeStats();
  });

  // 6. Render Tabella Riepilogativa
  const sheetTableBody = document.getElementById('sheet-table-body');
  const sheetBadgeCount = document.getElementById('sheet-badge-count');
  const sheetBadgeTotalTime = document.getElementById('sheet-badge-total-time');
  const sheetTableSearch = document.getElementById('sheet-table-search');

  function renderSheetTable(query = '') {
    if (!sheetTableBody) return;
    const all = window.athleticsDB.getSheetSessions();
    const q = query.toLowerCase().trim();

    const filtered = all.filter(s => {
      const full = `${s.persona} ${s.tipo} ${s.durataStr} ${s.note || ''} ${s.data}`.toLowerCase();
      return full.includes(q);
    });

    // Statistiche contatori
    if (sheetBadgeCount) {
      sheetBadgeCount.textContent = `${filtered.length} Registrati`;
    }

    const totalSeconds = filtered.reduce((acc, curr) => acc + (curr.durataSecs || 0), 0);
    if (sheetBadgeTotalTime) {
      sheetBadgeTotalTime.textContent = `Tot: ${formatSecondsToPretty(totalSeconds)}`;
    }

    if (filtered.length === 0) {
      sheetTableBody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 36px 14px;">
            Nessuna sessione registrata. Compila il foglio a sinistra e premi <strong>"REGISTRA SUL FOGLIO"</strong>.
          </td>
        </tr>`;
      return;
    }

    sheetTableBody.innerHTML = filtered.map(item => `
      <tr>
        <td>
          <div class="sheet-cell-person">${item.persona}</div>
          <div class="sheet-cell-date">📅 ${item.data}</div>
        </td>
        <td>
          <span class="sheet-cell-workout-badge">${item.tipo}</span>
          ${item.note ? `<div class="sheet-cell-notes" title="${item.note}">💡 ${item.note}</div>` : ''}
        </td>
        <td>
          <div class="sheet-cell-time">${item.durataStr}</div>
        </td>
        <td style="text-align: center;">
          <button class="btn-del-sheet-row" data-id="${item.id}" title="Elimina Riga">
            🗑️
          </button>
        </td>
      </tr>
    `).join('');

    // Listener per eliminazione singola riga
    sheetTableBody.querySelectorAll('.btn-del-sheet-row').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        window.athleticsDB.deleteSheetSession(id);
        renderSheetTable(sheetTableSearch?.value || '');
        updateHomeStats();
        showToast('Riga rimossa dalla tabella.');
      });
    });
  }

  sheetTableSearch?.addEventListener('input', (e) => {
    renderSheetTable(e.target.value);
  });

  // 5. Esporta CSV Tabella
  document.getElementById('btn-sheet-export-csv')?.addEventListener('click', () => {
    const list = window.athleticsDB.getSheetSessions();
    if (list.length === 0) {
      showToast('Nessun dato nella tabella da esportare!');
      return;
    }

    let csv = 'Data,Persona_Atleta,Tipo_Allenamento,Tempo_Durata,Secondi,Note\n';
    list.forEach(r => {
      csv += `"${r.data}","${r.persona}","${r.tipo}","${r.durataStr}",${r.durataSecs},"${(r.note || '').replace(/"/g, '""')}"\n`;
    });

    downloadFile(csv, `foglio_riepilogo_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
    showToast('File CSV della Tabella esportato!');
  });

  // 6. Svuota Tabella
  document.getElementById('btn-sheet-clear-all')?.addEventListener('click', () => {
    const list = window.athleticsDB.getSheetSessions();
    if (list.length === 0) {
      showToast('La tabella è già vuota.');
      return;
    }
    if (confirm('Sei sicuro di voler svuotare tutte le sessioni registrate sul foglio?')) {
      window.athleticsDB.clearSheetSessions();
      renderSheetTable();
      updateHomeStats();
      showToast('Tabella svuotata.');
    }
  });

  // Inizializzazione dati all'avvio
  renderAthletes();
  populateChronoEvents('100m Piani');
  renderWorkouts();
  renderResults();
  renderLanes();
  renderStrengthWorkouts();
  renderStrengthLogs();
  renderSheetTable();
  renderMultiAthletesChips();
  renderMultiAthletesGrid();
  calculate1RM();
  updateHomeStats();
  updateStrRestDisplay();
});
