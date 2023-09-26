const { initializeApp, applicationDefault, cert } = require("firebase-admin/app");
const { getFirestore, Timestamp, FieldValue, Filter } = require("firebase-admin/firestore");

initializeApp();

exports.database = () => {
  const db = getFirestore();
  return db;
};
