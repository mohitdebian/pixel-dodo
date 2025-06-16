import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { BASE_URLS } from '@/config/urls';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: BASE_URLS.FIREBASE.AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: BASE_URLS.FIREBASE.STORAGE_BUCKET,
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
    BASE_URLS.DEV.LOCALHOST,
    'http://localhost:3000',
    'https://pixel-magic-ai.web.app',
    'https://pixel-magic-ai.firebaseapp.com',
    BASE_URLS.DEV.NGROK_URL
  ];

  // Set allowed origins in Firebase Auth
  auth.settings.appVerificationDisabledForTesting = false;
  auth.settings.appVerificationDisabledForTesting = allowedOrigins.includes(window.location.origin);
} catch (error) {
  console.error('Error initializing Firebase:', error);
  throw error;
}

export { auth, db, analytics }; 