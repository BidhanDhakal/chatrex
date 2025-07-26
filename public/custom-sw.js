// Custom service worker for offline message access

const CACHE_NAME = 'chatrex-offline-v1';

// Resources to cache
const STATIC_RESOURCES = [
    '/',
    '/manifest.json',
    '/favicon.ico',
    '/lo-chat.svg',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    '/notification.mp3',
    '/offline.html'
];

// Install event - cache static assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caching static resources');
                return cache.addAll(STATIC_RESOURCES);
            })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - serve from cache if available, otherwise fetch from network
self.addEventListener('fetch', event => {
    // Skip non-GET requests and browser extensions
    if (event.request.method !== 'GET' ||
        !event.request.url.startsWith(self.location.origin)) {
        return;
    }

    // Handle API requests (messages)
    if (event.request.url.includes('/api/') ||
        event.request.url.includes('/convex/')) {
        // Network first strategy for API requests
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Clone the response
                    const responseToCache = response.clone();

                    // Cache successful responses
                    if (response.status === 200) {
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                    }

                    return response;
                })
                .catch(() => {
                    // If network fails, try to serve from cache
                    return caches.match(event.request);
                })
        );
        return;
    }

    // For other requests (static assets, pages)
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                // Return cached response if found
                if (cachedResponse) {
                    return cachedResponse;
                }

                // Otherwise fetch from network
                return fetch(event.request)
                    .then(response => {
                        // Don't cache if not a valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone the response
                        const responseToCache = response.clone();

                        // Add to cache
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(error => {
                        // Special handling for HTML requests - show offline page
                        if (event.request.headers.get('accept')?.includes('text/html')) {
                            return caches.match('/offline.html');
                        }
                        throw error;
                    });
            })
    );
});

// Listen for message events from the main thread
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'CACHE_MESSAGES') {
        // Cache conversation data sent from the client
        const { conversationId, messages } = event.data;

        if (conversationId && messages) {
            caches.open(CACHE_NAME).then(cache => {
                // Create a response object from the messages data
                const messagesResponse = new Response(JSON.stringify(messages), {
                    headers: { 'Content-Type': 'application/json' }
                });

                // Cache the messages with a custom URL that includes the conversation ID
                const messagesUrl = new URL(`/offline/conversations/${conversationId}/messages`, self.location.origin).href;
                cache.put(messagesUrl, messagesResponse);

                // Respond to the client
                self.clients.matchAll().then(clients => {
                    clients.forEach(client => {
                        client.postMessage({
                            type: 'MESSAGES_CACHED',
                            conversationId
                        });
                    });
                });
            });
        }
    }
});

// Function to retrieve cached messages
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'GET_CACHED_MESSAGES') {
        const { conversationId } = event.data;

        if (conversationId) {
            const messagesUrl = new URL(`/offline/conversations/${conversationId}/messages`, self.location.origin).href;

            caches.open(CACHE_NAME)
                .then(cache => cache.match(messagesUrl))
                .then(response => {
                    if (response) {
                        return response.json();
                    }
                    return null;
                })
                .then(messages => {
                    // Send the cached messages back to the client
                    event.source.postMessage({
                        type: 'CACHED_MESSAGES',
                        conversationId,
                        messages
                    });
                });
        }
    }
}); 