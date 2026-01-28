import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyBSkFfkVoaEIUrTVdbuFrucwDESNzEwhi4",
    authDomain: "appkoche.firebaseapp.com",
    projectId: "appkoche",
    storageBucket: "appkoche.firebasestorage.app",
    messagingSenderId: "330063019982",
    appId: "1:330063019982:web:e96bc7e181f6409d58b59f",
    measurementId: "G-30K06Y3JKT"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
export default app;
