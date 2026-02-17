// firebase.ts
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD7ssn_oN39OmQcyDlfmpzHMMQZnFyxs4w",
  authDomain: "jhoirr.firebaseapp.com",
  databaseURL: "https://jhoirr-default-rtdb.firebaseio.com",
  projectId: "jhoirr",
  storageBucket: "jhoirr.firebasestorage.app",
  messagingSenderId: "107584151799",
  appId: "1:107584151799:web:5a4f7ddf0653624b9133f2",
  measurementId: "G-3F1GZ6Q78W"
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const database = getDatabase(app);

export { auth, db, database };
