const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH;

if (!serviceAccountPath) {
  throw new Error(
    'FIREBASE_SERVICE_ACCOUNT_KEY_PATH is not defined in environment variables'
  );
}

// Initialize Firebase Admin SDK
try {
  const serviceAccount = require(path.resolve(serviceAccountPath));
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID
  });

  console.log('✓ Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('✗ Failed to initialize Firebase Admin SDK:', error);
  throw error;
}

// Export Firestore database instance
const db = admin.firestore();

// Export Auth instance for token verification
const auth = admin.auth();

module.exports = {
  db,
  auth,
  admin
};
