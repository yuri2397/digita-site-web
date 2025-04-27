// Service Worker pour mise en cache des images
const CACHE_NAME = 'caftana-cache-v2';
const CACHED_URLS = [
    // Images principales
    'assets/images/logo-digita.png',
    'assets/images/bg/10.jpg',
    'assets/images/bg/09.jpg',
    'assets/images/bg/15.jpg',
    'assets/images/people-office-work-day.jpg',

    // Images portfolio
    'assets/images/portfolio/bezeyn-app.jpg',
    'assets/images/portfolio/tranchpay.jpg',
    'assets/images/portfolio/gpet.png',
    'assets/images/portfolio/twinz.png',

    // Images services
    'assets/images/tag-html.jpg',
    'assets/images/dev-web.jpg',
    'assets/images/dev-mobile.jpg',
    'assets/images/support-consulting.jpg',
    'assets/images/services/4by3/03.jpg',
    'assets/images/services/4by3/06.jpg',

    // Favicon
    'assets/favicon/favicon-96x96.png',
    'assets/favicon/favicon.svg',
    'assets/favicon/favicon.ico',
    'assets/favicon/apple-touch-icon.png',
    'assets/favicon/site.webmanifest'
];

// Installation du Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache ouvert');
                return cache.addAll(CACHED_URLS);
            })
            .then(() => {
                return self.skipWaiting();
            })
    );
});

// Activation du Service Worker
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];

    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        // Suppression des anciens caches
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});

// Interception des requêtes fetch
self.addEventListener('fetch', event => {
    // Vérifier si la requête concerne une image
    if (event.request.destination === 'image' ||
        CACHED_URLS.includes(new URL(event.request.url).pathname)) {
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    // Utiliser le cache si disponible
                    if (response) {
                        return response;
                    }

                    // Sinon faire la requête réseau
                    return fetch(event.request).then(response => {
                        // Ne pas mettre en cache les réponses non valides
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Cloner la réponse car elle ne peut être utilisée qu'une fois
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    });
                })
        );
    } else {
        // Comportement par défaut pour les autres requêtes
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match(event.request);
            })
        );
    }
});

// Préchargement d'images supplémentaires
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'CACHE_IMAGES') {
        const imagesToCache = event.data.images || [];

        caches.open(CACHE_NAME)
            .then(cache => {
                return Promise.all(
                    imagesToCache.map(imageUrl => {
                        return fetch(imageUrl)
                            .then(response => {
                                if (!response || response.status !== 200) {
                                    return;
                                }
                                return cache.put(imageUrl, response);
                            })
                            .catch(error => {
                                console.error('Erreur lors du préchargement:', imageUrl, error);
                            });
                    })
                );
            });
    }
});