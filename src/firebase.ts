import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBv8B6FN4aByCoNni6kgeD5KeAb5t3Ahnk",
  authDomain: "michaelstars-6b4a4.firebaseapp.com",
  databaseURL: "https://michaelstars-6b4a4-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "michaelstars-6b4a4",
  storageBucket: "michaelstars-6b4a4.firebasestorage.app",
  messagingSenderId: "692375492891",
  appId: "1:692375492891:web:e7540999cf6ba10d311bbe",
  measurementId: "G-8QNTDLLS6V",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable offline persistence (best-effort, may fail in some browsers)
enableIndexedDbPersistence(db).catch(() => {
  // Silently fail — multi-tab or unsupported browser
});
