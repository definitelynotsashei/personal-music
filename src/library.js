const SUPPORTED_AUDIO_EXTENSIONS = new Set([
  'mp3',
  'm4a',
  'aac',
  'flac',
  'ogg',
  'oga',
  'wav',
  'opus'
]);

const LIBRARY_STORAGE_KEY = 'personal-music-player.library.v3';

function getFileExtension(filename = '') {
  const normalized = String(filename).toLowerCase();
  const lastDot = normalized.lastIndexOf('.');
  return lastDot >= 0 ? normalized.slice(lastDot + 1) : '';
}

function sanitizeText(value) {
  return String(value ?? '')
    .replace(/\0/g, '')
    .trim();
}

function titleizeToken(value) {
  const cleaned = sanitizeText(value).replace(/[_]+/g, ' ');
  return cleaned.replace(/\b([a-z])/g, character => character.toUpperCase());
}

function parseNumericPrefix(value) {
  const match = String(value ?? '').match(/^(\d{1,3})/);
  return match ? Number(match[1]) : null;
}

function createTrackId(file) {
  return [
    sanitizeText(file.name),
    Number(file.size || 0),
    Number(file.lastModified || 0)
  ].join(':');
}

function isSupportedAudioFile(file) {
  if (!file || !file.name) {
    return false;
  }

  const extension = getFileExtension(file.name);
  return (
    SUPPORTED_AUDIO_EXTENSIONS.has(extension) ||
    String(file.type || '').startsWith('audio/')
  );
}

function parseFilenameMetadata(filename) {
  const basename = sanitizeText(filename).replace(/\.[^.]+$/, '');
  const normalized = basename.replace(/\s+/g, ' ').trim();
  const trackArtistTitle = normalized.match(
    /^(?<track>\d{1,3})\s*[-._)]\s*(?<artist>[^-]+?)\s*-\s*(?<title>.+)$/
  );

  if (trackArtistTitle?.groups) {
    return {
      title: titleizeToken(trackArtistTitle.groups.title),
      artist: titleizeToken(trackArtistTitle.groups.artist),
      album: 'Unknown Album',
      trackNumber: Number(trackArtistTitle.groups.track)
    };
  }

  const artistTitle = normalized.match(/^(?<artist>[^-]+?)\s*-\s*(?<title>.+)$/);
  if (artistTitle?.groups) {
    return {
      title: titleizeToken(artistTitle.groups.title),
      artist: titleizeToken(artistTitle.groups.artist),
      album: 'Unknown Album',
      trackNumber: parseNumericPrefix(normalized)
    };
  }

  const numberedTitle = normalized.match(/^(?<track>\d{1,3})\s*[-._)]\s*(?<title>.+)$/);
  if (numberedTitle?.groups) {
    return {
      title: titleizeToken(numberedTitle.groups.title),
      artist: 'Unknown Artist',
      album: 'Unknown Album',
      trackNumber: Number(numberedTitle.groups.track)
    };
  }

  return {
    title: titleizeToken(normalized || 'Unknown Track'),
    artist: 'Unknown Artist',
    album: 'Unknown Album',
    trackNumber: null
  };
}

function decodeSyncSafeInteger(bytes, offset) {
  return (
    ((bytes[offset] & 0x7f) << 21) |
    ((bytes[offset + 1] & 0x7f) << 14) |
    ((bytes[offset + 2] & 0x7f) << 7) |
    (bytes[offset + 3] & 0x7f)
  );
}

function decodeTextFrame(frameBytes) {
  if (!frameBytes || frameBytes.length === 0) {
    return '';
  }

  const encoding = frameBytes[0];
  const payload = frameBytes.slice(1);

  if (encoding === 0) {
    return sanitizeText(new TextDecoder('latin1').decode(payload));
  }

  if (encoding === 3) {
    return sanitizeText(new TextDecoder('utf-8').decode(payload));
  }

  if (encoding === 2) {
    const swap = new Uint8Array(payload.length);
    for (let index = 0; index < payload.length; index += 2) {
      swap[index] = payload[index + 1];
      swap[index + 1] = payload[index];
    }
    return sanitizeText(new TextDecoder('utf-16le').decode(swap));
  }

  return sanitizeText(new TextDecoder('utf-16').decode(payload));
}

function parseTrackValue(value) {
  const match = sanitizeText(value).match(/^(\d{1,3})/);
  return match ? Number(match[1]) : null;
}

function parseId3v2Metadata(bytes) {
  if (bytes.length < 10) {
    return {};
  }

  if (
    bytes[0] !== 0x49 ||
    bytes[1] !== 0x44 ||
    bytes[2] !== 0x33
  ) {
    return {};
  }

  const majorVersion = bytes[3];
  const tagSize = decodeSyncSafeInteger(bytes, 6);
  const end = Math.min(bytes.length, 10 + tagSize);
  let offset = 10;
  const fields = {};

  while (offset + 10 <= end) {
    const frameId = String.fromCharCode(
      bytes[offset],
      bytes[offset + 1],
      bytes[offset + 2],
      bytes[offset + 3]
    );

    if (!/^[A-Z0-9]{4}$/.test(frameId)) {
      break;
    }

    const frameSize =
      majorVersion === 4
        ? decodeSyncSafeInteger(bytes, offset + 4)
        : ((bytes[offset + 4] << 24) |
            (bytes[offset + 5] << 16) |
            (bytes[offset + 6] << 8) |
            bytes[offset + 7]) >>> 0;

    if (frameSize <= 0 || offset + 10 + frameSize > end) {
      break;
    }

    const frameBytes = bytes.slice(offset + 10, offset + 10 + frameSize);
    const value = decodeTextFrame(frameBytes);

    if (frameId === 'TIT2') {
      fields.title = value;
    } else if (frameId === 'TPE1') {
      fields.artist = value;
    } else if (frameId === 'TALB') {
      fields.album = value;
    } else if (frameId === 'TRCK') {
      fields.trackNumber = parseTrackValue(value);
    } else if (frameId === 'TDRC' || frameId === 'TYER') {
      fields.year = sanitizeText(value).slice(0, 4);
    } else if (frameId === 'TCON') {
      fields.genre = value;
    }

    offset += 10 + frameSize;
  }

  return fields;
}

async function readEmbeddedMetadata(file) {
  const extension = getFileExtension(file.name);
  if (extension !== 'mp3') {
    return {};
  }

  const buffer = await file.arrayBuffer();
  return parseId3v2Metadata(new Uint8Array(buffer));
}

function normalizeImportedTrack(file, embeddedMetadata = {}) {
  const fallbackMetadata = parseFilenameMetadata(file.name);
  const title = sanitizeText(embeddedMetadata.title) || fallbackMetadata.title;
  const artist = sanitizeText(embeddedMetadata.artist) || fallbackMetadata.artist;
  const album = sanitizeText(embeddedMetadata.album) || fallbackMetadata.album;
  const trackNumber =
    Number.isFinite(embeddedMetadata.trackNumber) && embeddedMetadata.trackNumber > 0
      ? embeddedMetadata.trackNumber
      : fallbackMetadata.trackNumber;

  return {
    id: createTrackId(file),
    title,
    artist,
    album,
    trackNumber: trackNumber ?? null,
    year: sanitizeText(embeddedMetadata.year) || null,
    genre: sanitizeText(embeddedMetadata.genre) || null,
    src: '',
    duration: null,
    filename: sanitizeText(file.name),
    relativePath: sanitizeText(file.webkitRelativePath || ''),
    size: Number(file.size || 0),
    lastModified: Number(file.lastModified || 0)
  };
}

async function buildTrackFromFile(file) {
  const embeddedMetadata = await readEmbeddedMetadata(file);
  return normalizeImportedTrack(file, embeddedMetadata);
}

function sortTracks(tracks) {
  return [...tracks].sort((left, right) => {
    const artistCompare = left.artist.localeCompare(right.artist);
    if (artistCompare !== 0) {
      return artistCompare;
    }

    const albumCompare = left.album.localeCompare(right.album);
    if (albumCompare !== 0) {
      return albumCompare;
    }

    const leftTrack = left.trackNumber ?? Number.MAX_SAFE_INTEGER;
    const rightTrack = right.trackNumber ?? Number.MAX_SAFE_INTEGER;
    if (leftTrack !== rightTrack) {
      return leftTrack - rightTrack;
    }

    return left.title.localeCompare(right.title);
  });
}

function summarizeLibrary(tracks) {
  const artists = new Set();
  const albums = new Set();

  tracks.forEach(track => {
    artists.add(track.artist);
    albums.add(`${track.artist}::${track.album}`);
  });

  return {
    trackCount: tracks.length,
    artistCount: artists.size,
    albumCount: albums.size
  };
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '--:--';
  }

  const rounded = Math.round(seconds);
  const minutes = Math.floor(rounded / 60);
  const remainingSeconds = String(rounded % 60).padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
}

function getTrackIndexById(tracks, trackId) {
  return tracks.findIndex(track => track.id === trackId);
}

function getAdjacentTrackId(tracks, currentTrackId, offset) {
  const currentIndex = getTrackIndexById(tracks, currentTrackId);
  if (currentIndex < 0) {
    return tracks[0]?.id ?? null;
  }

  const nextIndex = currentIndex + offset;
  if (nextIndex < 0 || nextIndex >= tracks.length) {
    return null;
  }

  return tracks[nextIndex].id;
}

function canPlayTrack(track) {
  return Boolean(sanitizeText(track?.src));
}

function createDefaultQueue(tracks) {
  return tracks.map(track => track.id);
}

function getQueueIndex(queue, trackId) {
  return queue.findIndex(id => id === trackId);
}

function insertAfterCurrent(queue, queueIndex, trackId) {
  const filteredQueue = queue.filter(id => id !== trackId);
  const safeIndex = queueIndex < 0 ? -1 : Math.min(queueIndex, filteredQueue.length - 1);
  const insertAt = safeIndex + 1;
  const nextQueue = [...filteredQueue];
  nextQueue.splice(insertAt, 0, trackId);
  return nextQueue;
}

function getNextQueueIndex(queueLength, queueIndex, repeatMode) {
  if (queueLength === 0) {
    return -1;
  }

  if (repeatMode === 'one') {
    return queueIndex < 0 ? 0 : queueIndex;
  }

  const nextIndex = queueIndex + 1;
  if (nextIndex < queueLength) {
    return nextIndex;
  }

  if (repeatMode === 'all') {
    return 0;
  }

  return -1;
}

function createShuffledQueue(queue, currentTrackId) {
  const remaining = queue.filter(id => id !== currentTrackId);

  for (let index = remaining.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const temp = remaining[index];
    remaining[index] = remaining[swapIndex];
    remaining[swapIndex] = temp;
  }

  return currentTrackId ? [currentTrackId, ...remaining] : remaining;
}

function normalizeLikedTrackIds(likedTrackIds, tracks) {
  const validIds = new Set(tracks.map(track => track.id));
  return [...new Set((likedTrackIds || []).filter(id => validIds.has(id)))];
}

function createPlaylistId(name) {
  const slug = sanitizeText(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'playlist';
  return `playlist:${slug}:${Date.now()}`;
}

function normalizePlaylists(playlists = [], tracks = []) {
  const validIds = new Set(tracks.map(track => track.id));

  return playlists
    .filter(playlist => sanitizeText(playlist?.name))
    .map(playlist => ({
      id: sanitizeText(playlist.id) || createPlaylistId(playlist.name),
      name: sanitizeText(playlist.name),
      trackIds: [...new Set((playlist.trackIds || []).filter(id => validIds.has(id)))],
      createdAt: sanitizeText(playlist.createdAt) || new Date().toISOString(),
      updatedAt: sanitizeText(playlist.updatedAt) || new Date().toISOString()
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

function groupTracksByAlbum(tracks) {
  const albumMap = new Map();

  tracks.forEach(track => {
    const key = `${track.artist}::${track.album}`;
    if (!albumMap.has(key)) {
      albumMap.set(key, {
        key,
        title: track.album,
        artist: track.artist,
        trackCount: 0,
        totalDuration: 0,
        tracks: []
      });
    }

    const group = albumMap.get(key);
    group.tracks.push(track);
    group.trackCount += 1;
    group.totalDuration += Number.isFinite(track.duration) ? track.duration : 0;
  });

  return [...albumMap.values()]
    .map(group => ({
      ...group,
      tracks: [...group.tracks].sort((left, right) => {
        const leftTrack = left.trackNumber ?? Number.MAX_SAFE_INTEGER;
        const rightTrack = right.trackNumber ?? Number.MAX_SAFE_INTEGER;
        if (leftTrack !== rightTrack) {
          return leftTrack - rightTrack;
        }
        return left.title.localeCompare(right.title);
      })
    }))
    .sort((left, right) => {
      const artistCompare = left.artist.localeCompare(right.artist);
      if (artistCompare !== 0) {
        return artistCompare;
      }
      return left.title.localeCompare(right.title);
    });
}

function groupTracksByArtist(tracks) {
  const artistMap = new Map();

  tracks.forEach(track => {
    if (!artistMap.has(track.artist)) {
      artistMap.set(track.artist, {
        name: track.artist,
        albumCount: 0,
        trackCount: 0,
        totalDuration: 0,
        albums: new Set()
      });
    }

    const group = artistMap.get(track.artist);
    group.albums.add(track.album);
    group.trackCount += 1;
    group.totalDuration += Number.isFinite(track.duration) ? track.duration : 0;
  });

  return [...artistMap.values()]
    .map(group => ({
      name: group.name,
      albumCount: group.albums.size,
      trackCount: group.trackCount,
      totalDuration: group.totalDuration
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

function createLibrarySnapshot(tracks, likedTrackIds = [], playlists = []) {
  const sortedTracks = sortTracks(tracks);
  const importSummary = summarizeLibrary(sortedTracks);
  const normalizedLikes = normalizeLikedTrackIds(likedTrackIds, sortedTracks);
  const normalizedPlaylists = normalizePlaylists(playlists, sortedTracks);

  return {
    version: 3,
    savedAt: new Date().toISOString(),
    importSummary,
    likedTrackIds: normalizedLikes,
    playlists: normalizedPlaylists,
    tracks: sortedTracks.map(track => ({
      id: sanitizeText(track.id),
      title: sanitizeText(track.title) || 'Unknown Track',
      artist: sanitizeText(track.artist) || 'Unknown Artist',
      album: sanitizeText(track.album) || 'Unknown Album',
      trackNumber: Number.isFinite(track.trackNumber) ? track.trackNumber : null,
      year: sanitizeText(track.year) || null,
      genre: sanitizeText(track.genre) || null,
      src: sanitizeText(track.src),
      duration: Number.isFinite(track.duration) ? track.duration : null,
      filename: sanitizeText(track.filename),
      relativePath: sanitizeText(track.relativePath),
      size: Number.isFinite(track.size) ? track.size : 0,
      lastModified: Number.isFinite(track.lastModified) ? track.lastModified : 0
    }))
  };
}

function parseStoredLibrary(rawValue) {
  if (!rawValue) {
    return {
      tracks: [],
      importSummary: summarizeLibrary([]),
      likedTrackIds: [],
      playlists: [],
      savedAt: null
    };
  }

  let parsed;
  try {
    parsed = JSON.parse(rawValue);
  } catch {
    return {
      tracks: [],
      importSummary: summarizeLibrary([]),
      likedTrackIds: [],
      playlists: [],
      savedAt: null
    };
  }

  if (
    !parsed ||
    ![1, 2, 3].includes(parsed.version) ||
    !Array.isArray(parsed.tracks)
  ) {
    return {
      tracks: [],
      importSummary: summarizeLibrary([]),
      likedTrackIds: [],
      playlists: [],
      savedAt: null
    };
  }

  const tracks = sortTracks(
    parsed.tracks.map(track => ({
      id: sanitizeText(track.id),
      title: sanitizeText(track.title) || 'Unknown Track',
      artist: sanitizeText(track.artist) || 'Unknown Artist',
      album: sanitizeText(track.album) || 'Unknown Album',
      trackNumber: Number.isFinite(track.trackNumber) ? track.trackNumber : null,
      year: sanitizeText(track.year) || null,
      genre: sanitizeText(track.genre) || null,
      src: sanitizeText(track.src),
      duration: Number.isFinite(track.duration) ? track.duration : null,
      filename: sanitizeText(track.filename),
      relativePath: sanitizeText(track.relativePath),
      size: Number.isFinite(track.size) ? track.size : 0,
      lastModified: Number.isFinite(track.lastModified) ? track.lastModified : 0
    }))
  );

  const likedTrackIds = normalizeLikedTrackIds(parsed.likedTrackIds, tracks);
  const playlists = normalizePlaylists(parsed.playlists, tracks);

  return {
    tracks,
    importSummary: summarizeLibrary(tracks),
    likedTrackIds,
    playlists,
    savedAt: sanitizeText(parsed.savedAt) || null
  };
}

export {
  buildTrackFromFile,
  canPlayTrack,
  createPlaylistId,
  createDefaultQueue,
  createLibrarySnapshot,
  createTrackId,
  createShuffledQueue,
  formatDuration,
  getAdjacentTrackId,
  getNextQueueIndex,
  getQueueIndex,
  getTrackIndexById,
  groupTracksByAlbum,
  groupTracksByArtist,
  insertAfterCurrent,
  isSupportedAudioFile,
  LIBRARY_STORAGE_KEY,
  normalizeLikedTrackIds,
  normalizePlaylists,
  normalizeImportedTrack,
  parseFilenameMetadata,
  parseId3v2Metadata,
  parseStoredLibrary,
  sortTracks,
  summarizeLibrary
};
