import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC3vn3PYoKpN5BUyV_9y_gPi3U61XDdfAw",
    authDomain: "padoca-96688.firebaseapp.com",
    projectId: "padoca-96688",
    storageBucket: "padoca-96688.firebasestorage.app",
    messagingSenderId: "689278956648",
    appId: "1:689278956648:web:f20a74b51736c2d956b7dd",
    measurementId: "G-B2KD6YHMJM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);