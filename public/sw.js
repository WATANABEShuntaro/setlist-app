const CACHE_NAME = 'setlist-app-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/globals.css',
];

// Install イベント
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch(() => {
        // キャッシュできないファイルがあっても無視
      });
    })
  );
  self.skipWaiting();
});

// Activate イベント
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch イベント
self.addEventListener('fetch', (event) => {
  // GETリクエストのみ対応
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(event.request)
        .then((response) => {
          // ステータスが200でない場合はキャッシュしない
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          // レスポンスをクローン
          const responseToCache = response.clone();

          // キャッシュに保存
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // ネットワークエラー時はキャッシュを返す
          return caches.match(event.request);
        });
    })
  );
});

