# MirrorMe - Validation Checklist

## Setup
- [ ] Run `npm install` to install dependencies
- [ ] Run `npx expo prebuild` to initialize native projects (if needed)
- [ ] Ensure camera permissions are configured in app.json

## Core Features

### Onboarding & Consent
- [ ] First launch shows consent modal
- [ ] Consent is saved to database
- [ ] Consent modal doesn't show again after accepting

### Camera & Scanning
- [ ] Camera permission is requested properly
- [ ] Camera view opens when "Scan my face" is pressed
- [ ] Photo capture works
- [ ] Photo is saved to media library
- [ ] Fake ML generates landmarks (when USE_FAKE_ML is true)
- [ ] Scoring computes subscores correctly
- [ ] Actions are generated from scores

### Data Persistence
- [ ] Scans are saved to SQLite
- [ ] Actions are created and linked to scans
- [ ] Plan items are created for each scan
- [ ] Badges are awarded correctly
- [ ] Settings persist across app restarts

### UI Components
- [ ] ScoreRing animates correctly
- [ ] ActionCard shows actions with proper status
- [ ] Badge component displays correctly
- [ ] Onboarding modal appears on first launch

### Screens
- [ ] Home screen shows latest scan and actions
- [ ] Progress screen displays scan history
- [ ] Progress screen shows badges
- [ ] Settings screen allows export/delete
- [ ] Settings screen toggles accessibility options

### Actions
- [ ] Actions can be marked as done/todo
- [ ] Action status updates in database
- [ ] Completed actions trigger badge checks

### Badges
- [ ] First scan badge is awarded
- [ ] Streak badges are calculated correctly
- [ ] Badges appear in Progress screen

### Data Export/Delete
- [ ] Export creates JSON file
- [ ] Export can be shared
- [ ] Delete removes all data
- [ ] Delete requires confirmation

### Accessibility
- [ ] Reduce Motion toggle works
- [ ] High Contrast toggle works (styling implementation needed)
- [ ] Large tap targets (44px minimum)

## Testing
- [ ] Unit tests pass: `npm test`
- [ ] Scoring tests validate score ranges
- [ ] Tips tests validate action generation

## Known Limitations
- [ ] Timelapse video composition is stubbed (returns first photo)
- [ ] Real MediaPipe integration not yet implemented
- [ ] High contrast mode styling needs implementation
- [ ] Tab icons are placeholders (use react-native-vector-icons in production)

## Next Steps
1. Integrate real MediaPipe Face Mesh
2. Implement full timelapse video composition
3. Add high contrast theme styling
4. Replace placeholder tab icons
5. Add error boundaries
6. Add loading states throughout
7. Implement offline-first architecture enhancements

