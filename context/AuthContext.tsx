import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import {
  User,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

// Ensure browser-based redirects can resolve properly
WebBrowser.maybeCompleteAuthSession();

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const googleClientId = Platform.select({
    ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    default: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  }) || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';

  const [, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: googleClientId,
      redirectUri: AuthSession.makeRedirectUri({ scheme: 'healthee' }),
      scopes: ['profile', 'email'],
      responseType: 'id_token',
      usePKCE: false,
    },
    {
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
    }
  );

  // Single source of truth for auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Handle Expo AuthSession response (Expo Go / native dev flow)
  useEffect(() => {
    if (response?.type === 'success' && response.authentication?.idToken) {
      const { idToken } = response.authentication;
      const credential = GoogleAuthProvider.credential(idToken);
      setLoading(true);
      signInWithCredential(auth, credential)
        .catch((err) => console.error('Firebase credential sign-in error:', err))
        .finally(() => setLoading(false));
    }
  }, [response]);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      if (Platform.OS === 'web') {
        // signInWithPopup works in this setup.
        // The "COOP policy would block window.closed" console warning is non-fatal —
        // Firebase handles it gracefully and auth completes successfully.
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      } else {
        const isStandaloneNative = (Platform.OS as string) !== 'web' && !__DEV__;
        if (isStandaloneNative) {
          const { GoogleSignin } = require('@react-native-google-signin/google-signin');
          await GoogleSignin.hasPlayServices();
          const { idToken } = await GoogleSignin.signIn();
          const credential = GoogleAuthProvider.credential(idToken);
          await signInWithCredential(auth, credential);
        } else {
          await promptAsync();
        }
      }
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const signOutUser = async () => {
    setLoading(true);
    try {
      if (Platform.OS !== 'web') {
        try {
          const { GoogleSignin } = require('@react-native-google-signin/google-signin');
          if (await GoogleSignin.isSignedIn()) {
            await GoogleSignin.signOut();
          }
        } catch {}
      }
      await firebaseSignOut(auth);
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    signInWithGoogle,
    signOutUser,
    showAuthModal,
    setShowAuthModal,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
