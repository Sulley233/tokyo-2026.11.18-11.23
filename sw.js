// Service Worker（可选）——把本文件放到仓库根目录，与 index.html 同级。
// 缓存策略：install 时预缓存 index.html；fetch 对导航请求采用网络优先，失败时回退到缓存。
const CACHE_NAME = 'tokyo-trip-v1';
const PRECACHE = [
  '/index.html',
  '/'
];

// 安装：预缓存页面
self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// 激活：清理旧缓存
self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// 请求拦截：导航请求网络优先，失败回退缓存；其他请求网络优先失败回退缓存
self.addEventListener('fetch', evt => {
  const req = evt.request;
  if(req.mode === 'navigate' || (req.method === 'GET' && req.headers.get('accept') && req.headers.get('accept').includes('text/html'))){
    evt.respondWith(
      fetch(req).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, copy));
        return resp;
      }).catch(() => caches.match('/index.html'))
    );
    return;
  }
  evt.respondWith(
    fetch(req).then(resp => {
      // 可选：缓存静态资源（不强制）
      return resp;
    }).catch(() => caches.match(req))
  );
});