// firebase.ts
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBWDLwnzYr5SMe7AfLRyvseOjM2WEJUn6Y",
  authDomain: "kute-cf4c8.firebaseapp.com",
  databaseURL: "https://kute-cf4c8-default-rtdb.firebaseio.com",
  projectId: "kute-cf4c8",
  storageBucket: "kute-cf4c8.firebasestorage.app",
  messagingSenderId: "933256572051",
  appId: "1:933256572051:web:8c2a275c5047f6c70ef166",
  measurementId: "G-X2EWY4LKE5",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const database = getDatabase(app);

export { auth, db, database };
