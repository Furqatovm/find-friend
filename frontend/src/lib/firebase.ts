import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
 const firebaseConfig = {
  apiKey: "AIzaSyDYKwTAEKwROXz-3TzSJSpghEOCnsbWsCQ",
  authDomain: "urgut-news.firebaseapp.com",
  projectId: "urgut-news",
  storageBucket: "urgut-news.firebasestorage.app",
  messagingSenderId: "143227294148",
  appId: "1:143227294148:web:6e4a11cacfb7486cfd1491",
  measurementId: "G-FZ3ECF2LG8"
};

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { signInWithPopup };
