// firebase.ts
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAU-3Vt67Fd7BWrCDJZr35-tyKvM6hlnYw",
  authDomain: "zzaaiinn-74fea.firebaseapp.com",
  databaseURL: "https://zzaaiinn-74fea-default-rtdb.firebaseio.com",
  projectId: "zzaaiinn-74fea",
  storageBucket: "zzaaiinn-74fea.firebasestorage.app",
  messagingSenderId: "904947941308",
  appId: "1:904947941308:web:062f9e4d1f5095c5fe35b9",
  measurementId: "G-MH5MZG0WBP"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const database = getDatabase(app);

export { auth, db, database };
