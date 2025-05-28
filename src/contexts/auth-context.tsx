
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
import type { UserProfile } from "@/lib/types"; // Ensure UserProfile is imported

const INTENDED_ROLE_LS_KEY = "clipperconnect_intended_role";

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
          const roleToSet = intendedRole || 'user'; // Default to 'user' if not found

          if (!intendedRole && !firebaseUser.isAnonymous) { 
            console.warn("Intended role not found in localStorage for new user. Defaulting to 'user'. This might happen if the user refreshed during redirect or an error occurred before role was set.");
          }
          
          if (firebaseUser.email) {
            const emailQuery = query(collection(db, "users"), where("email", "==", firebaseUser.email));
            const emailQuerySnapshot = await getDocs(emailQuery);
            if (!emailQuerySnapshot.empty && emailQuerySnapshot.docs.some(d => d.id !== firebaseUser.uid)) {
              console.error(`Critical Error: Email ${firebaseUser.email} is ALREADY associated with another user profile in Firestore (UID: ${emailQuerySnapshot.docs.find(d=>d.id !== firebaseUser.uid)?.id}). This indicates a potential data integrity issue or a race condition. Signing out user.`);
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

    // Handle redirect result first
    getRedirectResult(auth)
      .then((result) => {
        if (result && result.user) {
          // User signed in via redirect. 
          // onAuthStateChanged will be triggered shortly.
        } else {
          // No redirect result, or user is null.
        }
      })
      .catch((error) => {
        console.error("Error processing redirect result:", error);
        if (error.code === 'auth/account-exists-with-different-credential') {
           alert("An account already exists with the same email address but a different sign-in method (e.g., Google vs Email). Please sign in using the original method you used for this email.");
        }
        firebaseSignOut(auth).catch(e => console.warn("Sign out attempt during redirect error handling failed:", e));
        setUser(null);
        localStorage.removeItem(INTENDED_ROLE_LS_KEY);
        setLoading(false); 
      })
      .finally(() => {
        const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
          setLoading(true); 
          processAuthUser(fbUser).catch(error => {
            console.error("Error in onAuthStateChanged's processAuthUser:", error.message);
            setUser(null); 
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
    } catch (error: any) {
      console.error("Error initiating Google sign-in redirect:", error);
      localStorage.removeItem(INTENDED_ROLE_LS_KEY);
      setLoading(false);
      throw error; 
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
    } catch (error: any) { // <<< Added missing opening brace here
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
