// firebase.ts
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
   apiKey: "AIzaSyDABw1C30Hscha9m--8OgOHgOe35vfgfvE",
  authDomain: "abds-dc4aa.firebaseapp.com",
  databaseURL: "https://abds-dc4aa-default-rtdb.firebaseio.com",
  projectId: "abds-dc4aa",
  storageBucket: "abds-dc4aa.firebasestorage.app",
  messagingSenderId: "1076311425985",
  appId: "1:1076311425985:web:01836a0f2a968f86c5a540",
  measurementId: "G-LGTNFCBFGJ"
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const database = getDatabase(app);

export { auth, db, database };
