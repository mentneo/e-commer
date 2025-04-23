import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging } from "firebase/messaging";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC_8iXpZ3pZEqIon5rNk8uX-Lh5AfhE7CM",
  authDomain: "ecommer-3efa3.firebaseapp.com",
  projectId: "ecommer-3efa3",
  storageBucket: "ecommer-3efa3.firebasestorage.app",
  messagingSenderId: "128426505128",
  appId: "1:128426505128:web:b8ad0e1744577b3b7fa39d",
  measurementId: "G-R5C66D9MSE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const messaging = getMessaging(app);

export { app, auth, db, storage, messaging };
