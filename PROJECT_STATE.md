# Music Player - Project State Summary
_Last updated 2026-04-15. For context-sharing, not a coding reference._

---

## In Progress
Building the first real product feature: desktop-first local audio import with normalized metadata extraction and a usable library track list.

---

## Overview

A local-first personal music player intended for your own library, with a focus on playback, browsing, playlists, and personal daily use.

### Runtime snapshot
- Runtime starts with a simple `index.html` + `app.js` + `styles.css` structure.
- A minimal `service-worker.js` exists for future offline and cache work.
- Tests cover project-baseline file presence and core library-normalization helpers.

### Current product snapshot
- Product goal: a local-first personal music player for your own library, with clean playback, playlists, search, and a strong mobile-friendly now-playing experience.
- Platform strategy: target both mobile and desktop, but start web-first and PWA-first.
- Primary ingestion strategy: desktop file and folder import from a user-managed local library.
- Metadata strategy: embedded file metadata is the primary source of truth for v1; full metadata editing is deferred.
- Current v1 target: local library import, playback, queue, playlists, search, and mobile-friendly now-playing.
- Explicit non-goals for v1: streaming backend, commercial catalog support, scraping, accounts, live sync, recommendations, and social features.
- The current UI is moving from placeholder shell toward real library import and track browsing.

### Stronger v1 status
- Defined, but not reached yet.

### Stronger v1 milestone
- Import your own local music on desktop into a normalized library index.
- Browse tracks, albums, and artists with search that is good enough for daily use.
- Start playback immediately and use dependable queue controls on both desktop and mobile browsers.
- Use playlists, liked songs, and recently played without any account or cloud dependency.
- Use a mobile-friendly now-playing view that still feels intentional on desktop.

---

## Proposed Data Model

```js
const track = {
  id,
  title,
  artist,
  album,
  duration,
  src,
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
  playlists,
  likedTrackIds,
  recentTrackIds,
  importSummary
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
- Final file and storage approach is still to be decided.

---

## Maintenance Note

Every meaningful code change should update `CHANGELOG.md`, `PROJECT_STATE.md`, and `ROADMAP.md` in the same pass.
