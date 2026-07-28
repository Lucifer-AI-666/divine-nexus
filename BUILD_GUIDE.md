# Divine Nexus - Build Guide

## Prerequisiti

- Node.js 22+
- pnpm 9+
- Expo CLI
- Expo Account (https://expo.dev)

## Build Locale (Rapido)

```bash
# Installa dipendenze
pnpm install

# Avvia il dev server
pnpm dev

# Scansiona il QR code con Expo Go su iOS/Android
```

## Build APK con Expo EAS (Consigliato)

### 1. Setup Iniziale

```bash
# Accedi a Expo
eas login

# Configura il progetto (una sola volta)
eas build:configure
```

### 2. Build APK per Android

```bash
# Build di produzione
eas build --platform android

# Build di preview (più veloce)
eas build --platform android --profile preview
```

### 3. Build IPA per iOS

```bash
# Build di produzione
eas build --platform ios

# Build di preview
eas build --platform ios --profile preview
```

## Build Automatico con GitHub Actions

Il repository è configurato con GitHub Actions che compila automaticamente l'APK ad ogni push su `main`.

### Setup GitHub Secrets

1. Vai a: **Settings → Secrets and variables → Actions**
2. Aggiungi il secret:
   - **EXPO_TOKEN**: Ottieni da https://expo.dev/settings/tokens

### Trigger Build

```bash
# Il build si avvia automaticamente ad ogni push
git push origin main

# Oppure manualmente:
# Vai a Actions → Build APK with Expo EAS → Run workflow
```

## Download APK

### Dopo EAS Build

```bash
# Elenca i build disponibili
eas build:list

# Scarica l'APK
eas build:download <BUILD_ID>
```

### Da GitHub Actions

1. Vai a **Actions → Build APK with Expo EAS**
2. Seleziona il workflow run
3. Scarica l'APK dagli artifacts

## Troubleshooting

### "EXPO_TOKEN not found"
- Assicurati di aver aggiunto il secret su GitHub
- Rigenera il token da https://expo.dev/settings/tokens

### Build fallisce
- Verifica che `app.config.ts` sia corretto
- Controlla i log: `eas build:view <BUILD_ID>`

### APK non installa
- Assicurati che il dispositivo sia in modalità sviluppo
- Prova a disinstallare la versione precedente

## Distribuzione

### Play Store (Android)

```bash
# Configura il service account JSON
# Poi esegui:
eas submit --platform android --latest
```

### App Store (iOS)

```bash
# Configura le credenziali Apple
# Poi esegui:
eas submit --platform ios --latest
```

## Documentazione

- [Expo EAS Build](https://docs.expo.dev/build/introduction/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Divine Nexus Docs](./README.md)
