
"use client";

import type { User as FirebaseUser } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  updateProfile, // Import updateProfile
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, query, collection, where, getDocs, updateDoc } from "firebase/firestore";
import type { ReactNode} from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { LoadingScreen } from "@/components/common/loading-screen";
import type { UserProfile, UserProfileUpdateData } from "@/lib/types";

const INTENDED_ROLE_LS_KEY = "clipperconnect_intended_role";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signInWithGoogle: (intendedRole: UserProfile['role']) => Promise<void>;
  signUpWithEmailAndPasswordApp: (email: string, password: string, intendedRole: UserProfile['role']) => Promise<void>;
  signInWithEmailAndPasswordApp: (email: string, password: string) => Promise<void>;
  sendPasswordResetEmailApp: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfileInContext: (data: UserProfileUpdateData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // Set isClient to true once component mounts

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

          if (!intendedRole && !firebaseUser.isAnonymous) {
            console.warn("Intended role not found in localStorage for new user. Defaulting to 'user'. This might happen if the user refreshed during redirect or an error occurred before role was set.");
          }
          
          // Check if email already exists in Firestore with a different UID (edge case, primarily for Google sign-ins where Firebase Auth user is new but Firestore doc might exist)
          if (firebaseUser.email) {
            const emailQuery = query(collection(db, "users"), where("email", "==", firebaseUser.email));
            const emailQuerySnapshot = await getDocs(emailQuery);
            if (!emailQuerySnapshot.empty && emailQuerySnapshot.docs.some(d => d.id !== firebaseUser.uid)) {
                // This email is already tied to another user profile in Firestore.
                // This can happen if a user first signed up with email/password, then tries Google with same email.
                // Or, more critically, if there's data inconsistency.
                // For now, we'll sign out the current Firebase Auth user to prevent overwriting or creating duplicate-email profiles.
                console.error(`Critical Error: Email ${firebaseUser.email} is ALREADY associated with another user profile in Firestore (UID: ${emailQuerySnapshot.docs.find(d=>d.id !== firebaseUser.uid)?.id}). Signing out user.`);
                await firebaseSignOut(auth);
                setUser(null);
                localStorage.removeItem(INTENDED_ROLE_LS_KEY);
                setLoading(false);
                return; // Stop processing to prevent inconsistent state
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
            setLoading(true); // Start loading before processing redirect
            const result = await getRedirectResult(auth);
            // If result.user exists, onAuthStateChanged will be triggered shortly by Firebase,
            // which will then call processAuthUser.
            // If result is null (no pending redirect or already handled), 
            // we still rely on onAuthStateChanged for initial user load.
            if (!result) { // if no redirect was processed, might need to ensure loading state is handled.
                setLoading(false); // If no redirect result, turn off loading (onAuthStateChanged will handle further)
            }
        } catch (error: any) {
            console.error("Error processing redirect result:", error);
            if (error.code === 'auth/account-exists-with-different-credential') {
                alert("An account already exists with the same email address but a different sign-in method (e.g., Google vs Email). Please sign in using the original method you used for this email.");
            }
            firebaseSignOut(auth).catch(e => console.warn("Sign out attempt during redirect error handling failed:", e));
            setUser(null);
            localStorage.removeItem(INTENDED_ROLE_LS_KEY);
            setLoading(false);
        }
    };

    handleRedirect().finally(() => {
        const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
          setLoading(true); // Set loading true when auth state might change
          processAuthUser(fbUser).catch(error => {
            // Catch errors within processAuthUser to prevent unhandled promise rejections
            console.error("Error in onAuthStateChanged's processAuthUser:", error);
            setUser(null); // Ensure user is null on error
            setLoading(false); // Ensure loading is false on error
          });
        });
        return () => unsubscribe();
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
      throw error;
    }
  };

  const signUpWithEmailAndPasswordApp = async (email: string, password: string, intendedRole: UserProfile['role']) => {
    setLoading(true);
    // Check if email already exists in Firestore before attempting Firebase Auth creation
    const emailQuery = query(collection(db, "users"), where("email", "==", email));
    const emailQuerySnapshot = await getDocs(emailQuery);
    if (!emailQuerySnapshot.empty) {
      setLoading(false);
      throw new Error(`The email address ${email} is already registered. Please try logging in or use a different email.`);
    }

    localStorage.setItem(INTENDED_ROLE_LS_KEY, intendedRole); // Store role before Firebase Auth action
    try {
      await firebaseCreateUserWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle profile creation and set user state.
    } catch (error: any) {
      console.error("Error signing up with email and password:", error);
      localStorage.removeItem(INTENDED_ROLE_LS_KEY);
      setLoading(false);
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('This email address is already registered. Please try logging in.');
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
          error.code === 'auth/invalid-credential' ||
          error.code === 'auth/invalid-email') {
        throw new Error('Invalid email or password. Please check your credentials and try again.');
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
        // In a real app, data.photoURL would be a Firebase Storage URL
        // For this mock, we're assuming it's the URL to set (could be a blob URL if image was just selected)
        firestoreUpdatePayload.photoURL = data.photoURL;
        firebaseAuthUpdatePayload.photoURL = data.photoURL;
      }
      if (data.preferredBarber !== undefined) {
        firestoreUpdatePayload.preferredBarber = data.preferredBarber;
      }
      if (data.addresses !== undefined) {
        firestoreUpdatePayload.addresses = data.addresses;
      }

      // Update Firestore document
      await updateDoc(userDocRef, firestoreUpdatePayload);

      // Update Firebase Auth profile (displayName, photoURL)
      if (Object.keys(firebaseAuthUpdatePayload).length > 0) {
        await updateProfile(auth.currentUser, firebaseAuthUpdatePayload);
      }

      // Re-fetch user from Firestore to update context state accurately
      const updatedUserDocSnap = await getDoc(userDocRef);
      if (updatedUserDocSnap.exists()) {
        setUser(updatedUserDocSnap.data() as UserProfile);
      } else {
        // This case should ideally not be reached if updateDoc was successful
        console.error("User document not found after update. This indicates a potential issue.");
        setUser(null); // Or handle error more gracefully
      }

    } catch (error) {
      console.error("Error updating user profile in context:", error);
      // Re-throw the error so the calling component (ProfilePage) can handle it (e.g., show a toast)
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
