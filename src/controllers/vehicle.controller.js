const { db } = require('../config/firebase');
const { successResponse } = require('../utils/response');
const { NotFoundError, ConflictError } = require('../utils/errors');

const VEHICLES_COLLECTION = 'vehicles';

/**
 * Get all vehicles
 */
const getAllVehicles = async (req, res, next) => {
  try {
    const snapshot = await db.collection(VEHICLES_COLLECTION)
      .orderBy('createdAt', 'desc')
      .get();

    const vehicles = [];
    snapshot.forEach(doc => {
      vehicles.push({
        id: doc.id,
        ...doc.data()
      });
    });

    successResponse(res, vehicles, 'Araçlar başarıyla getirildi');
  } catch (error) {
    next(error);
  }
};

/**
 * Get vehicle by ID
 */
const getVehicleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const doc = await db.collection(VEHICLES_COLLECTION).doc(id).get();

    if (!doc.exists) {
      throw new NotFoundError('Araç bulunamadı');
    }

    const vehicle = {
      id: doc.id,
      ...doc.data()
    };

    successResponse(res, vehicle, 'Araç başarıyla getirildi');
  } catch (error) {
    next(error);
  }
};

/**
 * Create new vehicle
 */
const createVehicle = async (req, res, next) => {
  try {
    // Sanitize: only allow known fields
    const { plateNumber, vehicleNumber, routeName, driverName, ownerName, iban, taxId, contactInfo } = req.body;
    const vehicleData = {};
    if (plateNumber !== undefined) vehicleData.plateNumber = plateNumber;
    if (vehicleNumber !== undefined) vehicleData.vehicleNumber = vehicleNumber;
    if (routeName !== undefined) vehicleData.routeName = routeName;
    if (driverName !== undefined) vehicleData.driverName = driverName;
    if (ownerName !== undefined) vehicleData.ownerName = ownerName;
    if (iban !== undefined) vehicleData.iban = iban;
    if (taxId !== undefined) vehicleData.taxId = taxId;
    if (contactInfo !== undefined) vehicleData.contactInfo = contactInfo;

    // Check if plate number already exists
    const existingPlate = await db.collection(VEHICLES_COLLECTION)
      .where('plateNumber', '==', vehicleData.plateNumber)
      .get();

    if (!existingPlate.empty) {
      throw new ConflictError('Bu plaka numarası zaten kayıtlı');
    }

    // Check if vehicle number already exists
    const existingVehicleNumber = await db.collection(VEHICLES_COLLECTION)
      .where('vehicleNumber', '==', vehicleData.vehicleNumber)
      .get();

    if (!existingVehicleNumber.empty) {
      throw new ConflictError('Bu araç numarası zaten kayıtlı');
    }

    const newVehicle = {
      ...vehicleData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await db.collection(VEHICLES_COLLECTION).add(newVehicle);

    const createdVehicle = {
      id: docRef.id,
      ...newVehicle
    };

    successResponse(res, createdVehicle, 'Araç başarıyla oluşturuldu', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update vehicle
 */
const updateVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Sanitize: only allow known fields
    const { plateNumber, vehicleNumber, routeName, driverName, ownerName, iban, taxId, contactInfo } = req.body;
    const updateData = {};
    if (plateNumber !== undefined) updateData.plateNumber = plateNumber;
    if (vehicleNumber !== undefined) updateData.vehicleNumber = vehicleNumber;
    if (routeName !== undefined) updateData.routeName = routeName;
    if (driverName !== undefined) updateData.driverName = driverName;
    if (ownerName !== undefined) updateData.ownerName = ownerName;
    if (iban !== undefined) updateData.iban = iban;
    if (taxId !== undefined) updateData.taxId = taxId;
    if (contactInfo !== undefined) updateData.contactInfo = contactInfo;

    const docRef = db.collection(VEHICLES_COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundError('Araç bulunamadı');
    }

    // Check if updating plate number and it conflicts
    if (updateData.plateNumber && updateData.plateNumber !== doc.data()?.plateNumber) {
      const existingPlate = await db.collection(VEHICLES_COLLECTION)
        .where('plateNumber', '==', updateData.plateNumber)
        .get();

      if (!existingPlate.empty) {
        throw new ConflictError('Bu plaka numarası zaten kayıtlı');
      }
    }

    // Check if updating vehicle number and it conflicts
    if (updateData.vehicleNumber && updateData.vehicleNumber !== doc.data()?.vehicleNumber) {
      const existingVehicleNumber = await db.collection(VEHICLES_COLLECTION)
        .where('vehicleNumber', '==', updateData.vehicleNumber)
        .get();

      if (!existingVehicleNumber.empty) {
        throw new ConflictError('Bu araç numarası zaten kayıtlı');
      }
    }

    const updatedData = {
      ...updateData,
      updatedAt: new Date()
    };

    await docRef.update(updatedData);

    const updatedDoc = await docRef.get();
    const updatedVehicle = {
      id: updatedDoc.id,
      ...updatedDoc.data()
    };

    successResponse(res, updatedVehicle, 'Araç başarıyla güncellendi');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete vehicle
 */
const deleteVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;

    const docRef = db.collection(VEHICLES_COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundError('Araç bulunamadı');
    }

    await docRef.delete();

    successResponse(res, { id }, 'Araç başarıyla silindi');
  } catch (error) {
    next(error);
  }
};

/**
 * Get vehicles by line name
 */
const getVehiclesByLine = async (req, res, next) => {
  try {
    const { routeName } = req.params;

    const snapshot = await db.collection(VEHICLES_COLLECTION)
      .where('routeName', '==', routeName)
      .orderBy('vehicleNumber', 'asc')
      .get();

    const vehicles = [];
    snapshot.forEach(doc => {
      vehicles.push({
        id: doc.id,
        ...doc.data()
      });
    });

    successResponse(res, vehicles, `${routeName} hattı için araçlar başarıyla getirildi`);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehiclesByLine
};
