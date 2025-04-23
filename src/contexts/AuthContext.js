import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendEmailVerification,
  sendPasswordResetEmail,
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    return signOut(auth);
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  function verifyEmail() {
    return sendEmailVerification(auth.currentUser);
  }

  // Phone authentication
  function setupRecaptcha(phoneNumber) {
    const recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
      'size': 'invisible'
    }, auth);
    return signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
  }

  // Check if user is admin
  async function checkUserRole(uid) {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        setUserRole(userSnap.data().role || 'customer');
        return userSnap.data().role || 'customer';
      } else {
        setUserRole('customer');
        return 'customer';
      }
    } catch (error) {
      console.error("Error checking user role:", error);
      setUserRole('customer');
      return 'customer';
    }
  }

  // Create user profile in Firestore
  async function createUserProfile(user, additionalData) {
    if (!user) return;
    
    const userRef = doc(db, 'users', user.uid);
    const userData = {
      uid: user.uid,
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      displayName: user.displayName || '',
      role: 'customer',
      createdAt: new Date().toISOString(),
      ...additionalData
    };
    
    return setDoc(userRef, userData);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await checkUserRole(user.uid);
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    signup,
    login,
    logout,
    resetPassword,
    verifyEmail,
    setupRecaptcha,
    createUserProfile,
    checkUserRole
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
