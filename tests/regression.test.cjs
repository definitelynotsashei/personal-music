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
