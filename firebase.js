import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot, runTransaction, collection, addDoc, serverTimestamp, getDocs } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCzbVs6AHO60h8enA5Y80tL7RqWqsBWn6g",
  authDomain: "la-casa-del-nonno.firebaseapp.com",
  projectId: "la-casa-del-nonno",
  storageBucket: "la-casa-del-nonno.firebasestorage.app",
  messagingSenderId: "751184717495",
  appId: "1:751184717495:web:3452ad5e589591864fcf32"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export { doc, getDoc, setDoc, onSnapshot, runTransaction, collection, addDoc, serverTimestamp, getDocs };
