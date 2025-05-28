
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
  // For phone auth later: RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, query, collection, where, getDocs } from "firebase/firestore";
import type { ReactNode} from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { LoadingScreen } from "@/components/common/loading-screen";

const INTENDED_ROLE_LS_KEY = "clipperconnect_intended_role";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber?: string | null; // Added for phone auth
  role: 'user' | 'shopkeeper';
  createdAt?: any;
  updatedAt?: any;
  preferredBarber?: string;
  // addresses field exists in types.ts, could be added here if directly managed in this profile structure
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signInWithGoogle: (intendedRole: UserProfile['role']) => Promise<void>;
  signUpWithEmailAndPasswordApp: (email: string, password: string, intendedRole: UserProfile['role']) => Promise<void>;
  signInWithEmailAndPasswordApp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  // signInWithPhoneNumberApp: (phoneNumber: string, appVerifier: RecaptchaVerifier, intendedRole: UserProfile['role']) => Promise<ConfirmationResult>;
  // verifyPhoneNumberOtpApp: (confirmationResult: ConfirmationResult, otp: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // Component has mounted

    const processAuthUser = async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          setUser(userDocSnap.data() as UserProfile);
          localStorage.removeItem(INTENDED_ROLE_LS_KEY);
        } else {
          // New user registration flow
          const intendedRole = localStorage.getItem(INTENDED_ROLE_LS_KEY) as UserProfile['role'] | null;
          const roleToSet = intendedRole || 'user';

          if (!intendedRole && !firebaseUser.isAnonymous) { // Don't warn for anonymous/placeholder users if any
            console.warn("Intended role not found in localStorage for new user. Defaulting to 'user'.");
          }

          // Uniqueness check for email if provided by Firebase user
          if (firebaseUser.email) {
            const emailQuery = query(collection(db, "users"), where("email", "==", firebaseUser.email));
            const emailQuerySnapshot = await getDocs(emailQuery);
            if (!emailQuerySnapshot.empty) {
              // Email already exists for a DIFFERENT UID (Firebase Auth handles same UID case)
              // This implies an attempt to link a new auth method (e.g. Google) to an email already in our system via another method.
              // Or a manual entry. For now, treat as conflict.
              console.error(`Error: Email ${firebaseUser.email} is already associated with another user profile in Firestore.`);
              await firebaseSignOut(auth); // Sign out the new Firebase Auth user
              setUser(null);
              localStorage.removeItem(INTENDED_ROLE_LS_KEY);
              setLoading(false);
              throw new Error(`This email (${firebaseUser.email}) is already registered. Please try logging in or use a different email.`);
            }
          }
          // Phone number uniqueness check can be added here similarly if firebaseUser.phoneNumber exists

          const newUserProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'New User', // Fallback display name
            photoURL: firebaseUser.photoURL,
            phoneNumber: firebaseUser.phoneNumber,
            role: roleToSet,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
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

    // Handle redirect result first on component mount
    getRedirectResult(auth)
      .then((result) => {
        if (result && result.user) {
          // This means the user signed in via redirect.
          // processAuthUser will be called by onAuthStateChanged shortly if not already.
          // We can set loading false here or let onAuthStateChanged handle it.
          // For simplicity, let onAuthStateChanged handle the final loading state.
        } else {
          // No redirect result, or result.user is null.
          // This is the normal path for users already signed in or not signed in.
        }
      })
      .catch((error) => {
        console.error("Error getting redirect result:", error);
        // Handle specific errors like 'auth/account-exists-with-different-credential'
        setLoading(false); // Ensure loading is false on error
      })
      .finally(() => {
        // Subscribe to auth state changes AFTER processing redirect result
        const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
          setLoading(true);
          processAuthUser(fbUser).catch(error => {
            console.error("Error processing auth user:", error.message);
            // If error processing (like email conflict), user might already be signed out by processAuthUser
            // Or ensure they are signed out and loading is false.
            setUser(null); // Ensure user is null if processing failed
            setLoading(false);
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
      // Redirect happens, onAuthStateChanged will handle user profile on return.
    } catch (error: any) {
      console.error("Error initiating Google sign-in redirect:", error);
      localStorage.removeItem(INTENDED_ROLE_LS_KEY);
      setLoading(false);
      throw error; // Re-throw to be caught by UI
    }
  };

  const signUpWithEmailAndPasswordApp = async (email: string, password: string, intendedRole: UserProfile['role']) => {
    setLoading(true);
    // 1. Check Firestore for email uniqueness BEFORE creating Firebase user
    const emailQuery = query(collection(db, "users"), where("email", "==", email));
    const emailQuerySnapshot = await getDocs(emailQuery);
    if (!emailQuerySnapshot.empty) {
      setLoading(false);
      throw new Error(`The email address ${email} is already registered. Please try logging in.`);
    }

    localStorage.setItem(INTENDED_ROLE_LS_KEY, intendedRole);
    try {
      await firebaseCreateUserWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle user profile creation.
    } catch (error: any) {
      console.error("Error signing up with email and password:", error);
      localStorage.removeItem(INTENDED_ROLE_LS_KEY);
      setLoading(false);
      // Map Firebase error codes to user-friendly messages
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('This email address is already in use by another account in Firebase Auth.');
      }
      if (error.code === 'auth/weak-password') {
        throw new Error('The password is too weak. Please choose a stronger password.');
      }
      throw error; // Re-throw for UI
    }
  };

  const signInWithEmailAndPasswordApp = async (email: string, password: string) => {
    setLoading(true);
    try {
      await firebaseSignInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will fetch the user profile.
    } catch (error: any) {
      console.error("Error signing in with email and password:", error);
      setLoading(false);
       if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        throw new Error('Invalid email or password. Please try again.');
      }
      throw error; // Re-throw for UI
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
  
  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signUpWithEmailAndPasswordApp, signInWithEmailAndPasswordApp, signOut }}>
      {isClient && loading && <LoadingScreen />} 
      {/* Children are always rendered to prevent hydration issues, LoadingScreen is an overlay */}
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
