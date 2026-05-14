import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getDatabase
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {

    apiKey: "AIzaSyD8rwcguwvHlm55Ecf7RIShILc4T9t8Aik",
	
    authDomain: "cache-cache-geant-2d831.firebaseapp.com",

	 databaseURL: "https://cache-cache-geant-2d831-default-rtdb.europe-west1.firebasedatabase.app",
	
    projectId: "cache-cache-geant-2d831",
	
    storageBucket: "cache-cache-geant-2d831.firebasestorage.app",
	
    messagingSenderId: "5562537953",
	
    appId: "1:5562537953:web:2ebb1ad4299519200224a0"

};

const app = initializeApp(firebaseConfig);

const db = getDatabase(app);

export { db };
