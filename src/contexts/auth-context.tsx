
"use client";

import type { User as FirebaseUser } from "firebase/auth";
import { auth, db } from "@/lib/firebase"; // appCheck removed
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, query, collection, where, getDocs, updateDoc } from "firebase/firestore";
import type { ReactNode} from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { LoadingScreen } from "@/components/common/loading-screen";
import type { UserProfile, UserProfileUpdateData, AuthContextType } from "@/lib/types";

const INTENDED_ROLE_LS_KEY = "clipperconnect_intended_role";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); 

    const processAuthUser = async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          setUser(userDocSnap.data() as UserProfile);
          localStorage.removeItem(INTENDED_ROLE_LS_KEY);
        } else {
          const intendedRole = localStorage.getItem(INTENDED_ROLE_LS_KEY) as UserProfile['role'] | null;
          const roleToSet = intendedRole || 'user';
          
          if (firebaseUser.email) {
            const emailQuery = query(collection(db, "users"), where("email", "==", firebaseUser.email));
            const emailQuerySnapshot = await getDocs(emailQuery);
            if (!emailQuerySnapshot.empty && emailQuerySnapshot.docs.some(d => d.id !== firebaseUser.uid)) {
                console.error(`Critical Error: Email ${firebaseUser.email} is ALREADY associated with another user profile. Signing out.`);
                await firebaseSignOut(auth);
                setUser(null);
                localStorage.removeItem(INTENDED_ROLE_LS_KEY);
                setLoading(false);
                return; 
            }
          }

          const newUserProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'New User',
            photoURL: firebaseUser.photoURL,
            phoneNumber: firebaseUser.phoneNumber,
            role: roleToSet, 
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            addresses: [], 
            preferredBarber: "", 
          };
          await setDoc(userDocRef, newUserProfile);
          setUser(newUserProfile);
          localStorage.removeItem(INTENDED_ROLE_LS_KEY);
        }
      } else {
        setUser(null);
        localStorage.removeItem(INTENDED_ROLE_LS_KEY);
      }
      setLoading(false);
    };

    const handleRedirect = async () => {
        try {
            setLoading(true); 
            const result = await getRedirectResult(auth);
        } catch (error: any) {
            console.error("Error processing redirect result:", error);
            if (error.code === 'auth/account-exists-with-different-credential') {
                alert("An account already exists with this email using a different sign-in method. Please use your original sign-in method.");
            }
            firebaseSignOut(auth).catch(e => console.warn("Sign out attempt during redirect error handling failed:", e));
            setUser(null);
            localStorage.removeItem(INTENDED_ROLE_LS_KEY);
        }
    };

    handleRedirect().finally(() => {
      try {
        const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
          setLoading(true); 
          processAuthUser(fbUser).catch(error => {
            console.error("Error in onAuthStateChanged's processAuthUser:", error);
            setUser(null); 
            setLoading(false); 
          });
        });
        if (!auth.currentUser && loading) {
             setLoading(false);
        }
        return () => unsubscribe();
      } catch (error) {
        console.error("Synchronous error setting up onAuthStateChanged:", error);
        setLoading(false); 
      }
    });

  }, []); 

  const signInWithGoogle = async (intendedRole: UserProfile['role']) => {
    setLoading(true);
    localStorage.setItem(INTENDED_ROLE_LS_KEY, intendedRole);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithRedirect(auth, provider);
      // Redirect initiated. setLoading(false) will be handled by onAuthStateChanged or redirect result processing.
    } catch (error: any) {
      console.error("Error initiating Google sign-in redirect:", error);
      localStorage.removeItem(INTENDED_ROLE_LS_KEY);
      setLoading(false);
      if (error.message && (error.message.includes('identitytoolkit-api-has-not-been-used') || error.message.includes('requests-to-this-api-identitytoolkit-method') || error.message.includes('blocked') )) {
        throw new Error('Google Sign-In failed: The Identity Toolkit API may be disabled or not configured correctly for your Google Cloud project. Please visit https://console.developers.google.com/apis/api/identitytoolkit.googleapis.com/overview to enable it and try again. If recently enabled, wait a few minutes.');
      } else if (error.code === 'auth/api-key-not-valid') {
        throw new Error('Google Sign-In failed: The API key (NEXT_PUBLIC_FIREBASE_API_KEY in .env) is not valid for your Firebase project. Please check your .env file and ensure it matches a valid Browser Key from your Google Cloud project credentials that has permissions for Identity Toolkit API.');
      }
      throw new Error(error.message || "Google Sign-In failed. Please try again.");
    }
  };

  const signUpWithEmailAndPasswordApp = async (email: string, password: string, intendedRole: UserProfile['role']) => {
    setLoading(true);
    const emailQuery = query(collection(db, "users"), where("email", "==", email));
    const emailQuerySnapshot = await getDocs(emailQuery);
    if (!emailQuerySnapshot.empty) {
      setLoading(false);
      throw new Error(`The email address ${email} is already registered. Please try logging in or use a different email.`);
    }

    localStorage.setItem(INTENDED_ROLE_LS_KEY, intendedRole); 
    try {
      await firebaseCreateUserWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle profile creation and set user state.
    } catch (error: any) { 
      console.error("Error signing up with email and password:", error);
      localStorage.removeItem(INTENDED_ROLE_LS_KEY);
      setLoading(false);
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('This email address is already registered with Firebase Authentication. Please try logging in.');
      }
      if (error.code === 'auth/weak-password') {
        throw new Error('The password is too weak. Please choose a stronger password (at least 6 characters).');
      }
      throw new Error(error.message || "An unexpected error occurred during sign up.");
    }
  };

  const signInWithEmailAndPasswordApp = async (email: string, password: string) => {
    setLoading(true);
    try {
      await firebaseSignInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will fetch the user profile. The setLoading(false) will be handled by processAuthUser.
    } catch (error: any) {
      console.error("Error signing in with email and password:", error); // For developer debugging
      setLoading(false);
      if (error.code === 'auth/user-not-found' || 
          error.code === 'auth/wrong-password' ||
          error.code === 'auth/invalid-credential') {
        throw new Error('Invalid email or password. Please check your credentials and try again.');
      }
       if (error.message && (error.message.includes('identitytoolkit-api-has-not-been-used') || error.message.includes('requests-to-this-api-identitytoolkit-method') || error.message.includes('blocked') )) {
        throw new Error('Sign-In failed: The Identity Toolkit API may be disabled or not configured correctly for your Google Cloud project. Please visit the Google Cloud Console to enable it for your project and try again. If recently enabled, wait a few minutes.');
      }
      throw new Error(error.message || "An unexpected sign-in error occurred. Please try again later.");
    }
  };

  const sendPasswordResetEmailApp = async (email: string) => {
    setLoading(true);
    try {
      await firebaseSendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error("Error sending password reset email:", error);
      throw new Error(error.message || "Failed to send password reset email. Please try again.");
    } finally {
        setLoading(false); 
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setUser(null); 
      localStorage.removeItem(INTENDED_ROLE_LS_KEY); 
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfileInContext = async (data: UserProfileUpdateData) => {
    if (!auth.currentUser) {
      throw new Error("No authenticated user found to update.");
    }
    setLoading(true);
    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const firestoreUpdatePayload: any = { updatedAt: serverTimestamp() };
      const firebaseAuthUpdatePayload: { displayName?: string | null; photoURL?: string | null } = {};

      if (data.displayName !== undefined) {
        firestoreUpdatePayload.displayName = data.displayName;
        firebaseAuthUpdatePayload.displayName = data.displayName;
      }
      if (data.photoURL !== undefined) { 
        firestoreUpdatePayload.photoURL = data.photoURL;
        firebaseAuthUpdatePayload.photoURL = data.photoURL;
      }
      if (data.preferredBarber !== undefined) {
        firestoreUpdatePayload.preferredBarber = data.preferredBarber;
      }
      if (data.addresses !== undefined) {
        firestoreUpdatePayload.addresses = data.addresses;
      }

      await updateDoc(userDocRef, firestoreUpdatePayload);

      if (Object.keys(firebaseAuthUpdatePayload).length > 0) {
        await updateProfile(auth.currentUser, firebaseAuthUpdatePayload);
      }

      const updatedUserDocSnap = await getDoc(userDocRef);
      if (updatedUserDocSnap.exists()) {
        setUser(updatedUserDocSnap.data() as UserProfile);
      } else {
        console.error("User document not found after update.");
        setUser(null); 
      }

    } catch (error) {
      console.error("Error updating user profile in context:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signUpWithEmailAndPasswordApp, signInWithEmailAndPasswordApp, sendPasswordResetEmailApp, signOut, updateUserProfileInContext }}>
      {isClient && loading && !user && <LoadingScreen />} 
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
