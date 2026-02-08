const { db, admin } = require('../config/firebase');
const { successResponse } = require('../utils/response');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/errors');
const { calculateBanknoteTotal } = require('../utils/calculations');

const BAYI_DOLUM_COLLECTION = 'bayi_dolum_records';

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
 * Calculate totals for bayi dolum record
 */
const calculateBayiDolumTotals = (products, categoryCreditCards, payments) => {
  // Bayi Dolum birim fiyatları
  const BAYI_PRICES = {
    bayiDolum: 1,
    bayiTamKart: 50,
    bayiKartKilifi: 10,
    posRulosu: 5
  };

  const totalSales = 
    (products.bayiDolum || 0) * BAYI_PRICES.bayiDolum +
    (products.bayiTamKart || 0) * BAYI_PRICES.bayiTamKart +
    (products.bayiKartKilifi || 0) * BAYI_PRICES.bayiKartKilifi +
    (products.posRulosu || 0) * BAYI_PRICES.posRulosu;
  
  const totalCreditCard = 
    (categoryCreditCards.dolum || 0) +
    (categoryCreditCards.kart || 0);
  
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
 * Submit bayi dolum record
 */
const submitBayiDolum = async (req, res, next) => {
  try {
    const { date, products, categoryCreditCards, payments, banknotes, bankSentCash } = req.body;
    const userId = req.user.uid;

    // Check if already submitted for this date
    const existingSubmitted = await db.collection(BAYI_DOLUM_COLLECTION)
      .where('date', '==', date)
      .where('submittedBy', '==', userId)
      .where('status', 'in', ['submitted', 'approved', 'revised'])
      .get();

    if (!existingSubmitted.empty) {
      throw new BadRequestError('Bu tarih için zaten teslim edilmiş bir kayıt var');
    }

    // Calculate totals
    const totals = calculateBayiDolumTotals(products, categoryCreditCards, payments);

    // Default banknotes structure (new categorized format - no vize for bayi dolum)
    const defaultBanknotes = {
      dolum: { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0, b5: 0, c1: 0, c050: 0 },
      kart: { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0, b5: 0, c1: 0, c050: 0 }
    };

    const bayiDolumData = {
      date,
      products,
      categoryCreditCards,
      payments,
      banknotes: banknotes || defaultBanknotes,
      bankSentCash: bankSentCash || {
        dolum: 0,
        kart: 0,
        totalSent: 0
      },
      totals,
      submittedBy: userId,
      submittedByEmail: req.user.email,
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'submitted',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection(BAYI_DOLUM_COLLECTION).add(bayiDolumData);

    const submittedRecord = {
      id: docRef.id,
      ...bayiDolumData
    };

    successResponse(res, submittedRecord, 'Bayi Dolum kaydı başarıyla sorumluya teslim edildi', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get submitted bayi dolum records (with filters)
 */
const getSubmittedRecords = async (req, res, next) => {
  try {
    const { startDate, endDate, status } = req.query;
    const userId = req.user.uid;
    const userRole = req.user.role;

    let query = db.collection(BAYI_DOLUM_COLLECTION);

    // Desk users can only see their own records
    if (userRole === 'desk') {
      query = query.where('submittedBy', '==', userId);
    }

    // Status filter
    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();

    let records = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      
      let includeRecord = true;
      
      // Date range filter (client-side)
      if (startDate && data.date < startDate) {
        includeRecord = false;
      }
      if (endDate && data.date > endDate) {
        includeRecord = false;
      }
      
      if (includeRecord) {
        const record = {
          id: doc.id,
          ...convertTimestamps(data)
        };

        // Ensure bankSentCash exists for backward compatibility
        if (!record.bankSentCash) {
          record.bankSentCash = {
            dolum: 0,
            kart: 0,
            totalSent: 0
          };
        }

        // Ensure banknotes is in new format
        if (record.banknotes && !record.banknotes.dolum) {
          // Old format - convert to new format
          const oldBanknotes = record.banknotes;
          record.banknotes = {
            dolum: {
              b200: oldBanknotes.b200 || 0,
              b100: oldBanknotes.b100 || 0,
              b50: oldBanknotes.b50 || 0,
              b20: oldBanknotes.b20 || 0,
              b10: oldBanknotes.b10 || 0,
              b5: oldBanknotes.b5 || 0,
              c1: oldBanknotes.c1 || 0,
              c050: oldBanknotes.c050 || 0
            },
            kart: { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0, b5: 0, c1: 0, c050: 0 }
          };
        }

        records.push(record);
      }
    });

    // Sort by date descending
    records.sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return b.date.localeCompare(a.date);
    });

    successResponse(res, records, 'Kayıtlar başarıyla getirildi');
  } catch (error) {
    next(error);
  }
};

/**
 * Get single record by ID
 */
const getRecordById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;
    const userRole = req.user.role;

    const doc = await db.collection(BAYI_DOLUM_COLLECTION).doc(id).get();

    if (!doc.exists) {
      throw new NotFoundError('Kayıt bulunamadı');
    }

    const data = doc.data();
    const record = {
      id: doc.id,
      ...convertTimestamps(data)
    };

    // Ensure bankSentCash exists for backward compatibility
    if (!record.bankSentCash) {
      record.bankSentCash = {
        dolum: 0,
        kart: 0,
        totalSent: 0
      };
    }

    // Ensure banknotes is in new format
    if (record.banknotes && !record.banknotes.dolum) {
      // Old format - convert to new format
      const oldBanknotes = record.banknotes;
      record.banknotes = {
        dolum: {
          b200: oldBanknotes.b200 || 0,
          b100: oldBanknotes.b100 || 0,
          b50: oldBanknotes.b50 || 0,
          b20: oldBanknotes.b20 || 0,
          b10: oldBanknotes.b10 || 0,
          b5: oldBanknotes.b5 || 0,
          c1: oldBanknotes.c1 || 0,
          c050: oldBanknotes.c050 || 0
        },
        kart: { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0, b5: 0, c1: 0, c050: 0 }
      };
    }

    // Desk users can only see their own records
    if (userRole === 'desk' && data.submittedBy !== userId) {
      throw new ForbiddenError('Bu kaydı görüntüleme yetkiniz yok');
    }

    successResponse(res, record, 'Kayıt başarıyla getirildi');
  } catch (error) {
    next(error);
  }
};

/**
 * Review record (approve/reject/revise) - Only responsible and admin
 */
const reviewRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, notes } = req.body;
    const userId = req.user.uid;
    const userRole = req.user.role;
    const userEmail = req.user.email;

    // Authorization check
    if (!['admin', 'responsible', 'supervisor'].includes(userRole)) {
      throw new ForbiddenError('Bu işlem için yetkiniz yok');
    }

    if (!['approve', 'reject', 'revise'].includes(action)) {
      throw new BadRequestError('Geçersiz aksiyon. "approve", "reject" veya "revise" olmalıdır');
    }

    const docRef = db.collection(BAYI_DOLUM_COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundError('Kayıt bulunamadı');
    }

    // Map action to status
    let newStatus;
    switch (action) {
      case 'approve':
        newStatus = 'approved';
        break;
      case 'reject':
        newStatus = 'rejected';
        break;
      case 'revise':
        newStatus = 'pending_revision';
        break;
    }

    await docRef.update({
      status: newStatus,
      reviewedBy: userId,
      reviewedByEmail: userEmail,
      reviewedByRole: userRole,
      reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
      reviewNotes: notes || '',
      reviewAction: action,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const updatedDoc = await docRef.get();
    const updatedRecord = {
      id: updatedDoc.id,
      ...convertTimestamps(updatedDoc.data())
    };

    const messages = {
      approve: 'onaylandı',
      reject: 'reddedildi',
      revise: 'revize edilmek üzere geri gönderildi'
    };

    successResponse(
      res, 
      updatedRecord, 
      `Kayıt başarıyla ${messages[action]}`
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update record (for pending_revision status)
 */
const updateRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date, products, categoryCreditCards, payments, banknotes, bankSentCash } = req.body;
    const userId = req.user.uid;
    const userRole = req.user.role;

    const docRef = db.collection(BAYI_DOLUM_COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundError('Kayıt bulunamadı');
    }

    const record = doc.data();

    // Desk users can only update their own records
    if (userRole === 'desk' && record.submittedBy !== userId) {
      throw new ForbiddenError('Bu kaydı güncelleme yetkiniz yok');
    }

    // Only pending_revision records can be updated
    if (record.status !== 'pending_revision') {
      throw new BadRequestError('Sadece revize bekleyen kayıtlar güncellenebilir');
    }

    // Calculate totals
    const totals = calculateBayiDolumTotals(products, categoryCreditCards, payments);

    // Banknote validation
    if (banknotes) {
      const banknoteTotal = calculateBanknoteTotal(banknotes);
    }

    // Default banknotes structure (new categorized format - no vize for bayi dolum)
    const defaultBanknotes = {
      dolum: { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0, b5: 0, c1: 0, c050: 0 },
      kart: { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0, b5: 0, c1: 0, c050: 0 }
    };

    const updateData = {
      date,
      products,
      categoryCreditCards,
      payments,
      banknotes: banknotes || defaultBanknotes,
      bankSentCash: bankSentCash || {
        dolum: 0,
        kart: 0,
        totalSent: 0
      },
      totals,
      status: 'revised',
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await docRef.update(updateData);

    const updatedDoc = await docRef.get();
    const updatedRecord = {
      id: updatedDoc.id,
      ...convertTimestamps(updatedDoc.data())
    };

    successResponse(res, updatedRecord, 'Kayıt başarıyla güncellendi ve tekrar gönderildi');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete record
 */
const deleteRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;
    const userRole = req.user.role;

    const docRef = db.collection(BAYI_DOLUM_COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundError('Kayıt bulunamadı');
    }

    const record = doc.data();

    // Only allow deletion of rejected, revised or pending_revision records
    if (!['rejected', 'revised', 'pending_revision'].includes(record.status)) {
      throw new BadRequestError('Sadece reddedilmiş, revize edilmiş veya revize bekleyen kayıtlar silinebilir');
    }

    // Desk users can only delete their own records
    if (userRole === 'desk' && record.submittedBy !== userId) {
      throw new ForbiddenError('Bu kaydı silme yetkiniz yok');
    }

    await docRef.delete();

    successResponse(res, { id }, 'Kayıt başarıyla silindi');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitBayiDolum,
  getSubmittedRecords,
  getRecordById,
  reviewRecord,
  updateRecord,
  deleteRecord
};
