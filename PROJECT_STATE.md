# Music Player - Project State Summary
_Last updated 2026-04-15. For context-sharing, not a coding reference._

---

## In Progress
Initial scaffold is in place. No product feature is currently marked as in progress.

---

## Overview

A local-first personal music player intended for your own library, with a focus on playback, browsing, playlists, and personal daily use.

### Runtime snapshot
- Runtime starts with a simple `index.html` + `app.js` + `styles.css` structure.
- A minimal `service-worker.js` exists for future offline and cache work.
- Tests currently cover project-baseline file presence.

### Current product snapshot
- Project goal: a personal music player similar in UX spirit to Spotify, but for your own library and personal use.
- Current v1 target: local library import, playback, queue, playlists, search, and mobile-friendly now-playing.
- Explicit non-goals for v1: streaming backend, accounts, live sync, recommendations, social features.
- The current UI is a placeholder shell rather than a real music workflow.

### Stronger v1 status
- Not reached yet.

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
  recentTrackIds
};
```

## Known Quirks / Limitations

- No sync.
- No cloud library.
- No streaming catalog.
- Metadata import quality may vary.
- Final file and storage approach is still to be decided.

---

## Maintenance Note

Every meaningful code change should update `CHANGELOG.md`, `PROJECT_STATE.md`, and `ROADMAP.md` in the same pass.
