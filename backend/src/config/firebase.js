const admin = require('firebase-admin');

let db = null;

try {
  // Environment variable should be an absolute path, but if fallback is used,
  // resolve relative to this configuration file (pointing to src/service-account-key.json).
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || '../service-account-key.json';
  const serviceAccount = require(credentialsPath);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.GOOGLE_CLOUD_PROJECT
  });

  db = admin.firestore();
} catch (error) {
  console.warn('Firebase initialization skipped (for development):', error.message);
}

module.exports = { admin, db };
