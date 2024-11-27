import {  initializeApp } from "firebase/app";
import {getFirestore} from 'firebase/firestore'
import {getAuth,signInAnonymously} from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyC4421fNIdnBVrRKoZUKMeToywNCR5eL5I",
  authDomain: "ice-cream-inventory-abfbe.firebaseapp.com",
  projectId: "ice-cream-inventory-abfbe",
  storageBucket: "ice-cream-inventory-abfbe.appspot.com",
  messagingSenderId: "835430835315",
  appId: "1:835430835315:web:06390a92b61d75df907606",
  measurementId: "G-F9FT6DV4X7"
  // apiKey: "AIzaSyADI0pQqRMd0bYYivLJ6Npt57EJGzYZfNo",
  // authDomain: "icecream-dfb66.firebaseapp.com",
  // projectId: "icecream-dfb66",
  // storageBucket: "icecream-dfb66.appspot.com",
  // messagingSenderId: "429919390872",
  // appId: "1:429919390872:web:6cd8b0d185c90aac6d94ed",
  // measurementId: "G-V1D6P2382S"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
signInAnonymously(auth).catch((error) => {
    console.error('Authentication error:', error);
  });
const db = getFirestore(app);

export { app , db }