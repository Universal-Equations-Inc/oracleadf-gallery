var CACHE_VERSION = 2;
var CURRENT_CACHES = {
    'read-through': 'read-through-cache-v' + CACHE_VERSION
};

self.addEventListener('activate', function (event) {
    // Delete all caches that aren't named in CURRENT_CACHES.
    // While there is only one cache in this example, the same logic will handle the case where
    // there are multiple versioned caches.
    var expectedCacheNames = Object.keys(CURRENT_CACHES).map(function (key) {
        return CURRENT_CACHES[key];
    });

    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.map(function (cacheName) {
                    if (expectedCacheNames.indexOf(cacheName) === -1) {
                        // If this cache name isn't present in the array of "expected" cache names, then delete it.
                        console.log('Deleting out of date cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', function (event) {

    event.respondWith(
        caches.open(CURRENT_CACHES['read-through']).then(function (cache) {
            return cache.match(event.request).then(function (response) {
                if (response) {
                    // If there is an entry in the cache for event.request, then response will be defined
                    // and we can just return it.

                    return response;
                }

                // Otherwise, if there is no entry in the cache for event.request, response will be
                // undefined, and we need to fetch() the resource.
                console.log(' No response for %s found in cache. ' +
                    'About to fetch from network...', event.request.url);

                // We call .clone() on the request since we might use it in the call to cache.put() later on.
                // Both fetch() and cache.put() "consume" the request, so we need to make a copy.
                // (see https://fetch.spec.whatwg.org/#dom-request-clone)
                return fetch(event.request.clone()).then(function (response) {

                    // Modified here, added check for response.type == 'basic' to only cache local assets
                    if (response.status < 400 && response.type === 'basic') {
                        // We need to call .clone() on the response object to save a copy of it to the cache.
                        // (https://fetch.spec.whatwg.org/#dom-request-clone)
                        cache.put(event.request, response.clone());
                    }

                    // Return the original response object, which will be used to fulfill the resource request.
                    return response;
                });
            }).catch(function (error) {
                // This catch() will handle exceptions that arise from the match() or fetch() operations.
                // Note that a HTTP error response (e.g. 404) will NOT trigger an exception.
                // It will return a normal response object that has the appropriate error code set.
                console.error('  Read-through caching failed:', error);

                throw error;
            });
        })
    );
});