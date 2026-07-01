import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD_jxDqcmvArllrXrt9-Rs5eZpP-Iv1yDs",
  authDomain: "nen-bedb6.firebaseapp.com",
  projectId: "nen-bedb6",
  storageBucket: "nen-bedb6.firebasestorage.app",
  messagingSenderId: "677674566791",
  appId: "1:677674566791:web:6b587898ae4b778a41a422"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

const db = getFirestore(app);

export { auth, googleProvider, db, signInWithPopup, signOut };
