import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCWqvREnTLwCuUX1OO4htZ4evAiKiW65ps',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'karate-webapp-e2d53.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'karate-webapp-e2d53',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'karate-webapp-e2d53.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '212299839451',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:212299839451:web:923fb7e8fcc3d0a90dd9fe'
};

// Check if valid Firebase configuration is provided
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey.startsWith('AIza')
);

let app = null;
let db = null;
let auth = null;
let storage = null;

if (isFirebaseConfigured) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

    // Enable offline multi-tab persistence in Firestore
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });
    } catch {
      // Fallback to standard getFirestore if already initialized
      db = getFirestore(app);
    }

    auth = getAuth(app);
    storage = getStorage(app);
    console.log('✅ Firebase initialized with real cloud Firestore & offline persistence');
  } catch (err) {
    console.error('Firebase initialization error:', err);
  }
}

export { app, db, auth, storage };
