const { db } = require('../config/firebase');
const { RecordType } = require('../constants/enums');
const { successResponse } = require('../utils/response');
const { NotFoundError, BadRequestError } = require('../utils/errors');

const RECORDS_COLLECTION = 'daily_records';

/**
 * Create new daily record
 */
const createRecord = async (req, res, next) => {
  try {
    const { date, type, routes, vehicles, raporal, sistem } = req.body;

    // Calculate difference (Raporal - System)
    const difference = Number(raporal) - Number(sistem);

    // Validate that vehicles is provided for CREDIT_CARD type
    if (type === RecordType.CREDIT_CARD && (!vehicles || Object.keys(vehicles).length === 0)) {
      throw new BadRequestError('Kredi kartı tipi için araç değerleri gereklidir');
    }

    const recordData = {
      date,
      type,
      routes: routes || {},
      vehicles: vehicles || {},
      raporal: Number(raporal),
      sistem: Number(sistem),
      difference,
      createdAt: new Date(),
      createdBy: req.user?.uid
    };

    const docRef = await db.collection(RECORDS_COLLECTION).add(recordData);

    const createdRecord = {
      id: docRef.id,
      ...recordData
    };

    successResponse(res, createdRecord, 'Daily record created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all records with optional filters
 */
const getRecords = async (req, res, next) => {
  try {
    const { startDate, endDate, type } = req.query;

    let query = db.collection(RECORDS_COLLECTION).orderBy('date', 'desc');

    // Apply filters
    if (startDate) {
      query = query.where('date', '>=', startDate);
    }
    if (endDate) {
      query = query.where('date', '<=', endDate);
    }
    if (type) {
      query = query.where('type', '==', type);
    }

    const snapshot = await query.get();

    const records = [];
    snapshot.forEach(doc => {
      records.push({
        id: doc.id,
        ...doc.data()
      });
    });

    successResponse(res, records, 'Records retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get record by ID
 */
const getRecordById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const doc = await db.collection(RECORDS_COLLECTION).doc(id).get();

    if (!doc.exists) {
      throw new NotFoundError('Record not found');
    }

    const record = {
      id: doc.id,
      ...doc.data()
    };

    successResponse(res, record, 'Record retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get records by date
 */
const getRecordsByDate = async (req, res, next) => {
  try {
    const { date } = req.params;

    const snapshot = await db.collection(RECORDS_COLLECTION)
      .where('date', '==', date)
      .orderBy('createdAt', 'desc')
      .get();

    const records = [];
    snapshot.forEach(doc => {
      records.push({
        id: doc.id,
        ...doc.data()
      });
    });

    successResponse(res, records, `Records for date ${date} retrieved successfully`);
  } catch (error) {
    next(error);
  }
};

/**
 * Update record
 */
const updateRecord = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Sanitize: only allow known fields
    const { date, type, routes, vehicles, raporal, sistem } = req.body;
    const updateData = {};
    if (date !== undefined) updateData.date = date;
    if (type !== undefined) updateData.type = type;
    if (routes !== undefined) updateData.routes = routes;
    if (vehicles !== undefined) updateData.vehicles = vehicles;
    if (raporal !== undefined) updateData.raporal = Number(raporal);
    if (sistem !== undefined) updateData.sistem = Number(sistem);

    const docRef = db.collection(RECORDS_COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundError('Record not found');
    }

    // Recalculate difference if amounts are being updated
    if (updateData.raporal !== undefined || updateData.sistem !== undefined) {
      const currentData = doc.data();
      const newRaporal = updateData.raporal !== undefined
        ? updateData.raporal
        : currentData.raporal;
      const newSystem = updateData.sistem !== undefined
        ? updateData.sistem
        : currentData.sistem;

      updateData.difference = newRaporal - newSystem;
    }

    const updatedData = {
      ...updateData,
      updatedAt: new Date()
    };

    await docRef.update(updatedData);

    const updatedDoc = await docRef.get();
    const updatedRecord = {
      id: updatedDoc.id,
      ...updatedDoc.data()
    };

    successResponse(res, updatedRecord, 'Record updated successfully');
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

    const docRef = db.collection(RECORDS_COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundError('Record not found');
    }

    await docRef.delete();

    successResponse(res, { id }, 'Record deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRecord,
  getRecords,
  getRecordById,
  getRecordsByDate,
  updateRecord,
  deleteRecord
};
