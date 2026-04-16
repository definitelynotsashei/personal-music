const serviceWorkerSupported = 'serviceWorker' in navigator;

function renderStatus() {
  const panel = document.querySelector('.panel');
  if (!panel) {
    return;
  }

  const status = document.createElement('p');
  status.className = 'status';
  status.textContent = serviceWorkerSupported
    ? 'Starter app is ready for feature work.'
    : 'Starter app loaded without service worker support.';
  panel.append(status);
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

renderStatus();
registerServiceWorker();
