
"use client";

import type { User as FirebaseUser } from "firebase/auth";
import { auth, db } from "@/lib/firebase"; // appCheck is also exported now but not directly used here
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
    setIsClient(true); // Set isClient to true once component mounts

    const processAuthUser = async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          setUser(userDocSnap.data() as UserProfile);
          localStorage.removeItem(INTENDED_ROLE_LS_KEY);
        } else {
          // New user or user data not yet in Firestore
          const intendedRole = localStorage.getItem(INTENDED_ROLE_LS_KEY) as UserProfile['role'] | null;
          const roleToSet = intendedRole || 'user';

          if (!intendedRole && !firebaseUser.isAnonymous) { // Don't warn for anonymous users if you ever implement them
            console.warn("Intended role not found for new user. Defaulting to 'user'. This might happen if signup flow was interrupted or if it's an existing Firebase Auth user new to this app's Firestore structure.");
          }
          
          // Check if email is already in use by another user in Firestore (important for Google Sign-In merging)
          if (firebaseUser.email) {
            const emailQuery = query(collection(db, "users"), where("email", "==", firebaseUser.email));
            const emailQuerySnapshot = await getDocs(emailQuery);
            if (!emailQuerySnapshot.empty && emailQuerySnapshot.docs.some(d => d.id !== firebaseUser.uid)) {
                // This email is associated with a DIFFERENT Firestore user profile.
                // This is a critical state that needs careful handling, possibly by linking accounts or informing the user.
                // For now, logging an error and signing out to prevent inconsistent state.
                console.error(`Critical Error: Email ${firebaseUser.email} is ALREADY associated with another user profile. UID: ${emailQuerySnapshot.docs.find(d=>d.id !== firebaseUser.uid)?.id}. Signing out.`);
                await firebaseSignOut(auth);
                setUser(null);
                localStorage.removeItem(INTENDED_ROLE_LS_KEY);
                setLoading(false);
                return; // Stop further processing
            }
          }


          const newUserProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'New User',
            photoURL: firebaseUser.photoURL,
            phoneNumber: firebaseUser.phoneNumber,
            role: roleToSet, // Set based on selection during signup
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            addresses: [], // Initialize with empty array
            preferredBarber: "", // Initialize with empty string
          };
          await setDoc(userDocRef, newUserProfile);
          setUser(newUserProfile);
          localStorage.removeItem(INTENDED_ROLE_LS_KEY);
        }
      } else {
        // No Firebase user
        setUser(null);
        localStorage.removeItem(INTENDED_ROLE_LS_KEY);
      }
      setLoading(false);
    };

    const handleRedirect = async () => {
        try {
            setLoading(true); // Start loading before getRedirectResult
            const result = await getRedirectResult(auth);
            if (!result) { 
                // This means the page loaded without a redirect result (e.g., direct navigation)
                // setLoading(false) will be handled by onAuthStateChanged or if processAuthUser(auth.currentUser) is called
            }
            // If result.user exists, onAuthStateChanged will eventually pick it up and call processAuthUser.
            // No direct call to processAuthUser(result.user) here to avoid race conditions with onAuthStateChanged.
        } catch (error: any) {
            console.error("Error processing redirect result:", error);
            if (error.code === 'auth/account-exists-with-different-credential') {
                // Handle this error specifically, perhaps by guiding the user.
                alert("An account already exists with this email using a different sign-in method (e.g., Email/Password vs Google). Please use your original sign-in method.");
            }
            // Sign out to clear any partial auth state
            firebaseSignOut(auth).catch(e => console.warn("Sign out attempt during redirect error handling failed:", e));
            setUser(null);
            localStorage.removeItem(INTENDED_ROLE_LS_KEY);
        } finally {
            // Regardless of redirect result, ensure onAuthStateChanged listener is active
            // and initial user state (if any) is processed.
            // setLoading(false) is crucial here if no redirect result to avoid indefinite loading.
            // However, onAuthStateChanged should also set loading to false eventually.
            // Consider if auth.currentUser should be processed if !result
            if (!auth.currentUser) {
              setLoading(false);
            }
        }
    };

    // Process redirect first, then set up onAuthStateChanged listener
    handleRedirect().finally(() => {
        const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
          setLoading(true); // Set loading true before processing any auth state change
          processAuthUser(fbUser).catch(error => {
            console.error("Error in onAuthStateChanged's processAuthUser:", error);
            setUser(null); // Ensure user is null on error
            setLoading(false); // Ensure loading is false on error
          });
        });
        return () => unsubscribe();
    });

  }, []); // Empty dependency array: runs once on mount and cleans up on unmount

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
      }
      throw new Error(error.message || "Google Sign-In failed. Please try again.");
    }
  };

  const signUpWithEmailAndPasswordApp = async (email: string, password: string, intendedRole: UserProfile['role']) => {
    setLoading(true);
    // Check if email is already in use in Firestore "users" collection
    const emailQuery = query(collection(db, "users"), where("email", "==", email));
    const emailQuerySnapshot = await getDocs(emailQuery);
    if (!emailQuerySnapshot.empty) {
      setLoading(false);
      throw new Error(`The email address ${email} is already registered. Please try logging in or use a different email.`);
    }

    localStorage.setItem(INTENDED_ROLE_LS_KEY, intendedRole); // Store role before Firebase auth call
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
    // setLoading(false) will be handled by onAuthStateChanged -> processAuthUser
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
          error.code === 'auth/invalid-credential' || // Catch-all for invalid credentials
          error.code === 'auth/invalid-email') {
        throw new Error('Invalid email or password. Please check your credentials and try again.');
      }
      if (error.message && (error.message.includes('identitytoolkit-api-has-not-been-used') || error.message.includes('requests-to-this-api-identitytoolkit-method') || error.message.includes('blocked') )) {
        throw new Error('Sign-In failed: The Identity Toolkit API may be disabled or not configured correctly for your Google Cloud project. Please visit https://console.developers.google.com/apis/api/identitytoolkit.googleapis.com/overview to enable it and try again. If recently enabled, wait a few minutes.');
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
        setLoading(false); // Ensure loading is set to false
    }
  };


  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setUser(null); // Clear user state immediately
      localStorage.removeItem(INTENDED_ROLE_LS_KEY); // Clean up role storage
    } catch (error) {
      console.error("Error signing out:", error);
      // Potentially inform user if sign out failed, though usually it's reliable
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
      if (data.photoURL !== undefined) { // This would be a URL from Firebase Storage in a real app
        firestoreUpdatePayload.photoURL = data.photoURL;
        firebaseAuthUpdatePayload.photoURL = data.photoURL;
      }
      if (data.preferredBarber !== undefined) {
        firestoreUpdatePayload.preferredBarber = data.preferredBarber;
      }
      if (data.addresses !== undefined) {
        firestoreUpdatePayload.addresses = data.addresses;
      }
      // Note: Role changes are typically handled via custom claims or more secure backend logic, not directly by client.

      await updateDoc(userDocRef, firestoreUpdatePayload);

      // Update Firebase Auth profile if displayName or photoURL changed
      if (Object.keys(firebaseAuthUpdatePayload).length > 0) {
        await updateProfile(auth.currentUser, firebaseAuthUpdatePayload);
      }

      // Re-fetch user from Firestore to update context
      const updatedUserDocSnap = await getDoc(userDocRef);
      if (updatedUserDocSnap.exists()) {
        setUser(updatedUserDocSnap.data() as UserProfile);
      } else {
        console.error("User document not found after update. This should not happen.");
        // Potentially sign out user if profile is gone for some reason
        setUser(null); 
      }

    } catch (error) {
      console.error("Error updating user profile in context:", error);
      // Re-throw the error so the calling component can handle it (e.g., show a toast)
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signUpWithEmailAndPasswordApp, signInWithEmailAndPasswordApp, sendPasswordResetEmailApp, signOut, updateUserProfileInContext }}>
      {isClient && loading && !user && <LoadingScreen />} {/* Show loading screen as overlay only on client during initial load if no user yet and still loading */}
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
