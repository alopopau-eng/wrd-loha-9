// firebase.ts
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC5q2ReYxL2qNdx6NbYfk8CjsHgoITFNtI",
  authDomain: "zainsps-92746.firebaseapp.com",
  databaseURL: "https://zainsps-92746-default-rtdb.firebaseio.com",
  projectId: "zainsps-92746",
  storageBucket: "zainsps-92746.firebasestorage.app",
  messagingSenderId: "1048830927722",
  appId: "1:1048830927722:web:d723eb77b0cc14f4587b13",
  measurementId: "G-7HPMLXNQGK"
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const database = getDatabase(app);

export { auth, db, database };
