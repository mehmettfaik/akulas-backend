const { db, admin } = require('../config/firebase');
const { successResponse } = require('../utils/response');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/errors');
const { calculateTotals, calculateBanknoteTotal, validateDeskData } = require('../utils/calculations');

const DESK_COLLECTION = 'desk_records';

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
 * Save desk record as draft
 */
const saveDraft = async (req, res, next) => {
  try {
    const { date, products, categoryCreditCards, payments, banknotes, bankSentCash } = req.body;
    const userId = req.user.uid;

    // Validate data
    const validation = validateDeskData(req.body);
    if (!validation.valid) {
      throw new BadRequestError(validation.errors.join(', '));
    }

    // Calculate totals
    const totals = calculateTotals(products, categoryCreditCards, payments);

    // Default banknotes structure (new categorized format)
    const defaultBanknotes = {
      dolum: { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0, b5: 0, c1: 0, c050: 0 },
      kart: { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0, b5: 0, c1: 0, c050: 0 },
      vize: { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0, b5: 0, c1: 0, c050: 0 }
    };

    const deskData = {
      date,
      products,
      categoryCreditCards,
      payments,
      banknotes: banknotes || defaultBanknotes,
      bankSentCash: bankSentCash || {
        dolum: 0,
        kart: 0,
        vize: 0,
        totalSent: 0
      },
      totals,
      submittedBy: userId,
      submittedByEmail: req.user.email,
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'draft',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Check if draft already exists for this date
    const existingDraft = await db.collection(DESK_COLLECTION)
      .where('date', '==', date)
      .where('submittedBy', '==', userId)
      .where('status', '==', 'draft')
      .get();

    let docRef;
    if (!existingDraft.empty) {
      // Update existing draft
      docRef = existingDraft.docs[0].ref;
      await docRef.update({
        ...deskData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      // Create new draft
      docRef = await db.collection(DESK_COLLECTION).add(deskData);
    }

    const savedRecord = {
      id: docRef.id,
      ...deskData
    };

    successResponse(res, savedRecord, 'Kayıt başarıyla taslak olarak kaydedildi', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Submit desk record to responsible
 */
const submitToResponsible = async (req, res, next) => {
  try {
    const { date, products, categoryCreditCards, payments, banknotes, bankSentCash } = req.body;
    const userId = req.user.uid;

    // Validate data
    const validation = validateDeskData(req.body);
    if (!validation.valid) {
      throw new BadRequestError(validation.errors.join(', '));
    }

    // Check if already submitted for this date
    const existingSubmitted = await db.collection(DESK_COLLECTION)
      .where('date', '==', date)
      .where('submittedBy', '==', userId)
      .where('status', 'in', ['submitted', 'approved'])
      .get();

    if (!existingSubmitted.empty) {
      throw new BadRequestError('Bu tarih için zaten teslim edilmiş bir kayıt var');
    }

    // Calculate totals
    const totals = calculateTotals(products, categoryCreditCards, payments);

    // Default banknotes structure (new categorized format)
    const defaultBanknotes = {
      dolum: { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0, b5: 0, c1: 0, c050: 0 },
      kart: { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0, b5: 0, c1: 0, c050: 0 },
      vize: { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0, b5: 0, c1: 0, c050: 0 }
    };

    const deskData = {
      date,
      products,
      categoryCreditCards,
      payments,
      banknotes: banknotes || defaultBanknotes,
      bankSentCash: bankSentCash || {
        dolum: 0,
        kart: 0,
        vize: 0,
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

    // Delete any existing draft
    const existingDraft = await db.collection(DESK_COLLECTION)
      .where('date', '==', date)
      .where('submittedBy', '==', userId)
      .where('status', '==', 'draft')
      .get();

    if (!existingDraft.empty) {
      await existingDraft.docs[0].ref.delete();
    }

    // Create submitted record
    const docRef = await db.collection(DESK_COLLECTION).add(deskData);

    const submittedRecord = {
      id: docRef.id,
      ...deskData
    };

    successResponse(res, submittedRecord, 'Kayıt başarıyla sorumluya teslim edildi', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get submitted records (with filters)
 */
const getSubmittedRecords = async (req, res, next) => {
  try {
    const { startDate, endDate, status } = req.query;
    const userId = req.user.uid;
    const userRole = req.user.role;

    let query = db.collection(DESK_COLLECTION);

    // Desk users can only see their own records
    if (userRole === 'desk') {
      query = query.where('submittedBy', '==', userId);
    }

    // Status filter (must be applied before orderBy to avoid index issues)
    if (status && status !== 'all' && status !== 'draft') {
      query = query.where('status', '==', status);
    }

    // Get all records first, then filter client-side for complex queries
    const snapshot = await query.get();

    let records = [];
    snapshot.forEach(doc => {
      const data = doc.data();

      // Client-side filters
      let includeRecord = true;

      // Filter out drafts by default if status is not specified
      if (!status || status === 'all') {
        if (data.status === 'draft') {
          includeRecord = false;
        }
      } else if (status === 'draft') {
        // Only include drafts if explicitly requested
        if (data.status !== 'draft') {
          includeRecord = false;
        }
      }

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
            vize: 0,
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
            kart: { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0, b5: 0, c1: 0, c050: 0 },
            vize: { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0, b5: 0, c1: 0, c050: 0 }
          };
        }

        records.push(record);
      }
    });

    // Sort by date descending (client-side)
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

    const doc = await db.collection(DESK_COLLECTION).doc(id).get();

    if (!doc.exists) {
      throw new NotFoundError('Kayıt bulunamadı');
    }

    const data = doc.data();

    // Desk users can only see their own records
    if (userRole === 'desk' && data.submittedBy !== userId) {
      throw new ForbiddenError('Bu kaydı görüntüleme yetkiniz yok');
    }

    const record = {
      id: doc.id,
      ...convertTimestamps(data)
    };

    // Ensure bankSentCash exists for backward compatibility
    if (!record.bankSentCash) {
      record.bankSentCash = {
        dolum: 0,
        kart: 0,
        vize: 0,
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
        kart: { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0, b5: 0, c1: 0, c050: 0 },
        vize: { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0, b5: 0, c1: 0, c050: 0 }
      };
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

    const docRef = db.collection(DESK_COLLECTION).doc(id);
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
        newStatus = 'pending_revision'; // Revize bekleyen durum
        break;
    }

    // Update the record
    await docRef.update({
      status: newStatus,
      reviewedBy: userId,
      reviewedByEmail: userEmail,
      reviewedByRole: userRole, // Store who made the review (admin/responsible/supervisor)
      reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
      reviewNotes: notes || '',
      reviewAction: action, // Store the action taken
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const updatedDoc = await docRef.get();
    const updatedRecord = {
      id: updatedDoc.id,
      ...convertTimestamps(updatedDoc.data())
    };

    // Turkish messages for each action
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
 * Delete record (only draft or own rejected records)
 */
const deleteRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;
    const userRole = req.user.role;

    const docRef = db.collection(DESK_COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundError('Kayıt bulunamadı');
    }

    const record = doc.data();

    // Only allow deletion of drafts, rejected, revised or pending_revision records
    if (!['draft', 'rejected', 'revised', 'pending_revision'].includes(record.status)) {
      throw new BadRequestError('Sadece taslak, reddedilmiş, revize edilmiş veya revize bekleyen kayıtlar silinebilir');
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

/**
 * Get draft record for a specific date
 */
const getDraftByDate = async (req, res, next) => {
  try {
    const { date } = req.params;
    const userId = req.user.uid;

    const snapshot = await db.collection(DESK_COLLECTION)
      .where('date', '==', date)
      .where('submittedBy', '==', userId)
      .where('status', '==', 'draft')
      .get();

    if (snapshot.empty) {
      return successResponse(res, null, 'Taslak bulunamadı');
    }

    const data = snapshot.docs[0].data();
    const draft = {
      id: snapshot.docs[0].id,
      ...convertTimestamps(data)
    };

    // Ensure bankSentCash exists for backward compatibility
    if (!draft.bankSentCash) {
      draft.bankSentCash = {
        dolum: 0,
        kart: 0,
        vize: 0,
        totalSent: 0
      };
    }

    // Ensure banknotes is in new format
    if (draft.banknotes && !draft.banknotes.dolum) {
      // Old format - convert to new format
      const oldBanknotes = draft.banknotes;
      draft.banknotes = {
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
        kart: { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0, b5: 0, c1: 0, c050: 0 },
        vize: { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0, b5: 0, c1: 0, c050: 0 }
      };
    }

    successResponse(res, draft, 'Taslak başarıyla getirildi');
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

    const docRef = db.collection(DESK_COLLECTION).doc(id);
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

    // Validate data
    const validation = validateDeskData(req.body);
    if (!validation.valid) {
      throw new BadRequestError(validation.errors.join(', '));
    }

    // Calculate totals
    const totals = calculateTotals(products, categoryCreditCards, payments);

    // Default banknotes structure (new categorized format)
    const defaultBanknotes = {
      dolum: { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0, b5: 0, c1: 0, c050: 0 },
      kart: { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0, b5: 0, c1: 0, c050: 0 },
      vize: { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0, b5: 0, c1: 0, c050: 0 }
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
        vize: 0,
        totalSent: 0
      },
      totals,
      status: 'revised', // pending_revision -> revised
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

module.exports = {
  saveDraft,
  submitToResponsible,
  getSubmittedRecords,
  getRecordById,
  reviewRecord,
  deleteRecord,
  getDraftByDate,
  updateRecord
};
