const { db } = require('../config/firebase');
const { successResponse } = require('../utils/response');
const { NotFoundError, BadRequestError, ConflictError } = require('../utils/errors');
const crypto = require('crypto');

// Generate UUID v4
const generateId = () => crypto.randomUUID();

// Yıllık izin hesaplama (Türk İş Kanunu)
function calculateAnnualLeaveDays(startDate) {
  const start = new Date(startDate);
  const now = new Date();
  const yearsWorked = (now - start) / (1000 * 60 * 60 * 24 * 365);

  if (yearsWorked < 5) return 14;
  if (yearsWorked < 15) return 20;
  return 26;
}

// İş günü hesaplama (cumartesi/pazar hariç)
function calculateWorkdays(startDate, endDate) {
  let count = 0;
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++; // 0=Pazar, 6=Cumartesi
    current.setDate(current.getDate() + 1);
  }

  return count;
}

// ===== ÇALIŞAN CRUD =====
exports.getAllEmployees = async (req, res, next) => {
  try {
    const snapshot = await db.collection('employees').orderBy('firstName', 'asc').get();
    const employees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    successResponse(res, employees, 'Çalışanlar başarıyla getirildi');
  } catch (error) {
    next(error);
  }
};

exports.getEmployeeById = async (req, res, next) => {
  try {
    const doc = await db.collection('employees').doc(req.params.id).get();
    if (!doc.exists) {
      throw new NotFoundError('Çalışan bulunamadı');
    }
    successResponse(res, { id: doc.id, ...doc.data() }, 'Çalışan başarıyla getirildi');
  } catch (error) {
    next(error);
  }
};

exports.createEmployee = async (req, res, next) => {
  try {
    const { firstName, lastName, tcNo, email, phone, department, position, startDate, isActive } = req.body;

    // Input validation
    if (!firstName || !lastName || !tcNo || !startDate) {
      throw new BadRequestError('Ad, soyad, TC No ve işe başlama tarihi zorunludur');
    }

    // TC No unique kontrolü
    const existingEmployee = await db.collection('employees').where('tcNo', '==', tcNo).get();
    if (!existingEmployee.empty) {
      throw new ConflictError('Bu TC No ile kayıtlı çalışan zaten mevcut');
    }

    const id = generateId();
    const now = new Date().toISOString();
    const employeeData = {
      firstName,
      lastName,
      tcNo,
      email: email || '',
      phone: phone || '',
      department: department || '',
      position: position || '',
      startDate,
      isActive: isActive !== undefined ? isActive : true,
      createdAt: now,
      updatedAt: now,
    };

    // Use batch to atomically create employee and entitlement
    const batch = db.batch();

    const employeeRef = db.collection('employees').doc(id);
    batch.set(employeeRef, employeeData);

    // Mevcut yıl için izin hakkı oluştur
    const currentYear = new Date().getFullYear();
    const totalDays = calculateAnnualLeaveDays(startDate);
    const entitlementId = generateId();

    const entitlementRef = db.collection('leave_entitlements').doc(entitlementId);
    batch.set(entitlementRef, {
      employeeId: id,
      year: currentYear,
      totalDays,
      usedDays: 0,
      remainingDays: totalDays,
      createdAt: now,
      updatedAt: now,
    });

    await batch.commit();

    successResponse(res, { id, ...employeeData }, 'Çalışan başarıyla oluşturuldu', 201);
  } catch (error) {
    next(error);
  }
};

exports.updateEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Sanitize: only allow known fields
    const { firstName, lastName, tcNo, email, phone, department, position, startDate, isActive } = req.body;
    const updates = {};
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (tcNo !== undefined) updates.tcNo = tcNo;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (department !== undefined) updates.department = department;
    if (position !== undefined) updates.position = position;
    if (startDate !== undefined) updates.startDate = startDate;
    if (isActive !== undefined) updates.isActive = isActive;
    updates.updatedAt = new Date().toISOString();

    const docRef = db.collection('employees').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundError('Çalışan bulunamadı');
    }

    await docRef.update(updates);

    // Eğer startDate değiştiyse, izin hakları yeniden hesaplanmalı
    if (updates.startDate) {
      const currentYear = new Date().getFullYear();
      const totalDays = calculateAnnualLeaveDays(updates.startDate);

      const entitlementSnapshot = await db.collection('leave_entitlements')
        .where('employeeId', '==', id)
        .where('year', '==', currentYear)
        .get();

      if (!entitlementSnapshot.empty) {
        const entitlementDoc = entitlementSnapshot.docs[0];
        const currentData = entitlementDoc.data();
        await entitlementDoc.ref.update({
          totalDays,
          remainingDays: totalDays - currentData.usedDays,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    successResponse(res, { id, ...doc.data(), ...updates }, 'Çalışan başarıyla güncellendi');
  } catch (error) {
    next(error);
  }
};

exports.deleteEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const docRef = db.collection('employees').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundError('Çalışan bulunamadı');
    }

    // Soft delete (isActive = false)
    await docRef.update({ isActive: false, updatedAt: new Date().toISOString() });

    successResponse(res, { id }, 'Çalışan silindi');
  } catch (error) {
    next(error);
  }
};

// ===== İZİN TALEPLERİ =====
exports.getLeaveRequests = async (req, res, next) => {
  try {
    const { employeeId, status, year } = req.query;

    let query = db.collection('leave_requests');

    if (employeeId) {
      query = query.where('employeeId', '==', employeeId);
    }

    if (status) {
      query = query.where('status', '==', status);
    }

    // If year filter is used, we need to sort client-side due to Firestore limitations
    let snapshot;
    if (year) {
      const startOfYear = `${year}-01-01`;
      const endOfYear = `${year}-12-31`;
      query = query.where('startDate', '>=', startOfYear).where('startDate', '<=', endOfYear);
      snapshot = await query.get();
    } else {
      snapshot = await query.orderBy('requestedAt', 'desc').get();
    }

    let requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // If year filter was used, sort client-side
    if (year) {
      requests.sort((a, b) => {
        const dateA = new Date(a.requestedAt || 0);
        const dateB = new Date(b.requestedAt || 0);
        return dateB - dateA;
      });
    }

    successResponse(res, requests, 'İzin talepleri başarıyla getirildi');
  } catch (error) {
    next(error);
  }
};

exports.createLeaveRequest = async (req, res, next) => {
  try {
    const { employeeId, leaveType, startDate, endDate, description } = req.body;

    // Input validation
    if (!employeeId || !leaveType || !startDate || !endDate) {
      throw new BadRequestError('Çalışan, izin tipi, başlangıç ve bitiş tarihi zorunludur');
    }

    // Validasyon 1: Tarih kontrolü
    if (new Date(startDate) > new Date(endDate)) {
      throw new BadRequestError('Bitiş tarihi başlangıç tarihinden önce olamaz');
    }

    // İş günü hesapla
    const totalDays = calculateWorkdays(startDate, endDate);

    // Validasyon 2: Yıllık izin ise kalan gün kontrolü
    if (leaveType === 'annual') {
      const currentYear = new Date().getFullYear();
      const entitlementSnapshot = await db.collection('leave_entitlements')
        .where('employeeId', '==', employeeId)
        .where('year', '==', currentYear)
        .get();

      if (!entitlementSnapshot.empty) {
        const entitlement = entitlementSnapshot.docs[0].data();
        if (entitlement.remainingDays < totalDays) {
          throw new BadRequestError(
            `Yetersiz izin hakkı. Kalan: ${entitlement.remainingDays} gün, Talep: ${totalDays} gün`
          );
        }
      }
    }

    // Validasyon 3: Çakışan izin kontrolü
    const conflictQuery = await db.collection('leave_requests')
      .where('employeeId', '==', employeeId)
      .where('status', 'in', ['pending', 'approved'])
      .get();

    for (const doc of conflictQuery.docs) {
      const existing = doc.data();
      if (
        (startDate >= existing.startDate && startDate <= existing.endDate) ||
        (endDate >= existing.startDate && endDate <= existing.endDate) ||
        (startDate <= existing.startDate && endDate >= existing.endDate)
      ) {
        throw new ConflictError('Bu tarih aralığında zaten izin kaydı var');
      }
    }

    const id = generateId();
    const now = new Date().toISOString();
    const requestData = {
      employeeId,
      leaveType,
      startDate,
      endDate,
      totalDays,
      status: 'pending',
      description: description || '',
      requestedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('leave_requests').doc(id).set(requestData);

    successResponse(res, { id, ...requestData }, 'İzin talebi başarıyla oluşturuldu', 201);
  } catch (error) {
    next(error);
  }
};

exports.reviewLeaveRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, notes } = req.body;
    const user = req.user;

    // Input validation
    if (!action || !['approve', 'reject'].includes(action)) {
      throw new BadRequestError('Geçersiz aksiyon. "approve" veya "reject" olmalıdır');
    }

    const docRef = db.collection('leave_requests').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundError('İzin talebi bulunamadı');
    }

    const requestData = doc.data();
    const now = new Date().toISOString();

    if (requestData.status !== 'pending') {
      throw new BadRequestError('Sadece bekleyen izin talepleri incelenebilir');
    }

    if (action === 'approve') {
      // Use Firestore transaction to atomically update entitlement + request
      const currentYear = new Date().getFullYear();
      const entitlementSnapshot = await db.collection('leave_entitlements')
        .where('employeeId', '==', requestData.employeeId)
        .where('year', '==', currentYear)
        .get();

      if (!entitlementSnapshot.empty) {
        const entitlementDocRef = entitlementSnapshot.docs[0].ref;

        await db.runTransaction(async (transaction) => {
          const entitlementDoc = await transaction.get(entitlementDocRef);
          const entitlement = entitlementDoc.data();

          transaction.update(entitlementDocRef, {
            usedDays: entitlement.usedDays + requestData.totalDays,
            remainingDays: entitlement.remainingDays - requestData.totalDays,
            updatedAt: now,
          });

          transaction.update(docRef, {
            status: 'approved',
            reviewedBy: user.uid,
            reviewedByEmail: user.email,
            reviewNotes: notes || '',
            reviewedAt: now,
            updatedAt: now,
          });
        });
      } else {
        // No entitlement record, just update the request
        await docRef.update({
          status: 'approved',
          reviewedBy: user.uid,
          reviewedByEmail: user.email,
          reviewNotes: notes || '',
          reviewedAt: now,
          updatedAt: now,
        });
      }
    } else {
      await docRef.update({
        status: 'rejected',
        reviewedBy: user.uid,
        reviewedByEmail: user.email,
        reviewNotes: notes || '',
        reviewedAt: now,
        updatedAt: now,
      });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    successResponse(res, { id, ...requestData, status: newStatus }, `İzin talebi ${newStatus === 'approved' ? 'onaylandı' : 'reddedildi'}`);
  } catch (error) {
    next(error);
  }
};

exports.cancelLeaveRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const docRef = db.collection('leave_requests').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundError('İzin talebi bulunamadı');
    }

    const requestData = doc.data();

    if (!['pending', 'approved'].includes(requestData.status)) {
      throw new BadRequestError('Sadece bekleyen veya onaylanmış izin talepleri iptal edilebilir');
    }

    const now = new Date().toISOString();

    // Eğer onaylıysa, leave_entitlement'tan düş — atomik transaction ile
    if (requestData.status === 'approved') {
      const currentYear = new Date().getFullYear();
      const entitlementSnapshot = await db.collection('leave_entitlements')
        .where('employeeId', '==', requestData.employeeId)
        .where('year', '==', currentYear)
        .get();

      if (!entitlementSnapshot.empty) {
        const entitlementDocRef = entitlementSnapshot.docs[0].ref;

        await db.runTransaction(async (transaction) => {
          const entitlementDoc = await transaction.get(entitlementDocRef);
          const entitlement = entitlementDoc.data();

          transaction.update(entitlementDocRef, {
            usedDays: entitlement.usedDays - requestData.totalDays,
            remainingDays: entitlement.remainingDays + requestData.totalDays,
            updatedAt: now,
          });

          transaction.update(docRef, {
            status: 'cancelled',
            updatedAt: now,
          });
        });
      } else {
        await docRef.update({
          status: 'cancelled',
          updatedAt: now,
        });
      }
    } else {
      await docRef.update({
        status: 'cancelled',
        updatedAt: now,
      });
    }

    successResponse(res, { id }, 'İzin talebi iptal edildi');
  } catch (error) {
    next(error);
  }
};

// ===== İZİN HAKEDİŞLERİ =====
exports.getLeaveEntitlements = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { year } = req.query;

    let query = db.collection('leave_entitlements').where('employeeId', '==', employeeId);

    if (year) {
      query = query.where('year', '==', parseInt(year));
    }

    const snapshot = await query.get();
    const entitlements = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    successResponse(res, entitlements, 'İzin hakları başarıyla getirildi');
  } catch (error) {
    next(error);
  }
};

exports.getAllEntitlements = async (req, res, next) => {
  try {
    const { year } = req.query;

    let query = db.collection('leave_entitlements');

    if (year) {
      query = query.where('year', '==', parseInt(year));
    }

    const snapshot = await query.get();
    const entitlements = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    successResponse(res, entitlements, 'İzin hakları başarıyla getirildi');
  } catch (error) {
    next(error);
  }
};
