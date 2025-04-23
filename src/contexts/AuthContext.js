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
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState("customer");
  const [loading, setLoading] = useState(true);

  function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  async function register(email, password, name) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", userCredential.user.uid), {
        name,
        email,
        role: "customer",
        createdAt: new Date().toISOString()
      });
      return userCredential;
    } catch (error) {
      throw error;
    }
  }

  async function login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential;
    } catch (error) {
      throw error;
    }
  }

  async function adminLogin(email, password, adminSecret) {
    console.log("Admin login attempt with secret:", adminSecret);
    
    // Hardcode a working admin secret for development/testing purposes
    const ADMIN_SECRET = "your-super-secret-admin-key";
    
    if (adminSecret !== ADMIN_SECRET) {
      console.log("Invalid admin secret");
      throw new Error("Invalid admin secret");
    }
    
    try {
      console.log("Attempting Firebase auth with email and password");
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("User authenticated:", userCredential.user.uid);
      
      // Check if user has admin role in Firestore
      const userRef = doc(db, "users", userCredential.user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        console.log("User document not found, creating with admin role");
        // Create user profile with admin role if it doesn't exist
        await setDoc(userRef, {
          email: userCredential.user.email,
          role: "admin",
          createdAt: new Date().toISOString()
        });
        setUserRole("admin");
        return userCredential;
      }
      
      const userData = userSnap.data();
      console.log("User data retrieved:", userData);
      
      if (userData.role === "admin") {
        console.log("User is admin, login successful");
        setUserRole("admin");
        return userCredential;
      } else {
        console.log("User is not admin, updating to admin role");
        // Update user to admin role
        await updateDoc(userRef, {
          role: "admin"
        });
        setUserRole("admin");
        return userCredential;
      }
    } catch (error) {
      console.error("Admin login error:", error);
      throw error;
    }
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

  function setupRecaptcha(phoneNumber) {
    const recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
      'size': 'invisible'
    }, auth);
    return signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
  }

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

  async function getUserProfile(user) {
    if (!user) return null;
    
    try {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setUserRole(docSnap.data().role);
        return docSnap.data();
      } else {
        setUserRole("customer");
        return null;
      }
    } catch (error) {
      console.error("Error getting user profile:", error);
      setUserRole("customer");
      return null;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await getUserProfile(user);
      } else {
        setUserRole("customer");
      }
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    signup,
    register,
    login,
    adminLogin,
    logout,
    resetPassword,
    verifyEmail,
    setupRecaptcha,
    createUserProfile,
    checkUserRole,
    isAdmin: userRole === "admin"
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
