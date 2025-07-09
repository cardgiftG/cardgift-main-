// CardGift Service Worker v2.0
const CACHE_NAME = 'cardgift-v2';
const urlsToCache = [
    '/',
    '/index.html',
    '/generator.html',
    '/registration.html',
    '/dashboard.html',
    '/card-viewer.html',
    '/preview.html',
    '/referral-system.html',
    '/css/style.css',
    '/js/wallet.js',
    '/js/api.js',
    '/js/config.js',
    // Добавляем новые файлы для offline работы
    '/manifest.json'
];

// Установка SW и кеширование файлов
self.addEventListener('install', function(event) {
    console.log('🔧 CardGift SW установка...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('✅ Кеширование файлов CardGift');
                return cache.addAll(urlsToCache);
            })
            .catch(function(error) {
                console.error('❌ Ошибка кеширования:', error);
            })
    );
    // Принудительное обновление
    self.skipWaiting();
});

// Перехват запросов и работа офлайн
self.addEventListener('fetch', function(event) {
    // Пропускаем API запросы для онлайн работы
    if (event.request.url.includes('/api/') || 
        event.request.url.includes('chrome-extension://')) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                // Возвращаем из кеша если есть
                if (response) {
                    console.log('📦 Из кеша:', event.request.url);
                    return response;
                }
                
                // Загружаем из сети
                return fetch(event.request)
                    .then(function(response) {
                        // Кешируем новые запросы
                        if (response && response.status === 200) {
                            const responseClone = response.clone();
                            caches.open(CACHE_NAME)
                                .then(function(cache) {
                                    cache.put(event.request, responseClone);
                                });
                        }
                        return response;
                    })
                    .catch(function() {
                        // Fallback для офлайн режима
                        if (event.request.destination === 'document') {
                            return caches.match('/index.html');
                        }
                    });
            })
    );
});

// Обновление кеша
self.addEventListener('activate', function(event) {
    console.log('🔄 CardGift SW активация...');
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Удаление старого кеша:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // Принудительное управление всеми клиентами
    self.clients.claim();
});

// Обработка сообщений от клиента
self.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Push уведомления (для будущего)
self.addEventListener('push', function(event) {
    console.log('📬 Push уведомление получено');
    
    if (event.data) {
        const options = {
            body: event.data.text(),
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            tag: 'cardgift-notification'
        };
        
        event.waitUntil(
            self.registration.showNotification('CardGift', options)
        );
    }
});

console.log('🚀 CardGift Service Worker v2.0 загружен');
