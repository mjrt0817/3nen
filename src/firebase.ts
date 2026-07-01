import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAfgEV9oDQQPnlP7r-RnAYRKlEB6vL-S5I",
  authDomain: "gen-lang-client-0125274260.firebaseapp.com",
  projectId: "gen-lang-client-0125274260",
  storageBucket: "gen-lang-client-0125274260.firebasestorage.app",
  messagingSenderId: "525064586221",
  appId: "1:525064586221:web:a118584b93f9db49669de4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Custom databaseId is required for this sandboxed project database
const db = getFirestore(app, "ai-studio-3-ca5e0052-3eb7-4eb7-92c9-d3a7b526068c");

export { auth, googleProvider, db, signInWithPopup, signOut };
