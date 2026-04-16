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
  ]);

  assert.equal(snapshot.version, 1);
  assert.equal(snapshot.importSummary.trackCount, 1);
  assert.equal(snapshot.importSummary.artistCount, 1);
  assert.equal(snapshot.tracks[0].title, 'Feather');
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
  assert.equal(valid.savedAt, '2026-04-16T00:00:00.000Z');

  const invalid = parseStoredLibrary('{not valid json');
  assert.equal(invalid.tracks.length, 0);
  assert.equal(invalid.importSummary.trackCount, 0);
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
