
// Service Worker pour ProfiV - Mode Offline Support

const CACHE_NAME = 'profiV-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache ouvert');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Suppression de l\'ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - retourner la réponse depuis le cache
        if (response) {
          return response;
        }

        // Clone de la requête
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response) => {
          // Vérifier si la réponse est valide
          if (!response || response.status !== 200 || response.type === 'opaque') {
            return response;
          }

          // Clone de la réponse
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(() => {
          // En cas d'erreur, retourner une page offline personnalisée
          if (event.request.destination === 'document') {
            return caches.match('/offline.html');
          }
        });
      })
  );
});

// Synchronisation en arrière-plan pour les exercices générés
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-exercises') {
    event.waitUntil(syncExercises());
  }
});

// Notification push
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nouveaux exercices disponibles!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('ProfiV', options)
  );
});

// Fonction de synchronisation des exercices
async function syncExercises() {
  try {
    // Récupérer les exercices en attente depuis IndexedDB
    const pendingExercises = await getPendingExercises();

    // Envoyer au serveur
    for (const exercise of pendingExercises) {
      await syncExercise(exercise);
    }

    // Nettoyer les exercices synchronisés
    await clearPendingExercises();
  } catch (error) {
    console.error('Erreur lors de la synchronisation:', error);
  }
}

// Fonctions utilitaires pour IndexedDB
function getPendingExercises() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ProfiVDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['pendingExercises'], 'readonly');
      const store = transaction.objectStore('pendingExercises');
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
  });
}

function syncExercise(exercise) {
  // Implémenter la logique de synchronisation
  return fetch('/api/sync-exercises', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(exercise)
  });
}

function clearPendingExercises() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ProfiVDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['pendingExercises'], 'readwrite');
      const store = transaction.objectStore('pendingExercises');
      const clearRequest = store.clear();

      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    };
  });
}
