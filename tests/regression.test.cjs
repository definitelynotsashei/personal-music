const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const ROOT = path.resolve(__dirname, '..');

test('core project files exist', () => {
  [
    'AGENTS.md',
    'ROADMAP.md',
    'PROJECT_STATE.md',
    'CHANGELOG.md',
    'index.html',
    'app.js',
    'manifest.json',
    'src/library.js',
    'styles.css',
    'service-worker.js',
    'package.json'
  ].forEach(file => {
    assert.equal(
      fs.existsSync(path.join(ROOT, file)),
      true,
      `${file} should exist`
    );
  });
});

test('mobile now-playing controls exist in the app shell', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

  assert.match(html, /id="player-panel"/);
  assert.match(html, /id="open-expanded-player"/);
  assert.match(html, /id="expand-player-button"/);
  assert.match(html, /id="close-expanded-player"/);
});

test('top-level app navigation tabs exist in the shell', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

  assert.match(html, /data-section="home"/);
  assert.match(html, /data-section="library"/);
  assert.match(html, /data-section="playlists"/);
  assert.match(html, /data-section="now-playing"/);
  assert.match(html, /data-section="settings"/);
});

test('home shortcuts and playlist detail surfaces exist', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

  assert.match(html, /data-target-section="library"/);
  assert.match(html, /data-target-section="playlists"/);
  assert.match(html, /data-target-section="settings"/);
  assert.match(html, /id="playlist-detail-panel"/);
  assert.match(html, /id="playlist-track-list"/);
});

test('settings includes a reconnect library folder control', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

  assert.match(html, /id="reconnect-library-folder"/);
});

test('import status lives outside the home tab shell', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

  assert.match(html, /<\/main>\s*<p id="import-status" class="status shell-status"/);
});

test('app shell syncs sections with the URL hash', () => {
  const script = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');

  assert.match(script, /window\.addEventListener\('hashchange'/);
  assert.match(script, /window\.history\.replaceState/);
  assert.match(script, /window\.location\.hash\.slice\(1\)/);
});

test('now playing uses an overlay path on compact screens', () => {
  const script = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');

  assert.match(script, /normalizedSection === 'now-playing' && state\.compactPlayerMode/);
  assert.match(script, /state\.appSection = normalizeAppSection\(state\.lastNonPlayerSection \|\| 'home'\)/);
  assert.match(script, /function openExpandedPlayer\(\) {\s*setAppSection\('now-playing'\);/s);
});

test('playlist controls remain available without imported tracks', () => {
  const script = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');

  assert.match(script, /const showControls = state\.appSection === 'playlists';/);
});

test('library rendering is guarded to library and playlists tabs', () => {
  const script = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');

  assert.match(script, /if \(state\.appSection === 'playlists'\) {\s*renderPlaylistsView\(\);\s*return;\s*}/s);
  assert.match(script, /if \(state\.appSection !== 'library'\) {\s*return;\s*}/s);
});

test('service worker prefers fresh shell assets and activates immediately', () => {
  const script = fs.readFileSync(path.join(ROOT, 'service-worker.js'), 'utf8');

  assert.match(script, /self\.skipWaiting\(\)/);
  assert.match(script, /self\.clients\.claim\(\)/);
  assert.match(script, /cache\.put\(event\.request, response\.clone\(\)\)/);
});

test('pwa shell assets exist', () => {
  [
    'manifest.json',
    path.join('icons', 'icon-192.svg'),
    path.join('icons', 'icon-512.svg')
  ].forEach(file => {
    assert.equal(
      fs.existsSync(path.join(ROOT, file)),
      true,
      `${file} should exist`
    );
  });
});

test('filename parsing extracts fallback artist and title data', async () => {
  const moduleUrl = pathToFileURL(path.join(ROOT, 'src', 'library.js')).href;
  const { parseFilenameMetadata } = await import(moduleUrl);

  assert.deepEqual(parseFilenameMetadata('01 - Nujabes - Feather.mp3'), {
    title: 'Feather',
    artist: 'Nujabes',
    album: 'Unknown Album',
    trackNumber: 1
  });
});

test('id3 parsing reads embedded mp3 text frames', async () => {
  const moduleUrl = pathToFileURL(path.join(ROOT, 'src', 'library.js')).href;
  const { parseId3v2Metadata } = await import(moduleUrl);

  const createTextFrame = (frameId, text) => {
    const payload = Buffer.concat([Buffer.from([3]), Buffer.from(text, 'utf8')]);
    const size = Buffer.from([
      (payload.length >>> 24) & 0xff,
      (payload.length >>> 16) & 0xff,
      (payload.length >>> 8) & 0xff,
      payload.length & 0xff
    ]);
    return Buffer.concat([Buffer.from(frameId, 'ascii'), size, Buffer.from([0, 0]), payload]);
  };

  const frames = Buffer.concat([
    createTextFrame('TIT2', 'Feather'),
    createTextFrame('TPE1', 'Nujabes'),
    createTextFrame('TALB', 'Modal Soul'),
    createTextFrame('TRCK', '01/15')
  ]);

  const tagSize = frames.length;
  const header = Buffer.from([
    0x49,
    0x44,
    0x33,
    0x03,
    0x00,
    0x00,
    (tagSize >> 21) & 0x7f,
    (tagSize >> 14) & 0x7f,
    (tagSize >> 7) & 0x7f,
    tagSize & 0x7f
  ]);

  const metadata = parseId3v2Metadata(new Uint8Array(Buffer.concat([header, frames])));

  assert.equal(metadata.title, 'Feather');
  assert.equal(metadata.artist, 'Nujabes');
  assert.equal(metadata.album, 'Modal Soul');
  assert.equal(metadata.trackNumber, 1);
});

test('normalized tracks prefer embedded metadata over filename fallback', async () => {
  const moduleUrl = pathToFileURL(path.join(ROOT, 'src', 'library.js')).href;
  const { normalizeImportedTrack } = await import(moduleUrl);

  const file = {
    name: '01 - Wrong Artist - Wrong Title.mp3',
    size: 42,
    lastModified: 10,
    webkitRelativePath: 'Albums/Example/01 - Wrong Artist - Wrong Title.mp3'
  };

  const track = normalizeImportedTrack(file, {
    title: 'Real Title',
    artist: 'Real Artist',
    album: 'Real Album',
    trackNumber: 3,
    year: '2020'
  });

  assert.equal(track.title, 'Real Title');
  assert.equal(track.artist, 'Real Artist');
  assert.equal(track.album, 'Real Album');
  assert.equal(track.trackNumber, 3);
  assert.equal(track.relativePath, 'Albums/Example/01 - Wrong Artist - Wrong Title.mp3');
});

test('library snapshots store normalized tracks and summary metadata', async () => {
  const moduleUrl = pathToFileURL(path.join(ROOT, 'src', 'library.js')).href;
  const { createLibrarySnapshot } = await import(moduleUrl);

  const snapshot = createLibrarySnapshot([
    {
      id: 'track-1',
      title: 'Feather',
      artist: 'Nujabes',
      album: 'Modal Soul',
      trackNumber: 1,
      year: '2005',
      genre: 'Hip-Hop',
      src: '',
      duration: 204,
      filename: '01 - Feather.mp3',
      relativePath: 'Modal Soul/01 - Feather.mp3',
      size: 123,
      lastModified: 456
    }
  ], ['track-1'], [
    {
      id: 'playlist:night-mix:1',
      name: 'Night Mix',
      trackIds: ['track-1', 'missing'],
      createdAt: '2026-04-16T00:00:00.000Z',
      updatedAt: '2026-04-16T00:00:00.000Z'
    }
  ], ['track-1']);

  assert.equal(snapshot.version, 4);
  assert.equal(snapshot.importSummary.trackCount, 1);
  assert.equal(snapshot.importSummary.artistCount, 1);
  assert.equal(snapshot.tracks[0].title, 'Feather');
  assert.equal(snapshot.tracks[0].src, '');
  assert.deepEqual(snapshot.likedTrackIds, ['track-1']);
  assert.equal(snapshot.playlists.length, 1);
  assert.deepEqual(snapshot.playlists[0].trackIds, ['track-1']);
  assert.deepEqual(snapshot.recentTrackIds, ['track-1']);
  assert.equal(typeof snapshot.savedAt, 'string');
});

test('stored library parsing hydrates valid snapshots and rejects invalid ones', async () => {
  const moduleUrl = pathToFileURL(path.join(ROOT, 'src', 'library.js')).href;
  const { parseStoredLibrary } = await import(moduleUrl);

  const valid = parseStoredLibrary(JSON.stringify({
    version: 1,
    savedAt: '2026-04-16T00:00:00.000Z',
    tracks: [
      {
        id: 'track-1',
        title: 'Feather',
        artist: 'Nujabes',
        album: 'Modal Soul',
        trackNumber: 1,
        duration: 204,
        filename: '01 - Feather.mp3',
        relativePath: 'Modal Soul/01 - Feather.mp3',
        size: 123,
        lastModified: 456
      }
    ]
  }));

  assert.equal(valid.tracks.length, 1);
  assert.equal(valid.importSummary.trackCount, 1);
  assert.equal(valid.tracks[0].src, '');
  assert.deepEqual(valid.likedTrackIds, []);
  assert.equal(valid.savedAt, '2026-04-16T00:00:00.000Z');

  const invalid = parseStoredLibrary('{not valid json');
  assert.equal(invalid.tracks.length, 0);
  assert.equal(invalid.importSummary.trackCount, 0);
  assert.deepEqual(invalid.likedTrackIds, []);
});

test('recent track normalization removes duplicates and invalid ids', async () => {
  const moduleUrl = pathToFileURL(path.join(ROOT, 'src', 'library.js')).href;
  const { normalizeRecentTrackIds } = await import(moduleUrl);

  const recentIds = normalizeRecentTrackIds(
    ['track-2', 'track-1', 'track-2', 'missing'],
    [{ id: 'track-1' }, { id: 'track-2' }]
  );

  assert.deepEqual(recentIds, ['track-2', 'track-1']);
});

test('playlist normalization removes invalid tracks and empty names', async () => {
  const moduleUrl = pathToFileURL(path.join(ROOT, 'src', 'library.js')).href;
  const { normalizePlaylists } = await import(moduleUrl);

  const playlists = normalizePlaylists(
    [
      {
        id: 'playlist:late-night:1',
        name: 'Late Night',
        trackIds: ['track-2', 'missing', 'track-2', 'track-1'],
        createdAt: '2026-04-16T00:00:00.000Z',
        updatedAt: '2026-04-16T01:00:00.000Z'
      },
      {
        id: '',
        name: '   ',
        trackIds: ['track-1']
      }
    ],
    [{ id: 'track-1' }, { id: 'track-2' }]
  );

  assert.equal(playlists.length, 1);
  assert.equal(playlists[0].name, 'Late Night');
  assert.deepEqual(playlists[0].trackIds, ['track-2', 'track-1']);
  assert.equal(playlists[0].updatedAt, '2026-04-16T01:00:00.000Z');
});

test('stored library parsing hydrates playlists from current snapshots', async () => {
  const moduleUrl = pathToFileURL(path.join(ROOT, 'src', 'library.js')).href;
  const { parseStoredLibrary } = await import(moduleUrl);

  const parsed = parseStoredLibrary(JSON.stringify({
    version: 4,
    savedAt: '2026-04-16T00:00:00.000Z',
    likedTrackIds: ['track-1'],
    recentTrackIds: ['track-1', 'missing'],
    playlists: [
      {
        id: 'playlist:focus:1',
        name: 'Focus',
        trackIds: ['track-1', 'missing'],
        createdAt: '2026-04-16T00:00:00.000Z',
        updatedAt: '2026-04-16T02:00:00.000Z'
      }
    ],
    tracks: [
      {
        id: 'track-1',
        title: 'Feather',
        artist: 'Nujabes',
        album: 'Modal Soul',
        trackNumber: 1,
        duration: 204,
        filename: '01 - Feather.mp3',
        relativePath: 'Modal Soul/01 - Feather.mp3',
        size: 123,
        lastModified: 456
      }
    ]
  }));

  assert.equal(parsed.playlists.length, 1);
  assert.equal(parsed.playlists[0].name, 'Focus');
  assert.deepEqual(parsed.playlists[0].trackIds, ['track-1']);
  assert.deepEqual(parsed.likedTrackIds, ['track-1']);
  assert.deepEqual(parsed.recentTrackIds, ['track-1']);
});

test('track source keys prefer relative paths and fall back to file metadata', async () => {
  const moduleUrl = pathToFileURL(path.join(ROOT, 'src', 'library.js')).href;
  const { getTrackSourceKey } = await import(moduleUrl);

  assert.equal(
    getTrackSourceKey({
      filename: '01 - Feather.mp3',
      relativePath: 'Modal Soul/01 - Feather.mp3',
      size: 123,
      lastModified: 456
    }),
    'path:modal soul/01 - feather.mp3'
  );

  assert.equal(
    getTrackSourceKey({
      filename: '01 - Feather.mp3',
      size: 123,
      lastModified: 456
    }),
    'file:01 - feather.mp3:123:456'
  );
});

test('library search ranks title matches and playlist matches', async () => {
  const moduleUrl = pathToFileURL(path.join(ROOT, 'src', 'library.js')).href;
  const { searchLibrary } = await import(moduleUrl);

  const tracks = [
    {
      id: 'track-1',
      title: 'Feather',
      artist: 'Nujabes',
      album: 'Modal Soul',
      filename: '01 - Feather.mp3',
      relativePath: 'Modal Soul/01 - Feather.mp3',
      duration: 204,
      trackNumber: 1
    },
    {
      id: 'track-2',
      title: 'Luv(sic)',
      artist: 'Nujabes',
      album: 'Modal Soul',
      filename: '02 - Luv(sic).mp3',
      relativePath: 'Modal Soul/02 - Luv(sic).mp3',
      duration: 210,
      trackNumber: 2
    }
  ];

  const results = searchLibrary(
    tracks,
    [
      {
        id: 'playlist:night:1',
        name: 'Feather Focus',
        trackIds: ['track-1']
      }
    ],
    ['track-1'],
    'feather'
  );

  assert.equal(results.tracks[0].id, 'track-1');
  assert.equal(results.tracks[0].liked, true);
  assert.equal(results.playlists[0].id, 'playlist:night:1');
  assert.equal(results.albums[0].title, 'Modal Soul');
  assert.equal(results.artists[0].name, 'Nujabes');
});

test('adjacent track lookup follows library order bounds', async () => {
  const moduleUrl = pathToFileURL(path.join(ROOT, 'src', 'library.js')).href;
  const { getAdjacentTrackId } = await import(moduleUrl);

  const tracks = [
    { id: 'track-1' },
    { id: 'track-2' },
    { id: 'track-3' }
  ];

  assert.equal(getAdjacentTrackId(tracks, 'track-2', -1), 'track-1');
  assert.equal(getAdjacentTrackId(tracks, 'track-2', 1), 'track-3');
  assert.equal(getAdjacentTrackId(tracks, 'track-1', -1), null);
  assert.equal(getAdjacentTrackId(tracks, 'missing', 1), 'track-1');
});

test('playability depends on a session playback source', async () => {
  const moduleUrl = pathToFileURL(path.join(ROOT, 'src', 'library.js')).href;
  const { canPlayTrack } = await import(moduleUrl);

  assert.equal(canPlayTrack({ src: 'blob:session-audio' }), true);
  assert.equal(canPlayTrack({ src: '' }), false);
  assert.equal(canPlayTrack(null), false);
});

test('default queue and queue indexing follow track ids', async () => {
  const moduleUrl = pathToFileURL(path.join(ROOT, 'src', 'library.js')).href;
  const { createDefaultQueue, getQueueIndex } = await import(moduleUrl);

  const queue = createDefaultQueue([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);

  assert.deepEqual(queue, ['a', 'b', 'c']);
  assert.equal(getQueueIndex(queue, 'b'), 1);
  assert.equal(getQueueIndex(queue, 'missing'), -1);
});

test('insert after current keeps uniqueness and places track next', async () => {
  const moduleUrl = pathToFileURL(path.join(ROOT, 'src', 'library.js')).href;
  const { insertAfterCurrent } = await import(moduleUrl);

  assert.deepEqual(
    insertAfterCurrent(['a', 'b', 'c', 'd'], 1, 'd'),
    ['a', 'b', 'd', 'c']
  );

  assert.deepEqual(
    insertAfterCurrent(['a', 'b'], -1, 'b'),
    ['b', 'a']
  );
});

test('next queue index respects repeat mode', async () => {
  const moduleUrl = pathToFileURL(path.join(ROOT, 'src', 'library.js')).href;
  const { getNextQueueIndex } = await import(moduleUrl);

  assert.equal(getNextQueueIndex(3, 0, 'off'), 1);
  assert.equal(getNextQueueIndex(3, 2, 'off'), -1);
  assert.equal(getNextQueueIndex(3, 2, 'all'), 0);
  assert.equal(getNextQueueIndex(3, 1, 'one'), 1);
});

test('album grouping collects tracks and durations by artist-album', async () => {
  const moduleUrl = pathToFileURL(path.join(ROOT, 'src', 'library.js')).href;
  const { groupTracksByAlbum } = await import(moduleUrl);

  const groups = groupTracksByAlbum([
    { id: 'a', title: 'Track 2', artist: 'Artist', album: 'Album', trackNumber: 2, duration: 120 },
    { id: 'b', title: 'Track 1', artist: 'Artist', album: 'Album', trackNumber: 1, duration: 100 },
    { id: 'c', title: 'Elsewhere', artist: 'Another', album: 'Other', trackNumber: 1, duration: 90 }
  ]);

  assert.equal(groups.length, 2);
  assert.equal(groups[1].title, 'Album');
  assert.equal(groups[1].trackCount, 2);
  assert.equal(groups[1].totalDuration, 220);
  assert.deepEqual(groups[1].tracks.map(track => track.title), ['Track 1', 'Track 2']);
});

test('artist grouping summarizes album and track counts', async () => {
  const moduleUrl = pathToFileURL(path.join(ROOT, 'src', 'library.js')).href;
  const { groupTracksByArtist } = await import(moduleUrl);

  const groups = groupTracksByArtist([
    { artist: 'Artist', album: 'One', duration: 100 },
    { artist: 'Artist', album: 'Two', duration: 110 },
    { artist: 'Artist', album: 'Two', duration: 120 },
    { artist: 'Other', album: 'Elsewhere', duration: 90 }
  ]);

  assert.equal(groups.length, 2);
  assert.equal(groups[0].name, 'Artist');
  assert.equal(groups[0].albumCount, 2);
  assert.equal(groups[0].trackCount, 3);
  assert.equal(groups[0].totalDuration, 330);
});

test('liked track normalization removes duplicates and unknown ids', async () => {
  const moduleUrl = pathToFileURL(path.join(ROOT, 'src', 'library.js')).href;
  const { normalizeLikedTrackIds } = await import(moduleUrl);

  const likedIds = normalizeLikedTrackIds(
    ['track-1', 'track-2', 'track-1', 'missing'],
    [{ id: 'track-1' }, { id: 'track-2' }]
  );

  assert.deepEqual(likedIds, ['track-1', 'track-2']);
});
