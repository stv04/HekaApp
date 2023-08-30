var firebase = require("firebase/app");
const { getFirestore } = require("firebase/firestore");
const { FIREABSE_CONFIG } = require("../config/config");

var firebaseConfig = FIREABSE_CONFIG;

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = getFirestore(app);

module.exports = {db};