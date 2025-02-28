// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDG_u4wbCME709GaE998_ZpDgb6nZ0pz3Y",
  authDomain: "curaease.firebaseapp.com",
  projectId: "curaease",
  storageBucket: "curaease.firebasestorage.app",
  messagingSenderId: "758260923056",
  appId: "1:758260923056:web:ffb99d6d259df923fe1975"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);