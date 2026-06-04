import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const isFirebaseConfigured = !!process.env.EXPO_PUBLIC_FIREBASE_API_KEY;

if (!isFirebaseConfigured) {
  console.warn(
    '⚠️ Firebase environment variables are not configured in your .env file.\n' +
    'Please copy the Firebase environment keys from .env.example to your .env file to enable authentication and cloud backup.'
  );
}

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth conditionally based on platform runtime
let auth: Auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  // @ts-ignore - Require native persistence from same package during mobile Metro compile
  const { getReactNativePersistence } = require('firebase/auth');
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

// Initialize Cloud Firestore
const db = getFirestore(app);

// Configure Native Google Sign-In (only in standalone native app runtimes)
if (Platform.OS !== 'web') {
  try {
    const { GoogleSignin } = require('@react-native-google-signin/google-signin');
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      iosClientId: Platform.OS === 'ios' ? process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID : undefined,
    });
  } catch (e) {
    console.warn('Native Google Sign-In is not initialized. (Likely running in Expo Go; falling back to web flow).');
  }
}

export { app, auth, db };
