import {
  buildTrackFromFile,
  formatDuration,
  isSupportedAudioFile,
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
const state = {
  tracks: [],
  importInFlight: false
};

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

function renderTrackList() {
  trackList.innerHTML = '';

  if (state.tracks.length === 0) {
    emptyState.hidden = false;
    trackList.hidden = true;
    updateSummary();
    return;
  }

  emptyState.hidden = true;
  trackList.hidden = false;

  const fragment = document.createDocumentFragment();

  state.tracks.forEach(track => {
    const article = document.createElement('article');
    article.className = 'track-row';
    article.innerHTML = `
      <div class="track-index">${track.trackNumber ?? '•'}</div>
      <div class="track-main">
        <strong>${track.title}</strong>
        <p>${track.artist} • ${track.album}</p>
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
}

function mergeTracks(importedTracks) {
  const nextById = new Map(state.tracks.map(track => [track.id, track]));
  importedTracks.forEach(track => {
    nextById.set(track.id, track);
  });
  state.tracks = sortTracks([...nextById.values()]);
}

function loadTrackDuration(file) {
  return new Promise(resolve => {
    const audio = document.createElement('audio');
    const objectUrl = URL.createObjectURL(file);
    const cleanup = () => {
      audio.removeAttribute('src');
      audio.load();
      URL.revokeObjectURL(objectUrl);
    };

    audio.preload = 'metadata';
    audio.src = objectUrl;
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
    track.duration = await loadTrackDuration(file);
    tracks.push(track);
  }

  return tracks;
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
  setStatus(`Importing ${supportedFiles.length} audio file${supportedFiles.length === 1 ? '' : 's'}...`);

  try {
    const tracks = await normalizeFiles(supportedFiles);
    mergeTracks(tracks);
    renderTrackList();
    setStatus(
      `Imported ${tracks.length} track${tracks.length === 1 ? '' : 's'} into the local library view. Embedded metadata was used when available, with filename fallback for missing fields.`,
      'success'
    );
  } catch (error) {
    console.error(error);
    setStatus('Import failed while reading local files. Try a smaller selection or a different folder.', 'error');
  } finally {
    state.importInFlight = false;
    fileInput.value = '';
    folderInput.value = '';
  }
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
renderTrackList();
registerServiceWorker();
