// firebase.ts
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBcuvUORWL2xASyo-FKmpdTMFnNzJ1SQak",
  authDomain: "tsssg-19d8f.firebaseapp.com",
  databaseURL: "https://tsssg-19d8f-default-rtdb.firebaseio.com",
  projectId: "tsssg-19d8f",
  storageBucket: "tsssg-19d8f.firebasestorage.app",
  messagingSenderId: "780790250547",
  appId: "1:780790250547:web:29aef5ac34442592d37746",
  measurementId: "G-LRDL3KTCQM"
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const database = getDatabase(app);

export { auth, db, database };
