# MirrorMe — AI Looksmax Coach (React Native + Expo)

MirrorMe is a privacy-first mobile app that analyzes facial landmarks and posture locally to suggest daily looksmax actions across skincare, posture, jaw/tongue posture (mewing), hair, and grooming. It tracks progress with weekly timelapse videos and gamifies streaks.

## Tech

- React Native (Expo) — iOS/Android

- Zustand (state), Expo Router (navigation)

- Expo Camera + MediaPipe/TFLite for face landmarks (on-device)

- Expo SQLite for local data; no cloud by default

- Reanimated for micro-interactions

- EAS Build for distribution

## Key Screens

1. Onboarding & Consent

2. Live Scan (camera) + Instant Score

3. Daily Plan (AI tips)

4. Progress (photos, timelapse, badges)

5. Settings (privacy, export, delete)

## Quickstart

```bash
npm i -g expo-cli
npm install
npx expo prebuild
npx expo run:ios # or run:android
```

## Dev Notes

* All ML runs on-device; no PII leaves device.

* Tips are informational only; not medical advice.

* Use feature flags in `app/config/flags.ts`.

