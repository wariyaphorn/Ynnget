// Service worker สำหรับแอพวัคซีน/สุขภาพลูก (YNN Family)
// แคช "app shell" (ตัวหน้าเว็บเอง) ไว้ เปิดแอพได้แม้ไม่มีเน็ต ส่วนข้อมูลจริง (Firestore) ยังต้องมีเน็ตเพื่อ sync ตามปกติ
const CACHE_NAME = 'vaccine-app-v1';
const APP_SHELL = ['./', './index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // เฉพาะไฟล์จากโดเมนเดียวกัน (ตัวแอพเอง) เท่านั้นที่แคช ส่วน Firebase/Google Fonts/CDN ปล่อยให้ผ่านเน็ตตามปกติ
  const isSameOrigin = event.request.url.startsWith(self.location.origin);
  if (!isSameOrigin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
