import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, onSnapshot, getDocFromServer, serverTimestamp, connectFirestoreEmulator } from 'firebase/firestore';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const firestoreDatabaseId = import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID;

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firestoreDatabaseId);
export const auth = getAuth(app);

if (import.meta.env.VITE_USE_EMULATOR === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
}

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user') {
      console.warn("Sign-in popup was closed by the user before completion.");
      return null;
    }
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

export const logout = () => signOut(auth);

export async function provisionUserProfile(user: User) {
  const profileRef = doc(db, 'users', user.uid, 'profile', 'main');
  const profileSnap = await getDoc(profileRef);

  if (profileSnap.exists()) {
    await setDoc(profileRef, {
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      lastLoginAt: serverTimestamp(),
    }, { merge: true });
  } else {
    await setDoc(profileRef, {
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });
  }
}

// Test connection to Firestore
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is offline.");
    }
  }
}
testConnection();

export { onAuthStateChanged };
export type { User };
