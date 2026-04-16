import {
  buildTrackFromFile,
  canPlayTrack,
  createDefaultQueue,
  createLibrarySnapshot,
  createShuffledQueue,
  formatDuration,
  getNextQueueIndex,
  getQueueIndex,
  isSupportedAudioFile,
  insertAfterCurrent,
  LIBRARY_STORAGE_KEY,
  parseStoredLibrary,
  sortTracks,
  summarizeLibrary
} from './src/library.js';

const serviceWorkerSupported = 'serviceWorker' in navigator;
const fileInput = document.querySelector('#file-input');
const folderInput = document.querySelector('#folder-input');
const importStatus = document.querySelector('#import-status');
const trackCount = document.querySelector('#track-count');
const artistCount = document.querySelector('#artist-count');
const albumCount = document.querySelector('#album-count');
const emptyState = document.querySelector('#empty-state');
const trackList = document.querySelector('#track-list');
const clearLibraryButton = document.querySelector('#clear-library');
const audioPlayer = document.querySelector('#audio-player');
const nowPlayingTitle = document.querySelector('#now-playing-title');
const nowPlayingMeta = document.querySelector('#now-playing-meta');
const albumArt = document.querySelector('#album-art');
const albumArtMark = document.querySelector('#album-art-mark');
const playerNote = document.querySelector('#player-note');
const playButton = document.querySelector('#play-button');
const previousButton = document.querySelector('#previous-button');
const nextButton = document.querySelector('#next-button');
const repeatButton = document.querySelector('#repeat-button');
const shuffleButton = document.querySelector('#shuffle-button');
const seekInput = document.querySelector('#seek-input');
const volumeInput = document.querySelector('#volume-input');
const currentTime = document.querySelector('#current-time');
const durationTime = document.querySelector('#duration-time');
const queueList = document.querySelector('#queue-list');
const queueEmptyState = document.querySelector('#queue-empty-state');
const queueNote = document.querySelector('#queue-note');

const state = {
  tracks: [],
  importInFlight: false,
  lastSavedAt: null,
  player: {
    currentTrackId: null,
    paused: true,
    currentTime: 0,
    volume: Number(volumeInput?.value || 0.8),
    queue: [],
    queueIndex: -1,
    repeatMode: 'off',
    shuffle: false
  }
};

function canUseLocalStorage() {
  try {
    return typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function revokeTrackSources(tracks) {
  tracks.forEach(track => {
    if (track?.src && track.src.startsWith('blob:')) {
      URL.revokeObjectURL(track.src);
    }
  });
}

function saveLibrary() {
  if (!canUseLocalStorage()) {
    return false;
  }

  const snapshot = createLibrarySnapshot(state.tracks);
  state.lastSavedAt = snapshot.savedAt;
  window.localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(snapshot));
  return true;
}

function loadStoredLibrary() {
  if (!canUseLocalStorage()) {
    return false;
  }

  const storedLibrary = parseStoredLibrary(
    window.localStorage.getItem(LIBRARY_STORAGE_KEY)
  );
  state.tracks = storedLibrary.tracks;
  state.lastSavedAt = storedLibrary.savedAt;
  return storedLibrary.tracks.length > 0;
}

function resetQueueFromTracks() {
  state.player.queue = createDefaultQueue(state.tracks);
  state.player.queueIndex = state.player.currentTrackId
    ? getQueueIndex(state.player.queue, state.player.currentTrackId)
    : state.player.queue.length > 0
      ? 0
      : -1;
}

function clearStoredLibrary() {
  revokeTrackSources(state.tracks);
  state.tracks = [];
  state.lastSavedAt = null;
  state.player.queue = [];
  state.player.queueIndex = -1;

  if (canUseLocalStorage()) {
    window.localStorage.removeItem(LIBRARY_STORAGE_KEY);
  }
}

function getTrackById(trackId) {
  return state.tracks.find(track => track.id === trackId) ?? null;
}

function getCurrentTrack() {
  return getTrackById(state.player.currentTrackId);
}

function getCurrentQueueTrack() {
  if (state.player.queueIndex < 0) {
    return null;
  }

  return getTrackById(state.player.queue[state.player.queueIndex]);
}

function setStatus(message, tone = 'normal') {
  importStatus.textContent = message;
  importStatus.dataset.tone = tone;
}

function updateSummary() {
  const summary = summarizeLibrary(state.tracks);
  trackCount.textContent = String(summary.trackCount);
  artistCount.textContent = String(summary.artistCount);
  albumCount.textContent = String(summary.albumCount);
}

function syncTransportButtons() {
  const currentTrack = getCurrentTrack();
  const hasTracks = state.tracks.length > 0;
  const hasPlayableTrack = currentTrack ? canPlayTrack(currentTrack) : false;

  playButton.disabled = !hasPlayableTrack;
  previousButton.disabled = !hasPlayableTrack || state.player.queueIndex <= 0;
  nextButton.disabled =
    !hasPlayableTrack ||
    (state.player.repeatMode === 'off' &&
      (state.player.queueIndex < 0 || state.player.queueIndex >= state.player.queue.length - 1));
  seekInput.disabled = !hasPlayableTrack;
  volumeInput.disabled = !hasTracks;
  repeatButton.disabled = !hasTracks;
  shuffleButton.disabled = !hasTracks;
}

function updateModeButtons() {
  repeatButton.textContent =
    state.player.repeatMode === 'off'
      ? 'Repeat: Off'
      : state.player.repeatMode === 'all'
        ? 'Repeat: All'
        : 'Repeat: One';
  shuffleButton.textContent = state.player.shuffle ? 'Shuffle: On' : 'Shuffle: Off';
}

function updateNowPlaying() {
  const currentTrack = getCurrentTrack();

  if (!currentTrack) {
    nowPlayingTitle.textContent = 'Nothing playing';
    nowPlayingMeta.textContent = 'Import local files to start playback.';
    albumArt.dataset.state = 'idle';
    albumArtMark.textContent = 'LP';
    playerNote.textContent =
      'Import tracks in this session to enable playback. Persisted metadata alone is not yet enough to reopen the underlying files after reload.';
    playButton.textContent = 'Play';
    currentTime.textContent = '0:00';
    durationTime.textContent = '--:--';
    seekInput.max = '0';
    seekInput.value = '0';
    updateModeButtons();
    syncTransportButtons();
    return;
  }

  nowPlayingTitle.textContent = currentTrack.title;
  nowPlayingMeta.textContent = `${currentTrack.artist} | ${currentTrack.album}`;
  albumArt.dataset.state = state.player.paused ? 'paused' : 'playing';
  albumArtMark.textContent = currentTrack.title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0]?.toUpperCase() || '')
    .join('') || 'LP';
  playButton.textContent = state.player.paused ? 'Play' : 'Pause';
  currentTime.textContent = formatDuration(state.player.currentTime);
  durationTime.textContent = formatDuration(
    Number.isFinite(audioPlayer.duration) ? audioPlayer.duration : currentTrack.duration
  );
  seekInput.max = String(
    Math.max(
      0,
      Math.floor(
        Number.isFinite(audioPlayer.duration) ? audioPlayer.duration : currentTrack.duration || 0
      )
    )
  );
  seekInput.value = String(Math.min(Number(seekInput.max), Math.floor(state.player.currentTime)));

  if (canPlayTrack(currentTrack)) {
    playerNote.textContent =
      'Playback is available for tracks imported in the current browser session. Queue behavior is session-local for now.';
  } else {
    playerNote.textContent =
      'This track was restored from the saved library index, but playback needs the original files to be imported again in this session.';
  }

  updateModeButtons();
  syncTransportButtons();
}

function renderQueue() {
  queueList.innerHTML = '';

  if (state.player.queue.length === 0) {
    queueEmptyState.hidden = false;
    queueList.hidden = true;
    queueNote.textContent =
      'The queue starts from the current library order and becomes session-local as you add tracks or toggle shuffle.';
    return;
  }

  queueEmptyState.hidden = true;
  queueList.hidden = false;

  const fragment = document.createDocumentFragment();

  state.player.queue.forEach((trackId, index) => {
    const track = getTrackById(trackId);
    if (!track) {
      return;
    }

    const item = document.createElement('article');
    item.className = 'queue-row';
    if (index === state.player.queueIndex) {
      item.dataset.current = 'true';
    }

    item.innerHTML = `
      <div class="track-index">${index + 1}</div>
      <div class="track-main">
        <strong>${track.title}</strong>
        <p>${track.artist} | ${track.album}</p>
      </div>
      <div class="track-meta">
        <span>${formatDuration(track.duration)}</span>
      </div>
    `;
    fragment.append(item);
  });

  queueList.append(fragment);

  queueNote.textContent = state.player.shuffle
    ? 'Shuffle is active for this session queue. Repeat mode still applies to queue progression.'
    : 'The queue follows an explicit session order. Add tracks or toggle shuffle to change playback flow.';
}

function renderTrackList() {
  trackList.innerHTML = '';
  clearLibraryButton.hidden = state.tracks.length === 0;

  if (state.tracks.length === 0) {
    emptyState.hidden = false;
    trackList.hidden = true;
    updateSummary();
    updateNowPlaying();
    renderQueue();
    return;
  }

  emptyState.hidden = true;
  trackList.hidden = false;

  const fragment = document.createDocumentFragment();

  state.tracks.forEach(track => {
    const article = document.createElement('article');
    const isCurrent = track.id === state.player.currentTrackId;
    article.className = 'track-row';
    if (isCurrent) {
      article.dataset.current = 'true';
    }

    const actionLabel = isCurrent && !state.player.paused ? 'Pause' : 'Play';
    const playbackDisabled = canPlayTrack(track) ? '' : 'disabled';
    article.innerHTML = `
      <div class="track-index">${track.trackNumber ?? '-'}</div>
      <div class="track-main">
        <strong>${track.title}</strong>
        <p>${track.artist} | ${track.album}</p>
      </div>
      <div class="track-actions">
        <button class="track-play-button button button-secondary" type="button" data-track-id="${track.id}" ${playbackDisabled}>
          ${actionLabel}
        </button>
        <button class="track-queue-button button button-secondary" type="button" data-track-id="${track.id}">
          Play Next
        </button>
      </div>
      <div class="track-meta">
        <span>${formatDuration(track.duration)}</span>
        <span>${track.relativePath || track.filename}</span>
      </div>
    `;
    fragment.append(article);
  });

  trackList.append(fragment);
  updateSummary();
  updateNowPlaying();
  renderQueue();
}

function mergeTracks(importedTracks) {
  const previousById = new Map(state.tracks.map(track => [track.id, track]));
  const nextById = new Map();

  state.tracks.forEach(track => {
    nextById.set(track.id, track);
  });

  importedTracks.forEach(track => {
    const previousTrack = previousById.get(track.id);
    if (
      previousTrack?.src &&
      previousTrack.src !== track.src &&
      previousTrack.src.startsWith('blob:')
    ) {
      URL.revokeObjectURL(previousTrack.src);
    }
    nextById.set(track.id, track);
  });

  state.tracks = sortTracks([...nextById.values()]);

  if (state.player.shuffle && state.player.queue.length > 0) {
    state.player.queue = createShuffledQueue(
      createDefaultQueue(state.tracks),
      state.player.currentTrackId
    );
  } else {
    resetQueueFromTracks();
  }
}

function loadTrackDurationFromUrl(url) {
  return new Promise(resolve => {
    const audio = document.createElement('audio');
    const cleanup = () => {
      audio.removeAttribute('src');
      audio.load();
    };

    audio.preload = 'metadata';
    audio.src = url;
    audio.addEventListener(
      'loadedmetadata',
      () => {
        const duration = Number.isFinite(audio.duration) ? audio.duration : null;
        cleanup();
        resolve(duration);
      },
      { once: true }
    );
    audio.addEventListener(
      'error',
      () => {
        cleanup();
        resolve(null);
      },
      { once: true }
    );
  });
}

async function normalizeFiles(fileList) {
  const files = [...fileList].filter(isSupportedAudioFile);
  const tracks = [];

  for (const file of files) {
    const track = await buildTrackFromFile(file);
    track.src = URL.createObjectURL(file);
    track.duration = await loadTrackDurationFromUrl(track.src);
    tracks.push(track);
  }

  return tracks;
}

function setQueueTrack(trackId, options = {}) {
  const track = getTrackById(trackId);
  if (!track) {
    return false;
  }

  if (state.player.queue.length === 0) {
    resetQueueFromTracks();
  }

  let queueIndex = getQueueIndex(state.player.queue, track.id);
  if (queueIndex < 0) {
    state.player.queue.push(track.id);
    queueIndex = state.player.queue.length - 1;
  }

  state.player.queueIndex = queueIndex;
  state.player.currentTrackId = track.id;
  state.player.currentTime = 0;
  state.player.paused = options.autoplay ? false : true;

  if (canPlayTrack(track)) {
    audioPlayer.src = track.src;
    audioPlayer.currentTime = 0;
    audioPlayer.volume = state.player.volume;

    if (options.autoplay) {
      audioPlayer.play().catch(error => {
        console.warn('Playback start failed.', error);
        state.player.paused = true;
        updateNowPlaying();
        renderTrackList();
      });
    } else {
      audioPlayer.pause();
    }
  } else {
    audioPlayer.pause();
    audioPlayer.removeAttribute('src');
    audioPlayer.load();
  }

  updateNowPlaying();
  renderTrackList();
  return true;
}

function togglePlayback(trackId = state.player.currentTrackId) {
  const targetTrack = getTrackById(trackId);
  if (!targetTrack) {
    return;
  }

  if (!canPlayTrack(targetTrack)) {
    setStatus(
      'This track was restored from saved metadata. Re-import the source files in this session to enable playback.',
      'warning'
    );
    updateNowPlaying();
    return;
  }

  if (state.player.currentTrackId !== targetTrack.id) {
    setQueueTrack(targetTrack.id, { autoplay: true });
    return;
  }

  if (state.player.paused) {
    audioPlayer
      .play()
      .then(() => {
        state.player.paused = false;
        updateNowPlaying();
        renderTrackList();
      })
      .catch(error => {
        console.warn('Playback resume failed.', error);
      });
    return;
  }

  audioPlayer.pause();
}

function stepQueue(offset) {
  if (state.player.queue.length === 0) {
    return;
  }

  const nextIndex = state.player.queueIndex + offset;
  if (nextIndex < 0 || nextIndex >= state.player.queue.length) {
    return;
  }

  const nextTrackId = state.player.queue[nextIndex];
  setQueueTrack(nextTrackId, { autoplay: true });
}

function queueTrackNext(trackId) {
  const track = getTrackById(trackId);
  if (!track) {
    return;
  }

  if (state.player.queue.length === 0) {
    resetQueueFromTracks();
  }

  state.player.queue = insertAfterCurrent(
    state.player.queue,
    state.player.queueIndex,
    track.id
  );

  if (state.player.queueIndex < 0) {
    state.player.queueIndex = 0;
  }

  renderTrackList();
  setStatus(`Queued "${track.title}" to play next.`, 'success');
}

function cycleRepeatMode() {
  state.player.repeatMode =
    state.player.repeatMode === 'off'
      ? 'all'
      : state.player.repeatMode === 'all'
        ? 'one'
        : 'off';
  updateNowPlaying();
  renderQueue();
}

function toggleShuffleMode() {
  state.player.shuffle = !state.player.shuffle;

  if (state.player.shuffle) {
    state.player.queue = createShuffledQueue(
      createDefaultQueue(state.tracks),
      state.player.currentTrackId
    );
  } else {
    resetQueueFromTracks();
  }

  if (state.player.currentTrackId) {
    state.player.queueIndex = getQueueIndex(state.player.queue, state.player.currentTrackId);
  }

  updateNowPlaying();
  renderQueue();
}

async function handleImport(fileList) {
  if (!fileList || fileList.length === 0 || state.importInFlight) {
    return;
  }

  const supportedFiles = [...fileList].filter(isSupportedAudioFile);
  if (supportedFiles.length === 0) {
    setStatus('No supported audio files were found in that selection.', 'warning');
    return;
  }

  state.importInFlight = true;
  setStatus(
    `Importing ${supportedFiles.length} audio file${supportedFiles.length === 1 ? '' : 's'}...`
  );

  try {
    const tracks = await normalizeFiles(supportedFiles);
    mergeTracks(tracks);
    const currentTrackStillExists = state.player.currentTrackId
      ? state.tracks.some(track => track.id === state.player.currentTrackId)
      : false;

    if (!currentTrackStillExists) {
      state.player.currentTrackId = tracks[0]?.id ?? null;
      state.player.queueIndex = getQueueIndex(state.player.queue, state.player.currentTrackId);
      state.player.paused = true;
      state.player.currentTime = 0;
    }

    const saved = saveLibrary();
    renderTrackList();
    setStatus(
      `Imported ${tracks.length} track${tracks.length === 1 ? '' : 's'} into the local library view.${saved ? ' The normalized library metadata was saved locally for reloads.' : ' Local storage is unavailable, so this import is session-only.'} Playback and queue behavior are available for the files imported in this session.`,
      'success'
    );
  } catch (error) {
    console.error(error);
    setStatus(
      'Import failed while reading local files. Try a smaller selection or a different folder.',
      'error'
    );
  } finally {
    state.importInFlight = false;
    fileInput.value = '';
    folderInput.value = '';
  }
}

function handleTrackListClick(event) {
  const playButtonElement = event.target.closest('.track-play-button');
  if (playButtonElement) {
    togglePlayback(playButtonElement.dataset.trackId);
    return;
  }

  const queueButtonElement = event.target.closest('.track-queue-button');
  if (queueButtonElement) {
    queueTrackNext(queueButtonElement.dataset.trackId);
  }
}

function handleClearLibrary() {
  audioPlayer.pause();
  audioPlayer.removeAttribute('src');
  audioPlayer.load();
  clearStoredLibrary();
  state.player.currentTrackId = null;
  state.player.paused = true;
  state.player.currentTime = 0;
  state.player.repeatMode = 'off';
  state.player.shuffle = false;
  renderTrackList();
  setStatus('Cleared the locally stored library index for this browser.', 'warning');
}

function registerPlayerEvents() {
  audioPlayer.volume = state.player.volume;

  audioPlayer.addEventListener('play', () => {
    state.player.paused = false;
    updateNowPlaying();
    renderTrackList();
  });

  audioPlayer.addEventListener('pause', () => {
    state.player.paused = true;
    updateNowPlaying();
    renderTrackList();
  });

  audioPlayer.addEventListener('timeupdate', () => {
    state.player.currentTime = Number.isFinite(audioPlayer.currentTime)
      ? audioPlayer.currentTime
      : 0;
    updateNowPlaying();
  });

  audioPlayer.addEventListener('loadedmetadata', () => {
    updateNowPlaying();
  });

  audioPlayer.addEventListener('ended', () => {
    const nextIndex = getNextQueueIndex(
      state.player.queue.length,
      state.player.queueIndex,
      state.player.repeatMode
    );

    if (nextIndex >= 0) {
      const nextTrackId = state.player.queue[nextIndex];
      setQueueTrack(nextTrackId, { autoplay: true });
      return;
    }

    state.player.paused = true;
    state.player.currentTime = 0;
    updateNowPlaying();
    renderTrackList();
  });
}

async function registerServiceWorker() {
  if (!serviceWorkerSupported) {
    return;
  }

  try {
    await navigator.serviceWorker.register('./service-worker.js');
  } catch (error) {
    console.warn('Service worker registration failed.', error);
  }
}

fileInput?.addEventListener('change', event => handleImport(event.target.files));
folderInput?.addEventListener('change', event => handleImport(event.target.files));
clearLibraryButton?.addEventListener('click', handleClearLibrary);
trackList?.addEventListener('click', handleTrackListClick);
playButton?.addEventListener('click', () => togglePlayback());
previousButton?.addEventListener('click', () => stepQueue(-1));
nextButton?.addEventListener('click', () => stepQueue(1));
repeatButton?.addEventListener('click', cycleRepeatMode);
shuffleButton?.addEventListener('click', toggleShuffleMode);
seekInput?.addEventListener('input', event => {
  if (!audioPlayer.src) {
    return;
  }

  const nextTime = Number(event.target.value);
  audioPlayer.currentTime = nextTime;
  state.player.currentTime = nextTime;
  updateNowPlaying();
});
volumeInput?.addEventListener('input', event => {
  const volume = Number(event.target.value);
  state.player.volume = volume;
  audioPlayer.volume = volume;
  syncTransportButtons();
});

registerPlayerEvents();

if (loadStoredLibrary()) {
  resetQueueFromTracks();
  if (state.tracks.length > 0) {
    state.player.currentTrackId = state.tracks[0].id;
    state.player.queueIndex = 0;
  }
  setStatus(
    'Loaded the locally saved library index for this browser. Re-import files in this session to enable playback and queue behavior.',
    'success'
  );
}

renderTrackList();
registerServiceWorker();
