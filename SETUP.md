# Setup Instructions

## Prerequisites

- Node.js 18+ installed
- Expo CLI installed globally: `npm i -g expo-cli`
- iOS Simulator (Mac) or Android Emulator, or physical device with Expo Go

## Installation

1. Install dependencies:
```bash
npm install
```

2. Initialize Expo project (if needed):
```bash
npx expo prebuild
```

## Running the App

### iOS
```bash
npx expo run:ios
```

### Android
```bash
npx expo run:android
```

### Development Server
```bash
npm start
# or
npx expo start
```

## Testing

Run tests:
```bash
npm test
```

## Building

### iOS
```bash
eas build --platform ios
```

### Android
```bash
eas build --platform android
```

## Notes

- The app uses fake ML data by default (see `config/flags.ts`)
- Camera permissions are required for scanning
- All data is stored locally in SQLite
- No network calls are made by default

