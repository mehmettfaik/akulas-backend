require('dotenv').config();
const { db } = require('./src/config/firebase');
const admin = require('firebase-admin');

async function seed() {
  try {
    const snapshot = await db.collection('kiosks').limit(1).get();
    if (snapshot.empty) {
      await db.collection('kiosks').add({
        name: 'Kiosk 1',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        isActive: true
      });
      console.log('Default Kiosk added.');
    } else {
      console.log('Kiosks already exist.');
    }
  } catch (error) {
    console.error('Error seeding:', error);
  }
}
seed().then(() => process.exit(0));
