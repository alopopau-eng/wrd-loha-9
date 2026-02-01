// firebase.ts
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB5wRVuMhuX32v4g8P4rDkB_NvlrKVUhno",
  authDomain: "sdfg-98b06.firebaseapp.com",
  projectId: "sdfg-98b06",
  storageBucket: "sdfg-98b06.firebasestorage.app",
  messagingSenderId: "307140724566",
  appId: "1:307140724566:web:669d76007c14aeea33b8f7",
  measurementId: "G-0J30YY52NS"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const database = getDatabase(app);

export { auth, db, database };
