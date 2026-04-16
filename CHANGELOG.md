# Changelog

## 2026-04-16 - Mobile Now-Playing Polish Slice

### Features
- Tightened narrow-screen playback UX by turning the full player into a mobile-expanded listening room with explicit open and close controls from the sticky bar.

### Documentation
- Advanced the roadmap and project state from mobile now-playing polish into the next PWA/offline slice.

### Tests
- Expanded regression coverage to confirm the mobile now-playing controls are present in the app shell.

## 2026-04-16 - Search Slice

### Features
- Added the first ranked library-search slice with a shared search field and cross-library results for tracks, albums, artists, playlists, and liked music.

### Documentation
- Advanced the roadmap and project state from search into the next mobile-now-playing slice.

### Tests
- Expanded regression coverage for search ranking and cross-library search results.

## 2026-04-16 - Listening Den UI Pass

### Features
- Redesigned the player into a cozy late-night listening den with hand-drawn SVG transport icons, a sticky frosted-glass bottom player bar, deeper active-track styling, ambient hero waveform decoration, and richer album-art fallback visuals.

### Documentation
- Refined the documented UI direction around the sticky player bar, softer iconography, and warmer glassmorphism presentation.

## 2026-04-16 - Recently Played Slice

### Features
- Added persistent recently played history with a dedicated recent-library view driven by playback activity.

### Documentation
- Advanced the roadmap and project state from playlists to the first search slice.

### Tests
- Expanded regression coverage for recent-history normalization and storage hydration.

## 2026-04-16 - Playlists Slice

### Features
- Added the next personal-layer slice with persistent playlists, playlist creation, track assignment, and a dedicated playlist-library view.

### Documentation
- Advanced the roadmap and project state within the personal layer from liked songs into playlists.

### Tests
- Expanded regression coverage for playlist normalization and storage hydration.

## 2026-04-16 - Liked Songs Slice

### Features
- Added the first personal-layer slice with persistent liked songs, like toggles, and a dedicated liked-library view.

### Documentation
- Advanced the roadmap and project state from library browsing into the personal layer.

### Tests
- Expanded regression coverage for liked-song storage hydration and normalization.

## 2026-04-16 - Library Browsing Slice

### Features
- Added the first library-browsing slice with Tracks, Albums, and Artists views on top of the normalized library.

### Documentation
- Advanced the roadmap and project state from queue foundation into library browsing.

### Tests
- Expanded regression coverage for album and artist grouping helpers.

## 2026-04-16 - Cozy Lo-Fi UI Pass

### Features
- Restyled the player interface with a cozy lo-fi visual direction, centered album artwork, softer controls, ambient overlays, and calmer motion while keeping the current functionality intact.

### Documentation
- Documented the established UI direction in the roadmap and project state.

## 2026-04-16 - Queue Foundation Slice

### Features
- Added the first queue foundation slice with explicit queue state, queue order, queue index, and basic repeat and shuffle behavior.

### Documentation
- Advanced the roadmap and project state from playback foundation into queue foundation.

### Tests
- Expanded regression coverage for queue-related helper behavior.

## 2026-04-16 - Playback Foundation Slice

### Features
- Added the first playback foundation slice with current-track state, transport controls, seek, and volume for tracks imported in the current browser session.

### Documentation
- Advanced the roadmap and project state from library foundation into playback foundation.

### Tests
- Expanded regression coverage for playback-related helper behavior.

## 2026-04-16 - Stronger V1 Plan And Persistent Library Model

### Features
- Persisted the normalized imported library model locally so the first library-foundation milestone survives reloads.
- Added a local library reset path for replacing or clearing the imported index during early development.

### Documentation
- Added the first concrete stronger-v1 milestone plan, implementation milestone sequence, and current recommended next task.

### Tests
- Expanded regression coverage for local library storage serialization and hydration helpers.

## 2026-04-15 - Product Direction And Library Import Baseline

### Features
- Added the first real library foundation feature: desktop-first local audio import with normalized metadata extraction and a usable track list.

### Documentation
- Locked in the product goal, platform strategy, ingestion strategy, metadata strategy, explicit v1 non-goals, stronger-v1 milestone, and product priority order.

### Tests
- Expanded regression coverage to validate library metadata normalization helpers.

## 2026-04-15 - Initial Setup

### Features
- Added the initial app shell with a placeholder music-player layout.
- Added a minimal service worker baseline for future cache work.

### Documentation
- Added `AGENTS.md`, `ROADMAP.md`, `PROJECT_STATE.md`, and `CHANGELOG.md`.

### Tests
- Added initial regression coverage for required project files.
