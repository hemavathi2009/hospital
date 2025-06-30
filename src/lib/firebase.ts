
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAvjqUElrCY8ucnM2I5ryFl_xcW3Ag0M8M",
  authDomain: "hospital-b42cc.firebaseapp.com",
  projectId: "hospital-b42cc",
  storageBucket: "hospital-b42cc.firebasestorage.app",
  messagingSenderId: "732150560349",
  appId: "1:732150560349:web:d2adc5747efc3574c5ffb4",
  measurementId: "G-YL6BBV4JH0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

export default app;
