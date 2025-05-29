
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
// import { initializeAppCheck, ReCaptchaV3Provider, type AppCheck } from "firebase/app-check"; // Removed for debugging

const firebaseConfig: {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
} = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Conditionally add measurementId if it's set
if (process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) {
  firebaseConfig.measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;
}

// Initialize Firebase
let app: FirebaseApp;
// let appCheckInstance: AppCheck | undefined = undefined; // Renamed to avoid conflict with 'appCheck' export, and commented out

if (!getApps().length) {
  if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
    console.error(
      "Firebase configuration is missing or incomplete. " +
      "Please ensure NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, and NEXT_PUBLIC_FIREBASE_PROJECT_ID " +
      "have correct values in your .env file and that the Firebase project settings are accurate."
    );
  }
  app = initializeApp(firebaseConfig);

  // Initialize App Check - REMOVED FOR DEBUGGING
  // if (typeof window !== 'undefined') {
  //   if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
  //     try {
  //       appCheckInstance = initializeAppCheck(app, {
  //         provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY),
  //         isTokenAutoRefreshEnabled: true,
  //       });
  //       console.log("Firebase App Check initialized successfully.");
  //     } catch (error) {
  //       console.error("Error initializing Firebase App Check:", error);
  //     }
  //   } else {
  //     console.warn("NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not set. Firebase App Check cannot be initialized.");
  //   }
  // }

} else {
  app = getApp();
  // App Check - REMOVED FOR DEBUGGING
  //  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && !appCheckInstance) {
  //    try {
  //       appCheckInstance = initializeAppCheck(app, {
  //         provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY),
  //         isTokenAutoRefreshEnabled: true,
  //       });
  //        console.log("Firebase App Check initialized on existing app instance.");
  //    } catch (error) {
  //      // console.error("Error re-initializing Firebase App Check on existing app instance:", error);
  //    }
  //  }
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

// Do not export appCheckInstance for now
export { app, auth, db, storage };
