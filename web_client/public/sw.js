self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

let config = {
  token: '',
  apiBase: ''
};

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'INIT') {
    config.token = event.data.token;
    // Ensure apiBase is absolute for reliable comparison
    config.apiBase = new URL(event.data.apiBase, self.location.origin).href;
  }
});

self.addEventListener('fetch', (event) => {
  if (!config.token || !config.apiBase) return;

  const requestUrl = event.request.url;
  const url = new URL(requestUrl);
  
  // Enforce strictly same-origin for Authorization injection
  if (url.origin !== self.location.origin) return;
  
  // Check if the request is going to our API base
  if (requestUrl.startsWith(config.apiBase)) {
    const url = new URL(requestUrl);
    const path = url.pathname;
    
    // Only intercept media/download endpoints that browsers fetch directly
    if (path.includes('/files/') || path.includes('/stream/') || path.includes('/zip')) {
      const newHeaders = new Headers(event.request.headers);
      newHeaders.set('Authorization', `Bearer ${config.token}`);
      
      const newRequest = new Request(event.request, {
        headers: newHeaders,
        mode: 'cors'
      });
      
      event.respondWith(fetch(newRequest));
    }
  }
});
