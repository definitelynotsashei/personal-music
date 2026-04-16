# Changelog

## 2026-04-16 - Tab Navigation Reliability Slice

### Features
- Synced the top-level Home, Library, Playlists, Now Playing, and Settings tabs to the URL hash and viewport reset so section changes behave like distinct app surfaces instead of inert one-page controls.
- Hardened the service worker to activate immediately and prefer fresh shell assets so cached installs are less likely to stay stuck on an older single-page shell.

### Documentation
- Documented the shell-reliability follow-through so future work preserves real section ownership instead of drifting back toward one overloaded page.

### Tests
- Expanded regression coverage for URL-backed section navigation and immediate-refresh service worker behavior.

## 2026-04-16 - Durable Folder Reconnect Slice

### Features
- Added a Settings-based library-folder reconnect flow for Chromium-style file access so saved tracks can regain playable local sources after reload without rebuilding the whole library.
- Tightened saved-library hydration so dead session `blob:` URLs are no longer treated as persisted playback sources across reloads.

### Documentation
- Advanced the roadmap and project state from the first durable file-access slice into the next follow-through work around broader reopening support.

### Tests
- Expanded regression coverage for the reconnect control, source-key matching helpers, and saved-library stripping of stale playback URLs.

## 2026-04-16 - Section Ownership Slice

### Features
- Tightened the tabbed shell so Home, Library, Playlists, Now Playing, and Settings own clearer responsibilities instead of behaving like one shared surface.
- Gave Playlists a selected-playlist detail area, narrowed Library search back to library browsing concerns, and moved current limitations into Settings.

### Documentation
- Documented the stronger section-ownership rule inside the app shell so future UI work does not drift back toward one overloaded page.

### Tests
- Expanded regression coverage for section-jump controls and dedicated playlist-detail surface markup.

## 2026-04-16 - App Shell Navigation Slice

### Features
- Reorganized the main app into top-level Home, Library, Playlists, Now Playing, and Settings views so the player no longer depends on one bloated page surface.

### Documentation
- Documented the tabbed app-shell structure as part of the current UI and product organization approach.

### Tests
- Expanded regression coverage for top-level app navigation shell controls.

## 2026-04-16 - PWA And Offline Polish Slice

### Features
- Added the first honest PWA/offline polish pass with a web app manifest, install prompt handling, cached shell assets, and clearer online/offline/install messaging around session-bound playback.

### Documentation
- Advanced the roadmap and project state from PWA/offline polish into the next durable file-access slice.

### Tests
- Expanded regression coverage for manifest and icon shell assets.

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
