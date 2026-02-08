const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

// Initialize Firebase Admin SDK
try {
  let serviceAccount;

  // Production: use environment variable with JSON string
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (parseError) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT env variable is not valid JSON');
    }
  }
  // Development: use service account key file
  else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH) {
    const path = require('path');
    const serviceAccountPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH);
    serviceAccount = require(serviceAccountPath);
  }
  else {
    throw new Error(
      'Firebase credentials not found. Set either FIREBASE_SERVICE_ACCOUNT (JSON string) or FIREBASE_SERVICE_ACCOUNT_KEY_PATH (file path)'
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id
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
