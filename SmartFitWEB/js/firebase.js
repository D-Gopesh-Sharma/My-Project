// firebase.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";


const firebaseConfig = {
  apiKey: "AIzaSyCoUuDKk_Io6eD5bhCh-w48O9xgsizRjPs",
  authDomain: "fashiolens.firebaseapp.com",
  projectId: "fashiolens",
  storageBucket: "fashiolens.firebasestorage.app",
  messagingSenderId: "191831203570",
  appId: "1:191831203570:web:86659ef4a4bd95a5dfba6b"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
};