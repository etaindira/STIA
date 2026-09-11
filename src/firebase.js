// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAMSeSsGul5TfeE-qfR6-whoieg_eo5tzY",
  authDomain: "stia-testrun.firebaseapp.com",
  projectId: "stia-testrun",
  storageBucket: "stia-testrun.firebasestorage.app",
  messagingSenderId: "745170446828",
  appId: "1:745170446828:web:a1e89579a3b7a4368838c9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);