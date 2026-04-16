# Music Player - Project State Summary
_Last updated 2026-04-16. For context-sharing, not a coding reference._

---

## In Progress
Starting the next PWA/offline polish slice: improving installability and baseline offline resilience for the core app shell.

---

## Overview

A local-first personal music player intended for your own library, with a focus on playback, browsing, playlists, and personal daily use.

### Runtime snapshot
- Runtime starts with a simple `index.html` + `app.js` + `styles.css` structure.
- A minimal `service-worker.js` exists for future offline and cache work.
- The app can import local audio files in-browser and render a normalized track list.
- Library data is persisted locally in browser storage so reloads keep the current imported library model.
- Playback works for tracks imported in the current browser session, with session-local file access as the current source model.
- Queue behavior works with explicit queue order instead of only the library sort order.
- Library browsing works across tracks, albums, and artists instead of a single flat list.
- The personal layer now includes persistent liked songs, playlists, and recently played history.
- The first search slice now supports ranked library search across tracks, albums, artists, playlists, and liked music.
- The current UI direction is a cozy late-night listening-den aesthetic with muted earthy tones, soft glass panels, hand-drawn iconography, a sticky bottom player bar, calm motion, and a mobile-expanded now-playing room.
- Tests cover project-baseline file presence and core library-normalization and storage helpers.

### Current product snapshot
- Product goal: a local-first personal music player for your own library, with clean playback, playlists, search, and a strong mobile-friendly now-playing experience.
- Platform strategy: target both mobile and desktop, but start web-first and PWA-first.
- Primary ingestion strategy: desktop file and folder import from a user-managed local library.
- Metadata strategy: embedded file metadata is the primary source of truth for v1; full metadata editing is deferred.
- Current v1 target: local library import, playback, queue, playlists, search, and mobile-friendly now-playing.
- Explicit non-goals for v1: streaming backend, commercial catalog support, scraping, accounts, live sync, recommendations, and social features.
- The current UI is moving toward a cozy, readable, low-stress player surface rather than a bright utility dashboard.

### Stronger v1 status
- Defined, but not reached yet.

### Stronger v1 milestone
- Import your own local music on desktop into a normalized library index.
- Browse tracks, albums, and artists with search that is good enough for daily use.
- Start playback immediately and use dependable queue controls on both desktop and mobile browsers.
- Use playlists, liked songs, and recently played without any account or cloud dependency.
- Use a mobile-friendly now-playing view that still feels intentional on desktop.

### Current milestone sequence
1. Library foundation.
2. Playback foundation.
3. Queue foundation.
4. Library browsing.
5. Personal layer.

### Current recommended next task
- Improve the next PWA/offline polish slice so the app shell feels more installable and resilient.

---

## Proposed Data Model

```js
const track = {
  id,
  title,
  artist,
  album,
  duration,
  src, // session-local object URL for current imported files
  artwork,
  trackNumber,
  discNumber,
  year,
  genre
};

const playlist = {
  id,
  name,
  trackIds,
  createdAt,
  updatedAt
};

const playerState = {
  currentTrackId,
  queue,
  queueIndex,
  paused,
  currentTime,
  volume,
  repeatMode, // off | one | all
  shuffle
};

const libraryState = {
  tracks,
  importSummary,
  lastImportedAt,
  playlists,
  likedTrackIds,
  recentTrackIds
};
```

## Known Quirks / Limitations

- No sync.
- No cloud library.
- No streaming catalog.
- Dedicated desktop wrapper is intentionally deferred.
- Metadata import quality may vary.
- Embedded metadata is primary, but fallback parsing is still required for incomplete files.
- Full metadata editing is out of scope for the initial v1.
- Audio file handles and richer persistent access are still to be designed beyond the initial imported library index.
- Persisted library metadata survives reloads, but playback sources currently require session-local imports until durable file access is added.
- Queue state is currently session-local and will not survive reloads until player-state persistence is added deliberately.
- Search is now present, and mobile now-playing is stronger on narrow screens, but PWA/offline polish is still needed for a stronger installable feel.

---

## Maintenance Note

Every meaningful code change should update `CHANGELOG.md`, `PROJECT_STATE.md`, and `ROADMAP.md` in the same pass.
