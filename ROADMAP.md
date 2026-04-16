# Music Player Roadmap

This file is the durable handoff for future work sessions. Use it with
`PROJECT_STATE.md` for current architecture and `CHANGELOG.md` for session history.

## Current State

- Project is early, but the product direction is now fixed.
- Build for both mobile and desktop, starting web-first and PWA-first.
- Local-first personal use is the target.

## Decisions To Preserve

- Build a local-first personal music player for your own library, with clean playback, playlists, search, and a strong mobile-friendly now-playing experience.
- Target both mobile and desktop, but start web-first and PWA-first.
- Optimize early UX for strong mobile playback while keeping desktop-friendly use in scope.
- Use a user-managed local library as the long-term library model.
- Desktop file and folder import is the main ingestion workflow.
- The app should read music files, extract embedded metadata when available, and build its own normalized library index.
- Treat embedded file metadata as the primary source of truth for v1.
- Defer full metadata editing for v1, while leaving room for app-level metadata overrides later.
- Do not treat streaming commercial catalogs, scraping, or cloud-hosted music as a project goal.
- Prioritize library import, playback, queue, playlists, browsing, and search before polish extras.
- Defer sync, accounts, recommendations, and cloud features unless real use proves they matter.
- Keep docs/tests updated in the same batch as code changes.

## Completed Milestones

- Initial project scaffold and documentation baseline.
- Library foundation baseline: import local files, normalize metadata, persist the library index, and render a usable track list.
- Playback foundation baseline: current-track state, transport controls, seek, and volume for session-imported files.

## Stronger V1 Goal

This project reaches its first major finish line when:

- A desktop user can import a real folder or file selection from their local music library into a persistent normalized library index.
- Imported tracks surface reliable title, artist, album, duration, and ordering data from embedded metadata when present, with sensible fallback parsing when metadata is incomplete.
- Playback supports dependable play/pause, seek, next/previous, queue progression, and volume on mobile and desktop browsers.
- Library browsing across tracks, albums, and artists is fast enough for daily use, and search is good enough to reach music quickly.
- Playlists, liked songs, and recently played are usable for normal personal listening.
- The now-playing experience works well on narrow mobile screens and does not feel like a desktop layout squeezed smaller.
- PWA behavior is good enough that the app feels installable and resilient for personal local use.
- Tests and docs are strong enough that future work is additive rather than a reset.

## Concrete Stronger V1 Milestone

Ship a web-first personal music player where you can import your own local music files on desktop, browse a normalized library, start playback immediately, manage a queue and basic playlists, search your collection, and use a mobile-friendly now-playing screen without needing any cloud account or streaming service.

## First Stronger V1 Plan

### Short Milestone Definition

Deliver a durable local library foundation: import desktop music files into a persistent normalized library model, render a usable track list, and keep the app positioned for playback and queue work on mobile and desktop browsers.

### Current Product Priority Order

1. **Library foundation**
   - Import local audio files and folders from a user-managed library.
   - Extract embedded metadata where available and normalize fallback metadata when it is not.
   - Persist a normalized local library index.
   - Render a usable track list for immediate playback.

2. **Playback foundation**
   - Play/pause.
   - Next/previous.
   - Seek.
   - Volume.
   - Current track state.

3. **Queue foundation**
   - Queue management.
   - Queue ordering and current queue index.
   - Basic repeat and shuffle decisions.

4. **Library browsing**
   - Tracks.
   - Albums.
   - Artists.
   - Mobile and desktop layout fit for daily use.

5. **Personal layer**
   - Liked songs.
   - Playlists.
   - Recently played.

### Implementation Milestones In Sequence

1. **Library foundation**
   - Import local files.
   - Normalize track metadata.
   - Store a usable library model.

2. **Playback foundation**
   - Introduce a real audio element and player state.
   - Support play/pause, next/previous, seek, and volume.

3. **Queue foundation**
   - Build queue state, queue order, queue index, and repeat/shuffle behavior.

4. **Library browsing**
   - Add tracks, albums, and artists views on top of the normalized library.

5. **Personal layer**
   - Add liked songs, playlists, and recently played on top of the core library and playback model.

### Very First Implementation Task

Build local file import plus normalized track-library rendering, then make that library model persist locally so later playback, queue, and browsing work builds on a stable base.

### Current Recommended Task

Build the first queue slice: explicit queue state, queue order, queue index, and basic repeat and shuffle decisions on top of the current playback foundation.

## Working Priority Model

Use this order when continuing from the roadmap:

1. Build the highest-value user-facing feature.
2. Only do architecture cleanup when it supports the touched area.
3. Update tests, docs, and cache metadata in the same pass.
4. Prefer small complete batches over broad unfinished work.

## Deferred By Choice

- Streaming backend
- Commercial streaming catalog support
- Scraping music sources
- Accounts
- Live sync
- Recommendation engine
- Social features
- Broad analytics
- Dedicated desktop wrapper by default
- Full metadata editing in v1

## Current Limitations To Keep In Mind

- No sync yet.
- No cloud library.
- Metadata quality depends on imported files and fallback parsing quality.
- Performance and storage constraints depend on how audio is handled.
