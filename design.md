# Divine Nexus Mobile - Design Document

## Overview
Divine Nexus Mobile è un'app iOS/Android che fornisce un'interfaccia mobile al Core intelligente Divine Nexus. L'app consente agli utenti di interagire con quattro identità AI distinte, gestire automazioni temporali e accedere a una shell CLI.

## Screen List
1. **Chat Screen** (Tab 1) - Conversazione multi-identità con Groq AI
2. **Automazioni Screen** (Tab 2) - Gestione di automazioni (Passato/Presente/Futuro)
3. **Shell Screen** (Tab 3) - Interfaccia CLI per comandi avanzati
4. **Settings Screen** - Configurazione app e preferenze

## Primary Content and Functionality

### Chat Screen (index.tsx)
- **Identity Selector**: Badge con 4 identità (Dio, Michele, Matildina, Lucifero)
- **Message List**: FlatList con messaggi dell'utente e risposte dell'AI
- **Message Types**: system, user, entity (con colori identità)
- **Input Area**: TextInput con tasto invio per inviare messaggi
- **Reset Button**: "Azzera Memoria" per pulire la cronologia
- **Typing Indicator**: Animazione durante l'elaborazione AI

### Automazioni Screen (automations.tsx)
- **Temporal Tabs**: Passato | Presente | Futuro
- **Automation Cards**: Titolo, stato (completato/in corso/pianificato), progress bar, timestamp
- **Passato Tab**: Log di automazioni completate
- **Presente Tab**: Automazioni in esecuzione con progress
- **Futuro Tab**: Automazioni pianificate

### Shell Screen (shell.tsx)
- **Output Area**: FlatList con output monospace
- **Command Input**: TextInput per inserire comandi
- **Execute Button**: Pulsante per eseguire
- **Built-in Commands**: help, status, clear, scan, analyze
- **Command History**: Visualizzazione della cronologia comandi

## Key User Flows

### Flow 1: Chat Conversazione
1. Utente apre l'app → Chat Screen
2. Seleziona identità (tap su badge)
3. Digita messaggio → Premi invio
4. App invia richiesta al Core tramite API
5. Riceve risposta e la visualizza con colore identità
6. Messaggio salvato in AsyncStorage

### Flow 2: Gestione Automazioni
1. Utente apre Automazioni Screen
2. Seleziona tab temporale (Passato/Presente/Futuro)
3. Visualizza lista automazioni
4. Tap su automazione → Dettagli
5. Può cancellare o modificare automazioni pianificate

### Flow 3: Comandi Shell
1. Utente apre Shell Screen
2. Digita comando (es. `scan`)
3. Premi Execute
4. Output visualizzato in monospace
5. Cronologia salvata localmente

## Color Choices
- **Dio**: Gold (#ffd700) - Onnipotenza e saggezza
- **Michele**: Blue (#0044cc) - Forza e protezione
- **Matildina**: Pink (#cc3377) - Grazia e compassione
- **Lucifero**: Orange (#ff6600) - Illuminazione e conoscenza
- **Background**: Dark (#151718) - Tema scuro per ridurre affaticamento
- **Text**: Light (#ECEDEE) - Contrasto elevato
- **Accent**: Primary (#0a7ea4) - Turchese per azioni principali

## Technical Architecture
- **Frontend**: React Native + Expo + NativeWind
- **Backend**: Express.js + tRPC
- **AI**: Groq API (llama-3.3-70b-versatile)
- **Storage**: AsyncStorage (locale), PostgreSQL (cloud opzionale)
- **State**: React useState + useEffect

## Persistence
- **Messages**: Salvate in AsyncStorage con limite 200 messaggi
- **Identity**: Identità corrente salvata in AsyncStorage
- **Automazioni**: Salvate in AsyncStorage con timestamp
- **Shell History**: Cronologia comandi salvata localmente
