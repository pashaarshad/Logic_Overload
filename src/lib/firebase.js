import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAcozJ8umWtn-NRPhsFsoImFRTNB6NFseo",
    authDomain: "logic-overload.firebaseapp.com",
    projectId: "logic-overload",
    storageBucket: "logic-overload.firebasestorage.app",
    messagingSenderId: "855464757899",
    appId: "1:855464757899:web:80328be3afc1071ae3e28e",
    measurementId: "G-T63ER35SPW",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
