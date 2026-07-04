const { db, admin } = require('../config/firebase');
const { successResponse } = require('../utils/response');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/errors');
const { calculateBanknoteTotal } = require('../utils/calculations');

const KIOSK_DOLUM_COLLECTION = 'kiosk_dolum_records';

/**
 * Helper function to convert Firestore timestamps to ISO strings
 */
const convertTimestamps = (data) => {
  return {
    ...data,
    submittedAt: data.submittedAt?.toDate?.() ? data.submittedAt.toDate().toISOString() : data.submittedAt,
    reviewedAt: data.reviewedAt?.toDate?.() ? data.reviewedAt.toDate().toISOString() : data.reviewedAt,
    createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : data.createdAt,
    updatedAt: data.updatedAt?.toDate?.() ? data.updatedAt.toDate().toISOString() : data.updatedAt
  };
};

/**
 * Calculate totals for kiosk dolum record
 */
const calculateKioskDolumTotals = (products, categoryCreditCards, payments) => {
  const totalSales = Number(products.dolum || 0);
  
  const totalCreditCard = Number(categoryCreditCards.dolum || 0);
  
  const totalCash = totalSales - totalCreditCard;
  
  const cashInRegister = 
    (payments.gunbasiNakit || 0) + 
    totalSales - 
    (totalCreditCard + (payments.bankayaGonderilen || 0) + (payments.ertesiGuneBirakilan || 0));
  
  const difference = 
    totalSales - 
    ((payments.gunbasiNakit || 0) + totalCreditCard + (payments.bankayaGonderilen || 0) + (payments.ertesiGuneBirakilan || 0));
  
  return {
    totalSales: Number(totalSales.toFixed(2)),
    totalCreditCard: Number(totalCreditCard.toFixed(2)),
    totalCash: Number(totalCash.toFixed(2)),
    cashInRegister: Number(cashInRegister.toFixed(2)),
    difference: Number(difference.toFixed(2))
  };
};

/**
 * Submit Kiosk Dolum to responsible (Desk users)
 */
const submitKioskDolum = async (req, res, next) => {
  try {
    const { date, kioskId, kioskName, products, categoryCreditCards, payments, banknotes, bankSentCash } = req.body;
    
    if (!kioskId) {
      throw new BadRequestError('Kiosk ID zorunludur');
    }

    const userId = req.user.uid;
    const userEmail = req.user.email;

    const totals = calculateKioskDolumTotals(products, categoryCreditCards, payments);

    const recordData = {
      date,
      kioskId,
      kioskName,
      products,
      categoryCreditCards,
      payments,
      banknotes,
      bankSentCash: bankSentCash || { dolum: 0, totalSent: 0 },
      totals,
      status: 'pending', // Initial status
      submittedBy: userId,
      submittedByEmail: userEmail,
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection(KIOSK_DOLUM_COLLECTION).add(recordData);

    successResponse(res, { id: docRef.id, ...recordData }, 'Kiosk Dolum kaydı Sorumluya başarıyla teslim edildi', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all submitted Kiosk Dolum records with optional filtering
 */
const getSubmittedRecords = async (req, res, next) => {
  try {
    const { status, startDate, endDate, date } = req.query;
    
    let query = db.collection(KIOSK_DOLUM_COLLECTION);
    
    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();
    
    let records = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      let includeRecord = true;
      
      if (startDate && data.date < startDate) includeRecord = false;
      if (endDate && data.date > endDate) includeRecord = false;
      if (date && data.date !== date) includeRecord = false;
      
      if (includeRecord) {
        records.push({
          id: doc.id,
          ...convertTimestamps(data)
        });
      }
    });

    records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    successResponse(res, records, 'Kayıtlar getirildi');
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific record by ID
 */
const getRecordById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const doc = await db.collection(KIOSK_DOLUM_COLLECTION).doc(id).get();
    
    if (!doc.exists) {
      throw new NotFoundError('Kayıt bulunamadı');
    }
    
    successResponse(res, {
      id: doc.id,
      ...convertTimestamps(doc.data())
    }, 'Kayıt getirildi');
  } catch (error) {
    next(error);
  }
};

/**
 * Review record (Admin/Responsible only)
 */
const reviewRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const userId = req.user.uid;
    const userEmail = req.user.email;
    
    if (!['approved', 'rejected', 'pending_revision', 'teslim_edildi'].includes(status)) {
      throw new BadRequestError('Geçersiz durum değeri');
    }
    
    const docRef = db.collection(KIOSK_DOLUM_COLLECTION).doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      throw new NotFoundError('Kayıt bulunamadı');
    }
    
    const currentData = doc.data();
    
    const updateData = {
      status,
      reviewerNotes: notes || null,
      reviewedBy: userId,
      reviewedByEmail: userEmail,
      reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await docRef.update(updateData);
    
    successResponse(res, {
      id,
      ...currentData,
      ...updateData
    }, 'Kayıt durumu güncellendi');
  } catch (error) {
    next(error);
  }
};

/**
 * Update a specific record
 */
const updateRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date, kioskId, kioskName, products, categoryCreditCards, payments, banknotes, bankSentCash } = req.body;
    const userId = req.user.uid;
    
    const docRef = db.collection(KIOSK_DOLUM_COLLECTION).doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      throw new NotFoundError('Kayıt bulunamadı');
    }
    
    const currentData = doc.data();
    
    if (req.user.role === 'desk' && currentData.status === 'approved') {
      throw new ForbiddenError('Onaylanmış kayıtlar değiştirilemez');
    }
    
    if (req.user.role === 'desk' && currentData.submittedBy !== userId) {
      throw new ForbiddenError('Sadece kendi oluşturduğunuz kayıtları güncelleyebilirsiniz');
    }
    
    const totals = calculateKioskDolumTotals(products, categoryCreditCards, payments);
    
    const updateData = {
      date,
      kioskId,
      kioskName,
      products,
      categoryCreditCards,
      payments,
      banknotes,
      bankSentCash: bankSentCash || { dolum: 0, totalSent: 0 },
      totals,
      status: 'pending',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await docRef.update(updateData);
    
    successResponse(res, {
      id,
      ...currentData,
      ...updateData
    }, 'Kayıt başarıyla güncellendi');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a record
 */
const deleteRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;
    const userRole = req.user.role;
    
    const docRef = db.collection(KIOSK_DOLUM_COLLECTION).doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      throw new NotFoundError('Kayıt bulunamadı');
    }
    
    const currentData = doc.data();
    
    if (userRole === 'desk' && currentData.submittedBy !== userId) {
      throw new ForbiddenError('Sadece kendi oluşturduğunuz kayıtları silebilirsiniz');
    }
    
    if (userRole === 'desk' && currentData.status === 'approved') {
      throw new ForbiddenError('Onaylanmış kayıtlar silinemez');
    }
    
    await docRef.delete();
    
    successResponse(res, null, 'Kayıt başarıyla silindi');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitKioskDolum,
  getSubmittedRecords,
  getRecordById,
  reviewRecord,
  updateRecord,
  deleteRecord
};
