// src/firebase-config.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB-sG-DtFVI_F1qyM8xlHIJzos8foQ8uQk",
  authDomain: "emo-talk-4cb41.firebaseapp.com",
  projectId: "emo-talk-4cb41",
  storageBucket: "emo-talk-4cb41.firebasestorage.app",
  messagingSenderId: "581421899854",
  appId: "1:581421899854:web:c8c7cfd6c96a0db2c7a31f",
  measurementId: "G-QGJEVFQGJ5"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
