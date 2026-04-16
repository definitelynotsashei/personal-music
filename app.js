import {
  buildTrackFromFile,
  canPlayTrack,
  createDefaultQueue,
  createLibrarySnapshot,
  createPlaylistId,
  createShuffledQueue,
  formatDuration,
  getNextQueueIndex,
  getQueueIndex,
  groupTracksByAlbum,
  groupTracksByArtist,
  insertAfterCurrent,
  isSupportedAudioFile,
  LIBRARY_STORAGE_KEY,
  normalizeLikedTrackIds,
  normalizePlaylists,
  normalizeRecentTrackIds,
  parseStoredLibrary,
  searchLibrary,
  sortTracks,
  summarizeLibrary
} from './src/library.js';

const serviceWorkerSupported = 'serviceWorker' in navigator;
const fileInput = document.querySelector('#file-input');
const folderInput = document.querySelector('#folder-input');
const importStatus = document.querySelector('#import-status');
const connectionStatus = document.querySelector('#connection-status');
const offlineNote = document.querySelector('#offline-note');
const installStatus = document.querySelector('#install-status');
const installAppButton = document.querySelector('#install-app-button');
const trackCount = document.querySelector('#track-count');
const artistCount = document.querySelector('#artist-count');
const albumCount = document.querySelector('#album-count');
const emptyState = document.querySelector('#empty-state');
const trackList = document.querySelector('#track-list');
const playlistList = document.querySelector('#playlist-list');
const albumList = document.querySelector('#album-list');
const artistList = document.querySelector('#artist-list');
const appTabs = document.querySelectorAll('.app-tab');
const appViews = document.querySelectorAll('.app-view');
const browseTabs = document.querySelectorAll('.browse-tab');
const searchInput = document.querySelector('#library-search-input');
const clearSearchButton = document.querySelector('#clear-search-button');
const searchResults = document.querySelector('#search-results');
const playlistControls = document.querySelector('#playlist-controls');
const playlistNameInput = document.querySelector('#playlist-name-input');
const createPlaylistButton = document.querySelector('#create-playlist-button');
const playlistSelect = document.querySelector('#playlist-select');
const clearLibraryButton = document.querySelector('#clear-library');
const audioPlayer = document.querySelector('#audio-player');
const playerPanel = document.querySelector('#player-panel');
const openExpandedPlayerButton = document.querySelector('#open-expanded-player');
const expandPlayerButton = document.querySelector('#expand-player-button');
const closeExpandedPlayerButton = document.querySelector('#close-expanded-player');
const stickyPlayer = document.querySelector('#sticky-player');
const stickyAlbumArt = document.querySelector('#sticky-album-art');
const stickyAlbumArtMark = document.querySelector('#sticky-album-art-mark');
const nowPlayingTitle = document.querySelector('#now-playing-title');
const nowPlayingMeta = document.querySelector('#now-playing-meta');
const albumArt = document.querySelector('#album-art');
const albumArtMark = document.querySelector('#album-art-mark');
const likeButton = document.querySelector('#like-button');
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

function getIconMarkup(name) {
  const icons = {
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6.5 L17 12 L8 17.5 Z" /></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6.5 L9 17.5" /><path d="M15 6.5 L15 17.5" /></svg>',
    previous: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 6 L7 18" /><path d="M17.5 6.5 L10 12 L17.5 17.5 Z" /></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 6 L17 18" /><path d="M6.5 6.5 L14 12 L6.5 17.5 Z" /></svg>',
    shuffle: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7 C7 7, 8.8 7, 11.2 11 C13.4 14.7, 15 17, 20 17" /><path d="M17 14 L20 17 L17 20" /><path d="M4 17 C7 17, 8.8 17, 11 13.5" /><path d="M15 7 C16.4 7, 17.7 7, 20 7" /><path d="M17 4 L20 7 L17 10" /></svg>',
    repeat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 8 C8.5 6.8, 10.2 6.4, 12.5 6.4 L17 6.4" /><path d="M15 4 L18 6.4 L15 9" /><path d="M17 16 C15.5 17.2, 13.8 17.6, 11.5 17.6 L7 17.6" /><path d="M9 15 L6 17.6 L9 20" /></svg>',
    heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20 C10 18.2, 6.3 15.6, 4.8 12.6 C3.5 10, 4.2 6.9, 7.1 6.1 C9.2 5.5, 10.8 6.7, 12 8.2 C13.2 6.7, 14.8 5.5, 16.9 6.1 C19.8 6.9, 20.5 10, 19.2 12.6 C17.7 15.6, 14 18.2, 12 20 Z" /></svg>'
  };

  return icons[name] || '';
}

function setIconButton(button, iconName, label) {
  if (!button) {
    return;
  }

  button.innerHTML = `${getIconMarkup(iconName)}<span class="sr-only">${label}</span>`;
  button.setAttribute('aria-label', label);
  button.title = label;
}

const state = {
  tracks: [],
  likedTrackIds: [],
  playlists: [],
  recentTrackIds: [],
  selectedPlaylistId: null,
  importInFlight: false,
  lastSavedAt: null,
  appSection: 'home',
  browseView: 'tracks',
  searchQuery: '',
  mobilePlayerOpen: false,
  compactPlayerMode: false,
  installPromptEvent: null,
  lastNonPlayerSection: 'home',
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

function updateConnectionStatus() {
  const online = navigator.onLine;
  connectionStatus.textContent = online ? 'Online' : 'Offline';
  connectionStatus.dataset.tone = online ? 'success' : 'warning';
  offlineNote.textContent = online
    ? 'The app shell can stay available offline, but actual audio playback still needs files imported in the current session.'
    : 'You are offline. Cached app screens can still load, but playback still needs audio files imported in this browser session.';
}

function updateInstallStatus() {
  if (window.matchMedia('(display-mode: standalone)').matches) {
    installStatus.textContent = 'Installed';
    installStatus.dataset.tone = 'success';
    installAppButton.hidden = true;
    installAppButton.disabled = true;
    return;
  }

  if (state.installPromptEvent) {
    installStatus.textContent = 'Install ready';
    installStatus.dataset.tone = 'success';
    installAppButton.hidden = false;
    installAppButton.disabled = false;
    return;
  }

  installStatus.textContent = 'Browser install not ready';
  installStatus.dataset.tone = 'warning';
  installAppButton.hidden = true;
}

function updatePlayerShellMode() {
  const compactPlayerMode = window.matchMedia('(max-width: 760px)').matches;
  state.compactPlayerMode = compactPlayerMode;

  if (!compactPlayerMode) {
    state.mobilePlayerOpen = false;
  }

  document.body.classList.toggle(
    'player-overlay-open',
    state.compactPlayerMode && state.mobilePlayerOpen
  );
  playerPanel.dataset.mobile = String(compactPlayerMode);
  playerPanel.dataset.mobileOpen = String(state.mobilePlayerOpen);
  stickyPlayer.dataset.compact = String(compactPlayerMode);
  stickyPlayer.dataset.expanded = String(state.mobilePlayerOpen);
  openExpandedPlayerButton?.setAttribute(
    'aria-expanded',
    String(state.compactPlayerMode && state.mobilePlayerOpen)
  );
  expandPlayerButton?.setAttribute(
    'aria-expanded',
    String(state.compactPlayerMode && state.mobilePlayerOpen)
  );
}

function openExpandedPlayer() {
  if (state.appSection !== 'now-playing') {
    state.lastNonPlayerSection = state.appSection;
    state.appSection = 'now-playing';
  }

  if (state.compactPlayerMode) {
    state.mobilePlayerOpen = true;
  }

  updateAppSections();
  updatePlayerShellMode();
}

function closeExpandedPlayer() {
  if (!state.compactPlayerMode) {
    return;
  }

  state.mobilePlayerOpen = false;
  if (state.lastNonPlayerSection && state.lastNonPlayerSection !== 'now-playing') {
    state.appSection = state.lastNonPlayerSection;
    updateAppSections();
  }
  updatePlayerShellMode();
}

function updateAppSections() {
  appTabs.forEach(tab => {
    const isActive = tab.dataset.section === state.appSection;
    tab.dataset.active = String(isActive);
    tab.setAttribute('aria-pressed', String(isActive));
  });

  appViews.forEach(view => {
    view.hidden = view.id !== `${state.appSection}-view`;
  });
}

function setAppSection(section) {
  state.appSection = section;
  if (section === 'now-playing' && state.compactPlayerMode) {
    state.mobilePlayerOpen = true;
  } else if (section !== 'now-playing') {
    state.lastNonPlayerSection = section;
    state.mobilePlayerOpen = false;
  }

  updateAppSections();
  updatePlayerShellMode();
}

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

  const snapshot = createLibrarySnapshot(
    state.tracks,
    state.likedTrackIds,
    state.playlists,
    state.recentTrackIds
  );
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
  state.likedTrackIds = storedLibrary.likedTrackIds;
  state.playlists = storedLibrary.playlists;
  state.recentTrackIds = storedLibrary.recentTrackIds;
  state.selectedPlaylistId = storedLibrary.playlists[0]?.id ?? null;
  state.lastSavedAt = storedLibrary.savedAt;
  return storedLibrary.tracks.length > 0 || storedLibrary.playlists.length > 0;
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
  state.likedTrackIds = [];
  state.playlists = [];
  state.recentTrackIds = [];
  state.selectedPlaylistId = null;
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

function getPlaylistById(playlistId) {
  return state.playlists.find(playlist => playlist.id === playlistId) ?? null;
}

function isLiked(trackId) {
  return state.likedTrackIds.includes(trackId);
}

function getRecentTracks() {
  return state.recentTrackIds
    .map(trackId => getTrackById(trackId))
    .filter(Boolean);
}

function getSearchResults() {
  return searchLibrary(
    state.tracks,
    state.playlists,
    state.likedTrackIds,
    state.searchQuery
  );
}

function ensureSelectedPlaylist() {
  if (!state.selectedPlaylistId || !getPlaylistById(state.selectedPlaylistId)) {
    state.selectedPlaylistId = state.playlists[0]?.id ?? null;
  }
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
  likeButton.disabled = !currentTrack;
}

function updateModeButtons() {
  const repeatLabel =
    state.player.repeatMode === 'off'
      ? 'Repeat off'
      : state.player.repeatMode === 'all'
        ? 'Repeat all'
        : 'Repeat one';
  const shuffleLabel = state.player.shuffle ? 'Shuffle on' : 'Shuffle off';

  setIconButton(repeatButton, 'repeat', repeatLabel);
  setIconButton(shuffleButton, 'shuffle', shuffleLabel);
  repeatButton.dataset.mode = state.player.repeatMode;
  shuffleButton.dataset.active = String(state.player.shuffle);
}

function updateBrowseTabs() {
  browseTabs.forEach(tab => {
    const isActive = tab.dataset.view === state.browseView;
    tab.dataset.active = String(isActive);
    tab.setAttribute('aria-pressed', String(isActive));
  });
}

function updatePlaylistControls() {
  ensureSelectedPlaylist();
  const showControls =
    state.appSection === 'playlists' && state.tracks.length > 0;
  playlistControls.hidden = !showControls;

  playlistSelect.innerHTML = '';
  if (state.playlists.length === 0) {
    const option = document.createElement('option');
    option.textContent = 'Create a playlist first';
    option.value = '';
    playlistSelect.append(option);
    playlistSelect.disabled = true;
    return;
  }

  playlistSelect.disabled = false;
  state.playlists.forEach(playlist => {
    const option = document.createElement('option');
    option.value = playlist.id;
    option.textContent = playlist.name;
    if (playlist.id === state.selectedPlaylistId) {
      option.selected = true;
    }
    playlistSelect.append(option);
  });
}

function updateSearchControls() {
  const hasQuery = Boolean(state.searchQuery.trim());
  clearSearchButton.hidden = !hasQuery;
}

function updateLikeButton() {
  const currentTrack = getCurrentTrack();
  if (!currentTrack) {
    likeButton.dataset.active = 'false';
    setIconButton(likeButton, 'heart', 'Like track');
    return;
  }

  const liked = isLiked(currentTrack.id);
  likeButton.dataset.active = String(liked);
  setIconButton(likeButton, 'heart', liked ? 'Unlike track' : 'Like track');
}

function updateNowPlaying() {
  const currentTrack = getCurrentTrack();

  if (!currentTrack) {
    nowPlayingTitle.textContent = 'Nothing playing';
    nowPlayingMeta.textContent = 'Import local files to start playback.';
    albumArt.dataset.state = 'idle';
    stickyPlayer.dataset.state = 'idle';
    stickyAlbumArt.dataset.state = 'idle';
    albumArtMark.textContent = 'LP';
    stickyAlbumArtMark.textContent = 'LP';
    playerNote.textContent =
      'The room can stay installed and cached, but playback still needs tracks imported in this browser session. Reloaded metadata alone cannot reopen the files yet.';
    setIconButton(playButton, 'play', 'Play');
    currentTime.textContent = '0:00';
    durationTime.textContent = '--:--';
    seekInput.max = '0';
    seekInput.value = '0';
    updateModeButtons();
    updateLikeButton();
    syncTransportButtons();
    return;
  }

  nowPlayingTitle.textContent = currentTrack.title;
  nowPlayingMeta.textContent = `${currentTrack.artist} | ${currentTrack.album}`;
  albumArt.dataset.state = state.player.paused ? 'paused' : 'playing';
  stickyPlayer.dataset.state = state.player.paused ? 'paused' : 'playing';
  stickyAlbumArt.dataset.state = state.player.paused ? 'paused' : 'playing';
  albumArtMark.textContent = currentTrack.title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0]?.toUpperCase() || '')
    .join('') || 'LP';
  stickyAlbumArtMark.textContent = albumArtMark.textContent;
  setIconButton(playButton, state.player.paused ? 'play' : 'pause', state.player.paused ? 'Play' : 'Pause');
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
      'Playback is live for tracks imported in this session. Likes, playlists, recent history, and the app shell stay tucked into the local library.';
  } else {
    playerNote.textContent =
      'This track came back from the saved library, but the room still needs the original files re-imported before it can play again.';
  }

  updateModeButtons();
  updateLikeButton();
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

function renderTracksView(tracksToRender = state.tracks) {
  trackList.innerHTML = '';

  if (tracksToRender.length === 0) {
    trackList.hidden = true;
    return;
  }

  const fragment = document.createDocumentFragment();

  tracksToRender.forEach(track => {
    const article = document.createElement('article');
    const isCurrent = track.id === state.player.currentTrackId;
    article.className = 'track-row';
    if (isCurrent) {
      article.dataset.current = 'true';
    }

    const actionLabel = isCurrent && !state.player.paused ? 'Pause' : 'Play';
    const playbackDisabled = canPlayTrack(track) ? '' : 'disabled';
    const liked = isLiked(track.id);
    article.innerHTML = `
      <div class="track-index">${track.trackNumber ?? '-'}</div>
      <div class="track-main">
        <strong>${track.title}</strong>
        <p>${track.artist} | ${track.album}</p>
      </div>
      <div class="track-actions">
        <button class="track-play-button icon-button icon-button-secondary" type="button" data-track-id="${track.id}" aria-label="${actionLabel}" title="${actionLabel}" ${playbackDisabled}>
          ${getIconMarkup(isCurrent && !state.player.paused ? 'pause' : 'play')}
          <span class="sr-only">${actionLabel}</span>
        </button>
        <button class="track-like-button icon-button icon-button-secondary" type="button" data-track-id="${track.id}" data-active="${liked}" aria-label="${liked ? 'Unlike track' : 'Like track'}" title="${liked ? 'Unlike track' : 'Like track'}">
          ${getIconMarkup('heart')}
          <span class="sr-only">${liked ? 'Unlike track' : 'Like track'}</span>
        </button>
        <button class="track-playlist-button button button-secondary" type="button" data-track-id="${track.id}">
          Add To Playlist
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
  trackList.hidden = false;
}

function renderAlbumsView() {
  albumList.innerHTML = '';

  if (state.tracks.length === 0) {
    albumList.hidden = true;
    return;
  }

  const fragment = document.createDocumentFragment();

  groupTracksByAlbum(state.tracks).forEach(album => {
    const card = document.createElement('article');
    card.className = 'browse-card';
    card.innerHTML = `
      <p class="summary-label">Album</p>
      <strong>${album.title}</strong>
      <p class="browse-meta">${album.artist}</p>
      <p class="browse-meta">${album.trackCount} track${album.trackCount === 1 ? '' : 's'} | ${formatDuration(album.totalDuration)}</p>
      <div class="browse-chip-list">
        ${album.tracks
          .slice(0, 4)
          .map(track => `<button class="browse-chip" type="button" data-track-id="${track.id}">${track.trackNumber ?? '-'} ${track.title}</button>`)
          .join('')}
      </div>
    `;
    fragment.append(card);
  });

  albumList.append(fragment);
  albumList.hidden = false;
}

function renderArtistsView() {
  artistList.innerHTML = '';

  if (state.tracks.length === 0) {
    artistList.hidden = true;
    return;
  }

  const fragment = document.createDocumentFragment();

  groupTracksByArtist(state.tracks).forEach(artist => {
    const card = document.createElement('article');
    card.className = 'browse-card';
    card.innerHTML = `
      <p class="summary-label">Artist</p>
      <strong>${artist.name}</strong>
      <p class="browse-meta">${artist.albumCount} album${artist.albumCount === 1 ? '' : 's'} | ${artist.trackCount} track${artist.trackCount === 1 ? '' : 's'}</p>
      <p class="browse-meta">${formatDuration(artist.totalDuration)}</p>
    `;
    fragment.append(card);
  });

  artistList.append(fragment);
  artistList.hidden = false;
}

function renderPlaylistsView() {
  playlistList.innerHTML = '';

  if (state.playlists.length === 0) {
    playlistList.hidden = false;
    playlistList.innerHTML = `
      <div class="empty-state">
        <h3>No playlists yet</h3>
        <p>Create a playlist here, then add tracks from your library results and track rows.</p>
      </div>
    `;
    return;
  }

  const fragment = document.createDocumentFragment();

  state.playlists.forEach(playlist => {
    const playlistTracks = playlist.trackIds
      .map(trackId => getTrackById(trackId))
      .filter(Boolean);

    const card = document.createElement('article');
    card.className = 'browse-card';
    if (playlist.id === state.selectedPlaylistId) {
      card.dataset.current = 'true';
    }
    card.innerHTML = `
      <p class="summary-label">Playlist</p>
      <strong>${playlist.name}</strong>
      <p class="browse-meta">${playlist.trackIds.length} track${playlist.trackIds.length === 1 ? '' : 's'}</p>
      <button class="button button-secondary playlist-select-button" type="button" data-playlist-id="${playlist.id}">
        ${playlist.id === state.selectedPlaylistId ? 'Selected Playlist' : 'Select Playlist'}
      </button>
      <div class="browse-chip-list">
        ${playlistTracks
          .slice(0, 5)
          .map(track => `<button class="browse-chip" type="button" data-track-id="${track.id}">${track.title}</button>`)
          .join('')}
      </div>
    `;
    fragment.append(card);
  });

  playlistList.append(fragment);
  playlistList.hidden = false;
}

function renderLikedView() {
  const likedTracks = state.tracks.filter(track => isLiked(track.id));
  renderTracksView(likedTracks);
}

function renderRecentView() {
  const recentTracks = getRecentTracks();

  if (recentTracks.length === 0) {
    trackList.hidden = false;
    trackList.innerHTML = `
      <div class="empty-state">
        <h3>No recent plays yet</h3>
        <p>Start playback from your library and the most recently played tracks will appear here.</p>
      </div>
    `;
    return;
  }

  renderTracksView(recentTracks);
}

function renderSearchResults() {
  const results = getSearchResults();
  const hasQuery = Boolean(results.query);
  searchResults.innerHTML = '';
  searchResults.hidden = !hasQuery;

  if (!hasQuery) {
    return;
  }

  const totalMatches =
    results.tracks.length +
    results.albums.length +
    results.artists.length +
    results.playlists.length;

  if (totalMatches === 0) {
    searchResults.innerHTML = `
      <div class="empty-state">
        <h3>No matches yet</h3>
        <p>Try a track title, artist, album, or playlist name from your local library.</p>
      </div>
    `;
    return;
  }

  const sections = [];

  if (results.tracks.length > 0) {
    sections.push(`
      <section class="search-section">
        <div class="search-section-header">
          <p class="summary-label">Tracks</p>
          <strong>${results.tracks.length} match${results.tracks.length === 1 ? '' : 'es'}</strong>
        </div>
        <div class="track-list">
          ${results.tracks
            .map(track => {
              const isCurrent = track.id === state.player.currentTrackId;
              const actionLabel = isCurrent && !state.player.paused ? 'Pause' : 'Play';
              return `
                <article class="track-row" ${isCurrent ? 'data-current="true"' : ''}>
                  <div class="track-index">${track.trackNumber ?? '-'}</div>
                  <div class="track-main">
                    <strong>${track.title}</strong>
                    <p>${track.artist} | ${track.album}</p>
                  </div>
                  <div class="track-actions">
                    <button class="track-play-button icon-button icon-button-secondary" type="button" data-track-id="${track.id}" aria-label="${actionLabel}" title="${actionLabel}" ${canPlayTrack(track) ? '' : 'disabled'}>
                      ${getIconMarkup(isCurrent && !state.player.paused ? 'pause' : 'play')}
                      <span class="sr-only">${actionLabel}</span>
                    </button>
                    <button class="track-like-button icon-button icon-button-secondary" type="button" data-track-id="${track.id}" data-active="${track.liked}" aria-label="${track.liked ? 'Unlike track' : 'Like track'}" title="${track.liked ? 'Unlike track' : 'Like track'}">
                      ${getIconMarkup('heart')}
                      <span class="sr-only">${track.liked ? 'Unlike track' : 'Like track'}</span>
                    </button>
                  </div>
                  <div class="track-meta">
                    <span>${track.liked ? 'Liked' : 'Track'}</span>
                    <span>${formatDuration(track.duration)}</span>
                  </div>
                </article>
              `;
            })
            .join('')}
        </div>
      </section>
    `);
  }

  if (results.playlists.length > 0) {
    sections.push(`
      <section class="search-section">
        <div class="search-section-header">
          <p class="summary-label">Playlists</p>
          <strong>${results.playlists.length} match${results.playlists.length === 1 ? '' : 'es'}</strong>
        </div>
        <div class="browse-grid">
          ${results.playlists
            .map(playlist => `
              <article class="browse-card">
                <p class="summary-label">Playlist</p>
                <strong>${playlist.name}</strong>
                <p class="browse-meta">${playlist.trackIds.length} track${playlist.trackIds.length === 1 ? '' : 's'}</p>
                <button class="button button-secondary playlist-select-button" type="button" data-playlist-id="${playlist.id}">
                  ${playlist.id === state.selectedPlaylistId ? 'Selected Playlist' : 'Select Playlist'}
                </button>
                <div class="browse-chip-list">
                  ${playlist.tracks
                    .slice(0, 4)
                    .map(track => `<button class="browse-chip" type="button" data-track-id="${track.id}">${track.title}</button>`)
                    .join('')}
                </div>
              </article>
            `)
            .join('')}
        </div>
      </section>
    `);
  }

  if (results.albums.length > 0) {
    sections.push(`
      <section class="search-section">
        <div class="search-section-header">
          <p class="summary-label">Albums</p>
          <strong>${results.albums.length} match${results.albums.length === 1 ? '' : 'es'}</strong>
        </div>
        <div class="browse-grid">
          ${results.albums
            .map(album => `
              <article class="browse-card">
                <p class="summary-label">Album</p>
                <strong>${album.title}</strong>
                <p class="browse-meta">${album.artist}</p>
                <p class="browse-meta">${album.trackCount} track${album.trackCount === 1 ? '' : 's'} | ${formatDuration(album.totalDuration)}</p>
                <div class="browse-chip-list">
                  ${album.tracks
                    .slice(0, 4)
                    .map(track => `<button class="browse-chip" type="button" data-track-id="${track.id}">${track.trackNumber ?? '-'} ${track.title}</button>`)
                    .join('')}
                </div>
              </article>
            `)
            .join('')}
        </div>
      </section>
    `);
  }

  if (results.artists.length > 0) {
    sections.push(`
      <section class="search-section">
        <div class="search-section-header">
          <p class="summary-label">Artists</p>
          <strong>${results.artists.length} match${results.artists.length === 1 ? '' : 'es'}</strong>
        </div>
        <div class="browse-grid">
          ${results.artists
            .map(artist => `
              <article class="browse-card">
                <p class="summary-label">Artist</p>
                <strong>${artist.name}</strong>
                <p class="browse-meta">${artist.albumCount} album${artist.albumCount === 1 ? '' : 's'} | ${artist.trackCount} track${artist.trackCount === 1 ? '' : 's'}</p>
                <p class="browse-meta">${formatDuration(artist.totalDuration)}</p>
              </article>
            `)
            .join('')}
        </div>
      </section>
    `);
  }

  searchResults.innerHTML = sections.join('');
}

function renderLibraryBrowser() {
  clearLibraryButton.hidden = state.tracks.length === 0 && state.playlists.length === 0;
  updateBrowseTabs();
  updatePlaylistControls();
  updateSearchControls();
  renderPlaylistsView();

  if (state.tracks.length === 0 && state.playlists.length === 0) {
    emptyState.hidden = false;
    trackList.hidden = true;
    albumList.hidden = true;
    artistList.hidden = true;
    searchResults.hidden = true;
    updateSummary();
    updateNowPlaying();
    renderQueue();
    return;
  }

  emptyState.hidden = state.tracks.length > 0 || state.playlists.length > 0;
  const searchActive = Boolean(state.searchQuery.trim());
  trackList.hidden = !['tracks', 'liked', 'recent'].includes(state.browseView);
  albumList.hidden = state.browseView !== 'albums';
  artistList.hidden = state.browseView !== 'artists';

  if (searchActive) {
    trackList.hidden = true;
    albumList.hidden = true;
    artistList.hidden = true;
    renderSearchResults();
    updateSummary();
    updateNowPlaying();
    renderQueue();
    return;
  }

  searchResults.hidden = true;

  if (state.browseView === 'tracks') {
    renderTracksView();
  } else if (state.browseView === 'liked') {
    renderLikedView();
  } else if (state.browseView === 'recent') {
    renderRecentView();
  } else if (state.browseView === 'albums') {
    renderAlbumsView();
  } else {
    renderArtistsView();
  }

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
  state.likedTrackIds = normalizeLikedTrackIds(state.likedTrackIds, state.tracks);
  state.playlists = normalizePlaylists(state.playlists, state.tracks);
  state.recentTrackIds = normalizeRecentTrackIds(state.recentTrackIds, state.tracks);
  ensureSelectedPlaylist();

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

function markTrackRecent(trackId) {
  const track = getTrackById(trackId);
  if (!track) {
    return;
  }

  state.recentTrackIds = normalizeRecentTrackIds(
    [track.id, ...state.recentTrackIds.filter(id => id !== track.id)],
    state.tracks
  );
  saveLibrary();
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
  if (options.markRecent !== false && canPlayTrack(track)) {
    markTrackRecent(track.id);
  }

  if (canPlayTrack(track)) {
    audioPlayer.src = track.src;
    audioPlayer.currentTime = 0;
    audioPlayer.volume = state.player.volume;

    if (options.autoplay) {
      audioPlayer.play().catch(error => {
        console.warn('Playback start failed.', error);
        state.player.paused = true;
        updateNowPlaying();
        renderLibraryBrowser();
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
  renderLibraryBrowser();
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
        renderLibraryBrowser();
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

  renderLibraryBrowser();
  setStatus(`Queued "${track.title}" to play next.`, 'success');
}

function toggleLike(trackId = state.player.currentTrackId) {
  const track = getTrackById(trackId);
  if (!track) {
    return;
  }

  const liked = isLiked(track.id);
  state.likedTrackIds = liked
    ? state.likedTrackIds.filter(id => id !== track.id)
    : [...state.likedTrackIds, track.id];
  state.likedTrackIds = normalizeLikedTrackIds(state.likedTrackIds, state.tracks);
  saveLibrary();
  renderLibraryBrowser();
  setStatus(
    liked ? `Removed "${track.title}" from liked songs.` : `Added "${track.title}" to liked songs.`,
    'success'
  );
}

function createPlaylist(name) {
  const normalizedName = String(name || '').trim();
  if (!normalizedName) {
    setStatus('Enter a playlist name before creating it.', 'warning');
    return;
  }

  const duplicate = state.playlists.find(
    playlist => playlist.name.toLowerCase() === normalizedName.toLowerCase()
  );
  if (duplicate) {
    state.selectedPlaylistId = duplicate.id;
    renderLibraryBrowser();
    setStatus(`Selected existing playlist "${duplicate.name}".`, 'warning');
    return;
  }

  const playlist = {
    id: createPlaylistId(normalizedName),
    name: normalizedName,
    trackIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  state.playlists = normalizePlaylists([...state.playlists, playlist], state.tracks);
  state.selectedPlaylistId = playlist.id;
  playlistNameInput.value = '';
  saveLibrary();
  renderLibraryBrowser();
  setStatus(`Created playlist "${playlist.name}".`, 'success');
}

function addTrackToSelectedPlaylist(trackId) {
  const track = getTrackById(trackId);
  const playlist = getPlaylistById(state.selectedPlaylistId);
  if (!track || !playlist) {
    setStatus('Create or select a playlist first.', 'warning');
    return;
  }

  if (playlist.trackIds.includes(track.id)) {
    setStatus(`"${track.title}" is already in "${playlist.name}".`, 'warning');
    return;
  }

  const nextPlaylists = state.playlists.map(entry => {
    if (entry.id !== playlist.id) {
      return entry;
    }

    return {
      ...entry,
      trackIds: [...entry.trackIds, track.id],
      updatedAt: new Date().toISOString()
    };
  });

  state.playlists = normalizePlaylists(nextPlaylists, state.tracks);
  saveLibrary();
  renderLibraryBrowser();
  setStatus(`Added "${track.title}" to "${playlist.name}".`, 'success');
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

function setBrowseView(view) {
  state.browseView = view;
  renderLibraryBrowser();
}

function setSearchQuery(query) {
  state.searchQuery = String(query || '');
  renderLibraryBrowser();
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
    const tracks = await normalizeFiles(fileList);
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
    renderLibraryBrowser();
    setStatus(
      `Imported ${tracks.length} track${tracks.length === 1 ? '' : 's'} into the local library view.${saved ? ' The normalized library, likes, playlists, and recent history were saved locally for reloads.' : ' Local storage is unavailable, so this import is session-only.'} The app shell can stay cached, but playback still belongs to the files imported in this session.`,
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
  const playlistSelectButton = event.target.closest('.playlist-select-button');
  if (playlistSelectButton) {
    state.selectedPlaylistId = playlistSelectButton.dataset.playlistId || null;
    renderLibraryBrowser();
    return;
  }

  const playButtonElement = event.target.closest('.track-play-button');
  if (playButtonElement) {
    togglePlayback(playButtonElement.dataset.trackId);
    return;
  }

  const likeButtonElement = event.target.closest('.track-like-button');
  if (likeButtonElement) {
    toggleLike(likeButtonElement.dataset.trackId);
    return;
  }

  const playlistButtonElement = event.target.closest('.track-playlist-button');
  if (playlistButtonElement) {
    addTrackToSelectedPlaylist(playlistButtonElement.dataset.trackId);
    return;
  }

  const queueButtonElement = event.target.closest('.track-queue-button');
  if (queueButtonElement) {
    queueTrackNext(queueButtonElement.dataset.trackId);
    return;
  }

  const browseChip = event.target.closest('.browse-chip');
  if (browseChip) {
    togglePlayback(browseChip.dataset.trackId);
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
  state.browseView = 'tracks';
  closeExpandedPlayer();
  renderLibraryBrowser();
  setStatus('Cleared the locally stored library index for this browser.', 'warning');
}

function registerPlayerEvents() {
  audioPlayer.volume = state.player.volume;
  setIconButton(previousButton, 'previous', 'Previous track');
  setIconButton(playButton, 'play', 'Play');
  setIconButton(nextButton, 'next', 'Next track');
  updateModeButtons();
  updateLikeButton();

  audioPlayer.addEventListener('play', () => {
    state.player.paused = false;
    updateNowPlaying();
    renderLibraryBrowser();
  });

  audioPlayer.addEventListener('pause', () => {
    state.player.paused = true;
    updateNowPlaying();
    renderLibraryBrowser();
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
    renderLibraryBrowser();
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

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  state.installPromptEvent = event;
  updateInstallStatus();
});

window.addEventListener('appinstalled', () => {
  state.installPromptEvent = null;
  updateInstallStatus();
  setStatus('Installed the app shell for easier return visits. Playback still depends on imported files in this browser session.', 'success');
});

window.addEventListener('online', updateConnectionStatus);
window.addEventListener('offline', updateConnectionStatus);
window.addEventListener('resize', updatePlayerShellMode);
window.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    closeExpandedPlayer();
  }
});

fileInput?.addEventListener('change', event => handleImport(event.target.files));
folderInput?.addEventListener('change', event => handleImport(event.target.files));
clearLibraryButton?.addEventListener('click', handleClearLibrary);
trackList?.addEventListener('click', handleTrackListClick);
playlistList?.addEventListener('click', handleTrackListClick);
albumList?.addEventListener('click', handleTrackListClick);
artistList?.addEventListener('click', handleTrackListClick);
searchResults?.addEventListener('click', handleTrackListClick);
appTabs.forEach(tab => {
  tab.addEventListener('click', () => setAppSection(tab.dataset.section));
});
browseTabs.forEach(tab => {
  tab.addEventListener('click', () => setBrowseView(tab.dataset.view));
});
searchInput?.addEventListener('input', event => {
  setSearchQuery(event.target.value);
});
clearSearchButton?.addEventListener('click', () => {
  if (searchInput) {
    searchInput.value = '';
  }
  setSearchQuery('');
});
createPlaylistButton?.addEventListener('click', () => createPlaylist(playlistNameInput.value));
playlistSelect?.addEventListener('change', event => {
  state.selectedPlaylistId = event.target.value || null;
  renderLibraryBrowser();
});
playlistNameInput?.addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    event.preventDefault();
    createPlaylist(playlistNameInput.value);
  }
});
openExpandedPlayerButton?.addEventListener('click', openExpandedPlayer);
expandPlayerButton?.addEventListener('click', openExpandedPlayer);
stickyAlbumArt?.addEventListener('click', openExpandedPlayer);
closeExpandedPlayerButton?.addEventListener('click', closeExpandedPlayer);
installAppButton?.addEventListener('click', async () => {
  if (!state.installPromptEvent) {
    return;
  }

  const promptEvent = state.installPromptEvent;
  promptEvent.prompt();
  await promptEvent.userChoice.catch(() => null);
  state.installPromptEvent = null;
  updateInstallStatus();
});
likeButton?.addEventListener('click', () => toggleLike());
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
updateAppSections();
updatePlayerShellMode();
updateConnectionStatus();
updateInstallStatus();

if (loadStoredLibrary()) {
  resetQueueFromTracks();
  if (state.tracks.length > 0) {
    state.player.currentTrackId = state.tracks[0].id;
    state.player.queueIndex = 0;
  }
  setStatus(
    'Loaded the locally saved library index for this browser, including likes, playlists, and recent history. Re-import files in this session to enable playback and queue actions.',
    'success'
  );
}

renderLibraryBrowser();
registerServiceWorker();
