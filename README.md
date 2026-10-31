# TrackMaster - Atletica Leggera (PWA per iPhone & iPad)

Applicazione Web Progressiva (PWA) progettata specificamente per allenatori, atleti e cronometristi di **Atletica Leggera**, ottimizzata per **iPhone** e **iPad / Tablet**.

---

## 🚀 Come avviare l'App

### 1. Su Mac (Subito)
È sufficiente aprire il file `index.html` con qualsiasi browser (Safari, Chrome, Firefox):
- Fai doppio clic su `index.html` nella cartella `app_altetica_version`.

### 2. Sul tuo iPhone e iPad in Rete Locale (Stesso Wi-Fi)
Il server locale è già configurato. Per avviarlo dal Terminale:
```bash
perl server.pl 8080
```
Sul tuo iPhone o iPad, apri **Safari** e digita l'indirizzo mostrato a video:
```
http://192.168.1.8:8080
```

---

## 📲 Come installare l'App su iPhone e iPad (Full Screen come App Nativa)

1. Apri `http://192.168.1.8:8080` in **Safari** su iPhone o iPad.
2. Tocca l'icona di **Condivisione Apple** (il quadrato con la freccia verso l'alto ⬆️ in basso al centro su iPhone, o in alto a destra su iPad).
3. Scorri le opzioni e tocca **"Aggiungi a schermata Home"**.
4. Tocca **"Aggiungi"** in alto a destra.

✨ L'icona di **TrackMaster** comparirà sulla schermata principale del tuo dispositivo. Toccandola si aprirà a schermo intero senza le barre di Safari, come una vera applicazione iOS nativa dall'App Store!

---

## ⚡ Caratteristiche Principali

### 🏠 Pagina Iniziale & Sessioni di Lavoro
Schermata di benvenuto progettata per iPhone e iPad con accesso immediato alle tre modalità di allenamento:
1. **🏃‍♂️ Sessione di Allenamento di Atletica**: Pista, cronometro singolo e 6 corsie, starter FIDAL, parziali e recuperi ripetute.
2. **🏋️‍♂️ Sessione di Potenziamento Muscolare**: Forza, pliometria, conditioning, timer pesi, schede specifiche e diario carichi.
3. **📝 Foglio Rapido & Tabella Riepilogo**: Simulazione di un foglio bianco pulito e minimale per inserimento rapido a mano libera (Persona, Tipo allenamento, Cronometro live o Durata manuale) e generazione istantanea di una tabella riassuntiva ordinata ed esportabile.
- Tasto rapido **"🏠 Inizio"** e **"📝 Foglio"** sempre accessibili dall'header e dalla barra inferiore per passare in qualsiasi momento da una sessione all'altra.

### 📝 Foglio Rapido Minimale & Tabella Dinamica (Singolo & Multi-Atleta)
- **Modalità Singolo vs Multi-Atleta (Gruppo)**:
  - *👤 Singolo Atleta*: compilazione immediata per un singolo corridore con suggerimenti veloci.
  - *👥 Multi-Atleta*: selezione simultanea di più atleti con un tocco sui chip o inserimento di nomi al volo nel gruppo.
- **Gestione Tempi di Gruppo**:
  - *⏱️ Stesso tempo per tutti*: ideale quando il gruppo corre una serie insieme o effettua la stessa sessione; il tempo del cronometro o manuale viene applicato a tutti.
  - *⚡ Tempi individuali / Arrivi live*: visualizza la lista degli atleti del gruppo sul foglio con tasto **"STOP [Nome]"** dedicato per ciascuno mentre il cronometro gira, per registrare gli arrivi separati!
  - Registrazione multipla con un solo tocco: `✍️ REGISTRA X ATLETI IN TABELLA` inserisce tutte le righe dei partecipanti nella tabella di riepilogo.
- **Estetica "Foglio Bianco Pulito"**: design a blocco appunti cartaceo con fori, testata con data dinamica e campi a contrasto pulito.
- **Dati Registrabili**:
  - *Persona / Partecipanti*: input libero o selezione istantanea tramite datalist e chip degli atleti FIDAL registrati.
  - *Tipo di Allenamento*: chip rapidi (*Corsa Veloce, Ripetute, Pesi, Pliometria, Fondo, Ostacoli, Core*) oppure testo personalizzato.
  - *Tempo / Durata*: **Cronometro dal vivo** centesimale integrato sul foglio (con tasti Start/Pausa e Azzera) oppure **inserimento manuale** di minuti e secondi.
  - *Note opzionali*: sensazioni, recupero, condizioni meteo.
- **Tabella Riepilogativa Sincronizzata**:
  - Colonne: **Persona / Atleta**, **Tipo Allenamento**, **Tempo / Durata**, **Data/Ora**, **Azioni**.
  - Calcolo automatico in tempo reale del numero di sessioni e del **tempo cumulativo totale**.
  - Barra di ricerca e filtro istantaneo per nome o tipologia.
  - Tasto **"📥 Esporta CSV"** compatibile con Excel e Google Sheets.
  - Tasto **"🗑️ Svuota"** con richiesta di conferma.
- **Layout Split-View su iPad e Tablet**: su schermi larghi il foglio bianco e la tabella compaiono affiancati a due colonne; su smartphone scorrono verticalmente in modo fluido.

### ⏱️ Cronometro Professionale di Atletica
- **Precisione al centesimo di secondo**: sincronizzato ad alta frequenza (60fps) con `performance.now()`.
- **Intertempi & Passaggi (Split/Lap)**: registra i parziali con calcolo automatico del differenziale (Delta) giro per giro.
- **Procedura Ufficiale Starter FIDAL**:
  - *"Ai vostri posti"* (tono basso di posizionamento).
  - *"Pronti"* (tono medio di preparazione).
  - *Sparo / Start Gun* (impulso sonoro realistico dopo tempo casuale tra 1.5s e 2.3s).
- **Timer di Recupero Automatico**: preset rapidi a 1', 1'30", 2', 3' e 5' con countdown acustico a 3-2-1 e segnale di fine recupero.
- **Schermo sempre attivo (Screen Wake Lock)**: evita che l'iPhone/iPad vada in standby durante le serie in pista.

### 🏋️‍♂️ Sessione di Potenziamento Muscolare per l'Atletica
- **Timer Specializzati**:
  - **Recupero Serie Pesi**: preset di recupero forza (60s, 90s, 2', 3', 5') con avvisi acustici e contatore serie automatico.
  - **EMOM (Every Minute On the Minute)**: impostabile a 8', 10', 12', 15', 20' minuti con segnale acustico di inizio lavoro ogni 60 secondi.
  - **TABATA & Interval Training**: lavoro e riposo programmabili (default 20" lavoro / 10" riposo x 8 round) con display dinamico verde/arancione e audio dedicato.
- **Schede di Potenziamento Specifiche FIDAL**:
  - *Velocità & Ostacoli*: Forza esplosiva e reattività (Power Clean, Mezzo Squat, Hip Thrust, Balzi, Nordic Hamstring).
  - *Saltatori*: Forza elastico-riflessa e pliometria (Drop Jump, Back Squat, Single-Leg RDL, Pogo Jumps).
  - *Mezzofondo & Fondo*: Resistenza alla forza e core stability (Step-up dinamici, Affondi camminati, Prevenzione tendine d'Achille).
  - *Lanciatori*: Potenza e catena cinetica (Strappo da sospensione, Panca esplosiva, Push Press, Lanci medball).
  - *Prevenzione Infortuni*: Nordic Hamstring, Copenhagen adductor plank, tibiale anteriore e isometrie rotulee.
  - Creazione di schede personalizzate con un click.
- **Calcolatore Massimali 1RM**:
  - Calcolo scientifico (formula Epley) con stima istantanea del carico massimale.
  - Ripartizione automatica delle percentuali di carico (95%, 90%, 85%, 80%, 75%, 70%, 60%) con indicazione dell'obiettivo atletico.
  - Tasto rapido "Salva nel Diario Carichi".
- **Diario Carichi & Progressi**:
  - Registrazione delle serie, carichi in kg e sensazioni tecniche associate a ciascun atleta.
  - Esportazione dedicata in formato CSV per Excel.

### 👥 Modalità Multi-Corsia (Ottimizzata per iPad al traguardo)
- Visualizzazione fino a **6 corsie contemporanee**.
- Partenza sincronizzata di gruppo.
- Pulsante di arrivo **"STOP CORSIA"** indipendente e gigante per ogni corsia.
- Assegnazione rapida dell'atleta a ciascuna corsia.
- Salvataggio cumulativo con un solo tocco dei tempi di tutti i concorrenti.

### 🏃 Gestione Atleti & Categorie FIDAL
- Database atleti con: Nome, Cognome, Anno di Nascita, Categoria FIDAL (*Esordienti, Ragazzi, Cadetti, Allievi, Juniores, Promesse, Seniores, Master*), Gruppo di allenamento, Specialità principale.
- Tracciamento dei record personali: **Personal Best (PB)** e **Season Best (SB)**.
- Tasto rapido **"⏱️ Cronometra"** per passare direttamente al cronometro con l'atleta già selezionato.

### 📋 Schede & Programmi di Allenamento
- Creazione e pianificazione delle sessioni (es. Ripetute lattacide, test sui 60m/100m/300m, fartlek).
- Note tecniche e obiettivi di serie e recupero.

### 📊 Storico Tempi & Esportazione
- Archivio cronologico di tutte le prove effettuate.
- **Esportazione CSV**: scarica i dati compatibili con Excel e Google Sheets.
- **Backup & Ripristino JSON**: esporta e trasferisci l'intero database tra Mac, iPhone e iPad in qualsiasi momento.

### 📶 100% Funzionamento Offline in Pista
Grazie al **Service Worker** e al database locale (`localStorage` / `IndexedDB`), l'applicazione non richiede alcuna connessione internet dopo il primo caricamento. Puoi usarla liberamente in campi di atletica privi di segnale cellulare o Wi-Fi.

---

## 📂 Struttura del Progetto
```
app_altetica_version/
├── index.html            # Interfaccia grafica Single Page Application
├── manifest.json         # Manifesto PWA per installazione su iOS / Android
├── sw.js                 # Service Worker per cache e funzionamento offline
├── server.pl             # Server HTTP leggero locale per test su rete Wi-Fi
├── css/
│   └── style.css         # Stili ad alto contrasto, Dark Mode e safe area iPhone/iPad
├── js/
│   ├── app.js            # Controller principale e gestione viste
│   ├── db.js             # Database atleti, schede, categorie FIDAL e backup
│   ├── stopwatch.js      # Motore cronometro singolo e multi-corsia
│   └── audio.js          # Sintetizzatore Web Audio per starter e recuperi
└── icons/
    └── icon.svg          # Icona vettoriale retina per pista e cronometro
```
