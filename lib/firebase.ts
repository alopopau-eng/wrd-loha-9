// firebase.ts
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDKv0L5VjPP7oD12Cwk6zA15-GGBpY-tPs",
  authDomain: "mmdm-6fb93.firebaseapp.com",
  databaseURL: "https://mmdm-6fb93-default-rtdb.firebaseio.com",
  projectId: "mmdm-6fb93",
  storageBucket: "mmdm-6fb93.firebasestorage.app",
  messagingSenderId: "657145391802",
  appId: "1:657145391802:web:aa2ef55a0b9d41d9e17083",
  measurementId: "G-8J5VLQMT5P"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const database = getDatabase(app);

export { auth, db, database };
