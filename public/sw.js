self.addEventListener("install", () => self.skipWaiting())
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()))

// Chrome still treats a fetch handler as part of installability. No respondWith:
// requests go to the network exactly as they would without this worker.
self.addEventListener("fetch", () => {})
