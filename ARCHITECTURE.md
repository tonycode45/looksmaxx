# MirrorMe Architecture Documentation

## Overview

MirrorMe is a React Native mobile application built with Expo that analyzes facial landmarks and posture to provide personalized looksmax coaching. The app runs entirely on-device with no cloud dependencies, prioritizing user privacy.

## Architecture Principles

1. **Privacy-First**: All processing happens on-device, no data leaves the device
2. **Type Safety**: TypeScript throughout for type safety and better developer experience
3. **Modularity**: Clear separation of concerns with dedicated modules
4. **Accessibility**: Built-in support for reduce motion and high contrast
5. **Performance**: Optimized for mobile with performance monitoring

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      React Native App                       │
│                      (Expo Framework)                       │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐  ┌────────▼────────┐  ┌────────▼────────┐
│   UI Layer     │  │  State Layer    │  │  Business Logic  │
│                │  │                 │  │                 │
│ - Screens      │  │ - Zustand Store │  │ - ML Scoring    │
│ - Components   │  │ - Database      │  │ - Action Gen    │
│ - Navigation   │  │ - Persistence   │  │ - Tips Engine   │
└────────────────┘  └────────────────┘  └────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   Data Layer      │
                    │                   │
                    │ - SQLite (Native) │
                    │ - AsyncStorage    │
                    │   (Web Fallback) │
                    └───────────────────┘
```

## Directory Structure

```
mirrorme/
├── app/                    # Expo Router screens (file-based routing)
│   ├── _layout.tsx        # Root layout with tab navigation
│   ├── index.tsx          # Home screen (scan + actions)
│   ├── progress.tsx       # Progress tracking screen
│   └── settings.tsx       # Settings and privacy
│
├── components/            # Reusable UI components
│   ├── ActionCard.tsx     # Action item display
│   ├── Badge.tsx          # Badge component
│   ├── OnboardingModal.tsx # First-run consent modal
│   └── ScoreRing.tsx      # Animated score visualization
│
├── config/                # Configuration and constants
│   ├── flags.ts           # Feature flags
│   ├── strings.ts         # Localized strings
│   └── theme.ts           # Design system theme
│
├── ml/                    # Machine Learning & Scoring
│   ├── landmark.ts        # Face landmark extraction
│   ├── scoring.ts         # Score computation algorithms
│   └── tips.ts            # Action generation logic
│
├── state/                 # State Management
│   ├── db.ts              # Database abstraction layer
│   └── useStore.ts       # Zustand store (global state)
│
└── utils/                 # Utility functions
    ├── logger.ts          # Logging system
    ├── media.ts           # Camera/media utilities
    ├── performance.ts     # Performance monitoring
    └── timelapse.ts       # Video composition
```

## Core Modules

### 1. UI Layer (`app/`, `components/`)

**Expo Router** provides file-based routing:
- `app/index.tsx` → Home screen
- `app/progress.tsx` → Progress screen
- `app/settings.tsx` → Settings screen

**Component Architecture**:
- Components are functional React components
- Use `react-native-reanimated` for animations
- Respect `reduceMotion` and `highContrast` preferences
- Themed using `config/theme.ts`

**Key Components**:
- `ScoreRing`: Animated circular progress indicator
- `ActionCard`: Displays action items with status toggle
- `OnboardingModal`: First-run consent flow

### 2. State Management (`state/`)

**Zustand Store** (`state/useStore.ts`):
- Global application state
- Manages scans, plan items, badges, settings
- Provides async actions for database operations
- Handles loading states and error handling

**State Structure**:
```typescript
{
  scans: Scan[]              // All user scans
  currentScan: Scan | null   // Currently active scan
  planItems: PlanItem[]      // Daily action items
  badges: Badge[]            // Earned badges
  hasConsented: boolean      // User consent status
  reduceMotion: boolean      // Accessibility setting
  highContrast: boolean      // Accessibility setting
  isLoading: boolean         // Loading indicator
}
```

**Database Layer** (`state/db.ts`):
- Abstracts SQLite (native) and AsyncStorage (web)
- Provides CRUD operations for all entities
- Handles cross-platform compatibility
- Automatic schema initialization

### 3. Business Logic (`ml/`)

**Scoring System** (`ml/scoring.ts`):
- `computeScores()`: Main entry point
- Calculates 4 subscores: posture, symmetry, skin, hair
- Weighted average for overall score
- Refactored into smaller, testable functions

**Landmark Extraction** (`ml/landmark.ts`):
- Currently stubbed with fake data (flag-controlled)
- Ready for MediaPipe/TFLite integration
- Returns 468-point face mesh (MediaPipe standard)

**Action Generation** (`ml/tips.ts`):
- Generates 3 prioritized actions based on scores
- Prioritizes lowest-scoring categories
- Provides contextual tips and durations

### 4. Utilities (`utils/`)

**Logging** (`utils/logger.ts`):
- Structured logging with levels (DEBUG, INFO, WARN, ERROR)
- Context-aware logging
- Scoped loggers for modules
- Development/production mode detection

**Performance Monitoring** (`utils/performance.ts`):
- Timer-based performance tracking
- Metric collection and aggregation
- Automatic slow operation detection
- Decorator functions for easy instrumentation

**Media Utilities** (`utils/media.ts`):
- Camera permission handling
- Photo capture helpers
- Media library integration

## Data Flow

### Scan Flow

```
1. User taps "Scan" button
   ↓
2. Camera permission check
   ↓
3. Camera view displayed
   ↓
4. User captures photo
   ↓
5. Photo saved to media library
   ↓
6. extractLandmarks() called
   ↓
7. computeScores() processes landmarks
   ↓
8. generateActions() creates action plan
   ↓
9. Scan saved to database
   ↓
10. Actions saved as plan items
    ↓
11. Store updated, UI refreshed
```

### State Update Flow

```
User Action
    ↓
Store Action (useStore)
    ↓
Database Operation (db.ts)
    ↓
SQLite/AsyncStorage
    ↓
Store State Updated
    ↓
React Re-render
```

## Design Patterns

### 1. Repository Pattern
- `state/db.ts` acts as repository abstraction
- Hides database implementation details
- Provides consistent API regardless of platform

### 2. Singleton Pattern
- Logger and PerformanceMonitor are singletons
- Ensures consistent logging/metrics across app

### 3. Factory Pattern
- `createScopedLogger()` creates scoped logger instances
- `generateActions()` creates action objects

### 4. Strategy Pattern
- Different scoring strategies for different categories
- Fallback strategies when primary fails

## Error Handling

**Strategy**:
- Try-catch blocks around async operations
- Errors logged using logger utility
- User-friendly error messages
- Graceful degradation (fallback values)

**Example**:
```typescript
try {
  await db.createScan(scanData);
} catch (error) {
  logger.error('Failed to create scan', error);
  // Show user-friendly error message
}
```

## Performance Considerations

### Optimization Strategies

1. **Database Queries**:
   - Indexed columns for fast lookups
   - Limit queries where possible
   - Batch operations when applicable

2. **React Optimization**:
   - Memoization opportunities identified
   - Lazy loading for screens
   - Optimized re-renders

3. **ML Processing**:
   - Currently lightweight (fake data)
   - Ready for async processing when real ML added
   - Performance monitoring in place

4. **Memory Management**:
   - Limited metrics storage (last 100)
   - Efficient data structures
   - Proper cleanup in components

## Testing Strategy

**Current Coverage**:
- Unit tests for scoring algorithms
- Unit tests for action generation
- Test utilities available

**Testing Patterns**:
- Jest for test framework
- TypeScript for type-safe tests
- Mock data for consistent results

## Security & Privacy

**Privacy Measures**:
- ✅ All processing on-device
- ✅ No network requests
- ✅ Local storage only
- ✅ User consent required
- ✅ Data export/delete available

**Security Considerations**:
- No sensitive data transmitted
- Local database encryption (SQLite)
- Permission-based access to camera/media

## Accessibility

**Features**:
- `reduceMotion`: Disables animations for motion sensitivity
- `highContrast`: High contrast mode (styling needed)
- Large tap targets
- Screen reader support (React Native default)

## Configuration

**Feature Flags** (`config/flags.ts`):
- `USE_FAKE_ML`: Enable/disable fake ML data
- Controls development vs production behavior

**Theme** (`config/theme.ts`):
- Centralized design tokens
- Colors, typography, spacing
- Consistent across components

## Future Architecture Considerations

### Planned Improvements

1. **Real ML Integration**:
   - MediaPipe Face Mesh integration
   - On-device model inference
   - Performance optimization

2. **Offline-First**:
   - Service worker for web version
   - Background sync when online
   - Conflict resolution

3. **Modular ML**:
   - Pluggable scoring algorithms
   - A/B testing framework
   - Customizable weights

4. **Analytics** (Privacy-Preserving):
   - On-device analytics only
   - No PII collection
   - Aggregate metrics

## Development Workflow

### Adding New Features

1. **Create Feature Branch**
2. **Update Types** (if needed)
3. **Implement Logic** (with tests)
4. **Add UI Components**
5. **Update Store** (if state needed)
6. **Add Documentation**
7. **Test & Lint**

### Code Style

- TypeScript strict mode
- Functional components
- Async/await for async code
- JSDoc comments for complex functions
- Consistent naming conventions

## Dependencies

**Core**:
- `expo`: Framework
- `react-native`: UI framework
- `zustand`: State management
- `expo-sqlite`: Database
- `react-native-reanimated`: Animations

**Development**:
- `typescript`: Type safety
- `jest`: Testing
- `@types/*`: Type definitions

## Build & Deployment

**Development**:
```bash
npm install
npx expo start
```

**Production**:
```bash
npx expo prebuild
npx expo run:ios  # or run:android
```

**EAS Build**:
- Configured for EAS Build
- iOS and Android builds
- OTA updates support

## Monitoring & Observability

**Logging**:
- Structured logs with context
- Log levels (DEBUG, INFO, WARN, ERROR)
- Scoped loggers per module

**Performance**:
- Operation timing
- Metric collection
- Slow operation detection
- Performance summaries

## Conclusion

MirrorMe follows a clean, modular architecture with clear separation of concerns. The codebase is designed for maintainability, testability, and scalability. The architecture supports both current functionality and future enhancements while maintaining strict privacy standards.

For specific implementation details, refer to:
- `PRODUCT_SPEC.md` - Product requirements
- `DATA_MODEL.md` - Database schema
- `ML_TECH_SPEC.md` - ML implementation details
- `UI_STYLEGUIDE.md` - Design system

