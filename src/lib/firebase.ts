import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyAybBtOavxRoZ2unWpl5lVxFtOyxT8KksI",
    authDomain: "focus-club-252dc.firebaseapp.com",
    projectId: "focus-club-252dc",
    storageBucket: "focus-club-252dc.firebasestorage.app",
    messagingSenderId: "674130559920",
    appId: "1:674130559920:web:54b75c668f43d141bb8c75",
    measurementId: "G-1K4PYB6M5H",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
