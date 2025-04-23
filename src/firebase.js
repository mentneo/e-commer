import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC_8iXpZ3pZEqIon5rNk8uX-Lh5AfhE7CM",
  authDomain: "ecommer-3efa3.firebaseapp.com",
  projectId: "ecommer-3efa3",
  storageBucket: "ecommer-3efa3.appspot.com",
  messagingSenderId: "128426505128",
  appId: "1:128426505128:web:b8ad0e1744577b3b7fa39d",
  measurementId: "G-R5C66D9MSE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
