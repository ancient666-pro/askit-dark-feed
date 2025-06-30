
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase configuration - updated with new project credentials
const firebaseConfig = {
  apiKey: "AIzaSyC1htoK1Qx-mfpzVS3Xoal4QlutgcA8bTo",
  authDomain: "askit-1fb13.firebaseapp.com",
  projectId: "askit-1fb13",
  storageBucket: "askit-1fb13.firebasestorage.app",
  messagingSenderId: "796304444391",
  appId: "1:796304444391:web:a29192bd2e7a04dde4cb42"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
