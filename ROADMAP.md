# Music Player Roadmap

This file is the durable handoff for future work sessions. Use it with
`PROJECT_STATE.md` for current architecture and `CHANGELOG.md` for session history.

## Current State

- Project is new.
- No stable runtime or feature set is established yet.
- Local-first personal use is the target.

## Decisions To Preserve

- Build a local-first personal music player for your own library.
- Do not treat streaming commercial catalogs as a project goal.
- Prioritize playback, queue, playlists, and browsing before polish extras.
- Defer sync, accounts, recommendations, and cloud features unless real use proves they matter.
- Keep docs/tests updated in the same batch as code changes.

## Completed Milestones

- Initial project scaffold and documentation baseline.

## Stronger V1 Goal

This project reaches its first major finish line when:

- Local library import is stable enough for real use.
- Playback works reliably.
- Queue and playlists are usable.
- Search and browsing are good enough for daily use.
- Mobile or narrow-screen now-playing use is acceptable.
- The app has basic regression coverage and durable docs.
- Remaining work is optional polish or future expansion, not missing core identity.

## Working Priority Model

Use this order when continuing from the roadmap:

1. Build the highest-value user-facing feature.
2. Only do architecture cleanup when it supports the touched area.
3. Update tests, docs, and cache metadata in the same pass.
4. Prefer small complete batches over broad unfinished work.

## Current Product Priority Order

1. **Library foundation**
   - Import local audio files.
   - Normalize basic metadata.
   - Render a usable track list.

2. **Playback foundation**
   - Play/pause.
   - Next/previous.
   - Seek.
   - Volume.
   - Queue.

3. **Library navigation**
   - Browse by tracks.
   - Browse by albums.
   - Browse by artists.

4. **Personal-use layer**
   - Liked songs.
   - Playlists.
   - Recently played.

5. **Usability polish**
   - Search.
   - Keyboard shortcuts.
   - Mobile-friendly now-playing.
   - Basic PWA/offline polish if useful.

## Deferred By Choice

- Streaming backend
- Accounts
- Live sync
- Recommendations
- Social features
- Broad analytics
- Cloud hosting by default

## Current Limitations To Keep In Mind

- No sync yet.
- No cloud library.
- Metadata quality depends on imported files.
- Performance and storage constraints depend on how audio is handled.
