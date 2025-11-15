import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAY73xjEitrE-0VsFxP9LnBhXtLcTx-oIY",
  authDomain: "zorgplan-app.firebaseapp.com",
  projectId: "zorgplan-app",
  storageBucket: "zorgplan-app.firebasestorage.app",
  messagingSenderId: "797740752930",
  appId: "1:797740752930:web:1b1d4a5fac0f0583882a7b"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
