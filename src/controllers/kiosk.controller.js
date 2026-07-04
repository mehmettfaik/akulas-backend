const { db } = require('../config/firebase');
const { successResponse } = require('../utils/response');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const admin = require('firebase-admin');

const KIOSK_COLLECTION = 'kiosks';

const getKiosks = async (req, res, next) => {
  try {
    const snapshot = await db.collection(KIOSK_COLLECTION).orderBy('createdAt', 'asc').get();
    let kiosks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Auto-seed default kiosk if empty
    if (kiosks.length === 0) {
      const kioskData = {
        name: 'Makas Kiosk',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        isActive: true
      };
      const docRef = await db.collection(KIOSK_COLLECTION).add(kioskData);
      kiosks = [{ id: docRef.id, ...kioskData }];
    }
    
    successResponse(res, kiosks, 'Kiosklar getirildi');
  } catch (error) {
    next(error);
  }
};

const createKiosk = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) throw new BadRequestError('Kiosk adı zorunludur');
    
    const kioskData = {
      name,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isActive: true
    };
    
    const docRef = await db.collection(KIOSK_COLLECTION).add(kioskData);
    successResponse(res, { id: docRef.id, ...kioskData }, 'Kiosk başarıyla oluşturuldu');
  } catch (error) {
    next(error);
  }
};

const deleteKiosk = async (req, res, next) => {
  try {
    const { id } = req.params;
    await db.collection(KIOSK_COLLECTION).doc(id).delete();
    successResponse(res, null, 'Kiosk silindi');
  } catch (error) {
    next(error);
  }
};

module.exports = { getKiosks, createKiosk, deleteKiosk };
