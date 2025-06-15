import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

let auth;
let db;
let analytics;

try {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  
  // Initialize analytics only if supported
  isSupported().then(yes => yes ? getAnalytics(app) : null)
    .then(analyticsInstance => {
      if (analyticsInstance) {
        analytics = analyticsInstance;
        console.log('Firebase Analytics initialized successfully');
      }
    })
    .catch(err => console.log('Analytics not supported:', err));

  // Configure allowed origins for Firebase Auth
  auth.useDeviceLanguage();
  auth.settings.appVerificationDisabledForTesting = false;

  // Add allowed origins for Firebase Auth
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://pixel-magic-ai.web.app',
    'https://pixel-magic-ai.firebaseapp.com',
    'https://082e-2405-201-5c28-600b-62a-d30-d701-4b24.ngrok-free.app'
  ];

  // Set allowed origins in Firebase Auth
  auth.settings.appVerificationDisabledForTesting = false;
  auth.settings.appVerificationDisabledForTesting = allowedOrigins.includes(window.location.origin);
} catch (error) {
  console.error('Error initializing Firebase:', error);
  throw error;
}

export { auth, db, analytics }; 