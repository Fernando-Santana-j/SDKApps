const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
var admin = require("firebase-admin");

require('dotenv').config()

let serviceAccout = require('../config/web-config').serviceAccount

let app = initializeApp({
  credential: admin.credential.cert(serviceAccout),
});

const db = getFirestore();


module.exports = db

module.exports.app = app
