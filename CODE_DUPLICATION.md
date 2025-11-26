# Code Duplication Analysis

## Overview

This document analyzes code duplication between the React Native app and the v2 web app, and explains architectural decisions regarding code sharing.

## Scoring Systems

### React Native (`ml/scoring.ts`)
- **Purpose**: Simple looksmax coaching scoring
- **Categories**: 4 subscores (posture, symmetry, skin, hair)
- **Input**: Face landmarks (468 points)
- **Output**: Overall score (0-100) + 4 subscores
- **Use Case**: Daily coaching tips and progress tracking
- **Language**: TypeScript

### Web v2 (`v2/src/features/scan/scoring.js`)
- **Purpose**: Advanced SMV (Sexual Market Value) analysis
- **Categories**: 6 detailed metrics (facial balance, eye aesthetics, zygomatic profile, midface harmony, jaw structure, soft tissue)
- **Input**: Image blob (uses seed-based generation)
- **Output**: Overall score + SMV score + tier labels + feature flags
- **Use Case**: Detailed looksmax analysis with tier system
- **Language**: JavaScript

### Decision: Keep Separate
These systems serve fundamentally different purposes:
- React Native: Simple, privacy-first mobile coaching app
- Web v2: Advanced analysis tool with detailed metrics

**Rationale**: 
- Different target audiences
- Different complexity levels
- Different input/output formats
- Consolidation would add unnecessary complexity to the mobile app

## State Management

### React Native (`state/useStore.ts`)
- **Library**: Zustand
- **Storage**: SQLite (native) / AsyncStorage (web fallback)
- **Structure**: Flat state with async actions
- **Features**: Scans, plan items, badges, settings

### Web v2 (`v2/src/store/useStore.js`)
- **Library**: Zustand
- **Storage**: Dexie (IndexedDB)
- **Structure**: Similar but with user authentication
- **Features**: Scans, user management, preferences, stats

### Decision: Keep Separate
While both use Zustand, they have different:
- Database backends (SQLite vs IndexedDB)
- Authentication requirements (web has users, mobile doesn't)
- Data models (mobile has plan_items, web has different structure)

**Rationale**:
- Platform-specific optimizations needed
- Different feature sets
- Shared patterns documented in ARCHITECTURE.md

## Shared Code Opportunities

### Constants
- ✅ **Created**: `ml/constants.ts` - Extracted magic numbers from scoring
- **Future**: Could share constants if both systems converge

### Utilities
- ✅ **Created**: `utils/logger.ts` - Logging system (can be used by both)
- ✅ **Created**: `utils/performance.ts` - Performance monitoring (can be used by both)

### Types/Interfaces
- Currently separate, but could share if interfaces align
- React Native uses TypeScript, v2 uses JavaScript (no types)

## Recommendations

1. **Keep scoring systems separate** - They serve different purposes
2. **Share utilities** - Logger and performance monitoring can be shared
3. **Document differences** - This document serves that purpose
4. **Consider shared types** - If v2 migrates to TypeScript, consider shared type definitions

## Code Metrics

- **React Native Codebase**: ~2000 lines (TypeScript)
- **Web v2 Codebase**: ~1500 lines (JavaScript)
- **Shared Utilities**: ~300 lines
- **Duplication Level**: Low (~5% actual duplication, mostly patterns)

## Conclusion

The codebases are intentionally separate due to different platforms, purposes, and complexity levels. The small amount of duplication is acceptable and serves platform-specific needs. Shared utilities (logging, performance) have been extracted and can be used by both codebases.

