const { db } = require('../config/firebase');
const { successResponse } = require('../utils/response');
const { NotFoundError, BadRequestError } = require('../utils/errors');

const HAKEDIS_COLLECTION = 'hakedis';

/**
 * Create new hakediş (progress payment)
 */
const createHakedis = async (req, res, next) => {
  try {
    const { 
      date,
      type,
      routes,
      vehicles,
      raporal,
      sistem
    } = req.body;

    // Calculate difference (Raporal - Sistem)
    const difference = Number(raporal) - Number(sistem);

    const hakedisData = {
      date,
      type,
      routes: routes || {},
      vehicles: vehicles || {},
      raporal: Number(raporal),
      sistem: Number(sistem),
      difference,
      createdAt: new Date(),
      createdBy: req.user?.uid,
      updatedAt: new Date()
    };

    const docRef = await db.collection(HAKEDIS_COLLECTION).add(hakedisData);

    const createdHakedis = {
      id: docRef.id,
      ...hakedisData
    };

    // Create report records for vehicles based on their routes
    // Get all vehicles to map them to their routes
    const vehiclesSnapshot = await db.collection('vehicles').get();
    const vehiclesByRoute = {};
    const vehiclesByNumber = {};

    vehiclesSnapshot.forEach(doc => {
      const vehicleData = doc.data();
      const routeName = (vehicleData.routeName || vehicleData.lineName || '').toLowerCase();
      if (!vehiclesByRoute[routeName]) {
        vehiclesByRoute[routeName] = [];
      }
      vehiclesByRoute[routeName].push(vehicleData);
      vehiclesByNumber[vehicleData.vehicleNumber] = vehicleData;
    });

    // Use a batched write to ensure atomicity of report creation
    const batch = db.batch();

    // Process route-based hakedis
    if (routes && Object.keys(routes).length > 0) {
      for (const [routeName, routeAmount] of Object.entries(routes)) {
        const routeNameLower = routeName.toLowerCase();
        const vehiclesOnRoute = vehiclesByRoute[routeNameLower] || [];

        if (vehiclesOnRoute.length === 0) {
          continue;
        }

        for (const vehicle of vehiclesOnRoute) {
          let actualRouteAmount = 0;
          let actualVehicleAmount = 0;

          if (type === 'HAFTALIK') {
            actualRouteAmount = Number(routeAmount);
            actualVehicleAmount = (vehicles && vehicles[vehicle.vehicleNumber])
              ? Number(vehicles[vehicle.vehicleNumber])
              : 0;
          } else if (type === 'KREDI_KARTI') {
            actualVehicleAmount = Number(routeAmount);
            if (vehicles && vehicles[vehicle.vehicleNumber]) {
              actualVehicleAmount += Number(vehicles[vehicle.vehicleNumber]);
            }
            actualRouteAmount = 0;
          }

          const totalAmount = actualRouteAmount + actualVehicleAmount;

          const reportData = {
            date,
            vehicleNumber: vehicle.vehicleNumber,
            plateNumber: vehicle.plateNumber,
            routeName: vehicle.routeName || vehicle.lineName,
            routeAmount: actualRouteAmount,
            vehicleAmount: actualVehicleAmount,
            totalAmount: totalAmount,
            type,
            hakedisId: docRef.id,
            createdAt: new Date()
          };

          const reportRef = db.collection('reports').doc();
          batch.set(reportRef, reportData);
        }
      }
    }

    // Process vehicle-specific amounts that might not have a route entry
    if (vehicles && Object.keys(vehicles).length > 0) {
      for (const [vehicleNumber, vehicleAmount] of Object.entries(vehicles)) {
        const vehicle = vehiclesByNumber[Number(vehicleNumber)];
        if (vehicle) {
          const vehicleRouteName = vehicle.routeName || vehicle.lineName;
          const vehicleRouteNameLower = (vehicleRouteName || '').toLowerCase();

          let routeAlreadyProcessed = false;
          if (routes) {
            for (const rName of Object.keys(routes)) {
              if (rName.toLowerCase() === vehicleRouteNameLower) {
                routeAlreadyProcessed = true;
                break;
              }
            }
          }

          if (!routeAlreadyProcessed) {
            const reportData = {
              date,
              vehicleNumber: Number(vehicleNumber),
              plateNumber: vehicle.plateNumber,
              routeName: vehicleRouteName,
              routeAmount: 0,
              vehicleAmount: Number(vehicleAmount),
              totalAmount: Number(vehicleAmount),
              type,
              hakedisId: docRef.id,
              createdAt: new Date()
            };

            const reportRef = db.collection('reports').doc();
            batch.set(reportRef, reportData);
          }
        }
      }
    }

    // Commit all reports atomically
    await batch.commit();

    successResponse(res, createdHakedis, 'Hakediş başarıyla oluşturuldu', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all hakediş with optional filters
 */
const getAllHakedis = async (req, res, next) => {
  try {
    const { type, startDate, endDate } = req.query;

    let query = db.collection(HAKEDIS_COLLECTION).orderBy('date', 'desc');

    // Apply filters
    if (type) {
      query = query.where('type', '==', type);
    }
    if (startDate) {
      query = query.where('date', '>=', startDate);
    }
    if (endDate) {
      query = query.where('date', '<=', endDate);
    }

    const snapshot = await query.get();

    const hakedisler = [];
    snapshot.forEach(doc => {
      hakedisler.push({
        id: doc.id,
        ...doc.data()
      });
    });

    successResponse(res, hakedisler, 'Hakediş listesi başarıyla alındı');
  } catch (error) {
    next(error);
  }
};

/**
 * Get hakediş by ID
 */
const getHakedisById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const doc = await db.collection(HAKEDIS_COLLECTION).doc(id).get();

    if (!doc.exists) {
      throw new NotFoundError('Hakediş bulunamadı');
    }

    const hakedis = {
      id: doc.id,
      ...doc.data()
    };

    successResponse(res, hakedis, 'Hakediş başarıyla alındı');
  } catch (error) {
    next(error);
  }
};

/**
 * Update hakediş
 */
const updateHakedis = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Sanitize: only allow known fields
    const { date, type, routes, vehicles, raporal, sistem } = req.body;
    const updates = {};
    if (date !== undefined) updates.date = date;
    if (type !== undefined) updates.type = type;
    if (routes !== undefined) updates.routes = routes;
    if (vehicles !== undefined) updates.vehicles = vehicles;
    if (raporal !== undefined) updates.raporal = Number(raporal);
    if (sistem !== undefined) updates.sistem = Number(sistem);

    const docRef = db.collection(HAKEDIS_COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundError('Hakediş bulunamadı');
    }

    // Recalculate difference if raporal or sistem changes
    if (updates.raporal !== undefined || updates.sistem !== undefined) {
      const currentData = doc.data();
      const newRaporal = updates.raporal !== undefined ? updates.raporal : currentData.raporal;
      const newSistem = updates.sistem !== undefined ? updates.sistem : currentData.sistem;
      updates.difference = newRaporal - newSistem;
    }

    const updatedData = {
      ...updates,
      updatedAt: new Date()
    };

    await docRef.update(updatedData);

    const updatedDoc = await docRef.get();
    const hakedis = {
      id: updatedDoc.id,
      ...updatedDoc.data()
    };

    successResponse(res, hakedis, 'Hakediş başarıyla güncellendi');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete hakediş
 */
const deleteHakedis = async (req, res, next) => {
  try {
    const { id } = req.params;

    const docRef = db.collection(HAKEDIS_COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundError('Hakediş bulunamadı');
    }

    await docRef.delete();

    successResponse(res, null, 'Hakediş başarıyla silindi');
  } catch (error) {
    next(error);
  }
};

/**
 * Get weekly hakedis summary for bank submission
 * Returns all vehicles with their weekly and credit card hakedis for a specific week
 */
const getWeeklyHakedisSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      throw new BadRequestError('Başlangıç ve bitiş tarihi gereklidir');
    }

    // Get all reports for the date range
    const reportsSnapshot = await db.collection('reports')
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .get();

    // Get all vehicles to fetch IBAN and Tax ID information
    const vehiclesSnapshot = await db.collection('vehicles').get();
    const vehicleInfoMap = new Map();

    vehiclesSnapshot.forEach(doc => {
      const vehicleData = doc.data();
      vehicleInfoMap.set(vehicleData.vehicleNumber, {
        iban: vehicleData.iban || '',
        taxId: vehicleData.taxId || ''
      });
    });

    // Group data by vehicle
    const vehicleMap = new Map();

    reportsSnapshot.forEach(doc => {
      const report = doc.data();
      const vehicleKey = `${report.vehicleNumber}`;

      if (!vehicleMap.has(vehicleKey)) {
        const vehicleInfo = vehicleInfoMap.get(report.vehicleNumber) || { iban: '', taxId: '' };
        vehicleMap.set(vehicleKey, {
          vehicleNumber: report.vehicleNumber,
          plateNumber: report.plateNumber,
          routeName: report.routeName,
          iban: vehicleInfo.iban,
          taxId: vehicleInfo.taxId,
          haftalik: {
            routeAmount: 0,
            vehicleAmount: 0,
            totalAmount: 0
          },
          krediKarti: {
            routeAmount: 0,
            vehicleAmount: 0,
            totalAmount: 0
          },
          grandTotal: 0
        });
      }

      const vehicle = vehicleMap.get(vehicleKey);

      if (report.type === 'HAFTALIK') {
        vehicle.haftalik.routeAmount += report.routeAmount || 0;
        vehicle.haftalik.vehicleAmount += report.vehicleAmount || 0;
        vehicle.haftalik.totalAmount += report.totalAmount || 0;
      } else if (report.type === 'KREDI_KARTI') {
        vehicle.krediKarti.routeAmount += report.routeAmount || 0;
        vehicle.krediKarti.vehicleAmount += report.vehicleAmount || 0;
        vehicle.krediKarti.totalAmount += report.totalAmount || 0;
      }

      vehicle.grandTotal = vehicle.haftalik.totalAmount + vehicle.krediKarti.totalAmount;
    });

    // Convert map to array and sort by vehicle number
    const vehicles = Array.from(vehicleMap.values()).sort((a, b) => a.vehicleNumber - b.vehicleNumber);

    // Calculate overall totals
    const summary = {
      totalHaftalik: vehicles.reduce((sum, v) => sum + v.haftalik.totalAmount, 0),
      totalKrediKarti: vehicles.reduce((sum, v) => sum + v.krediKarti.totalAmount, 0),
      grandTotal: vehicles.reduce((sum, v) => sum + v.grandTotal, 0),
      vehicleCount: vehicles.length
    };

    const response = {
      startDate,
      endDate,
      summary,
      vehicles
    };

    successResponse(res, response, 'Haftalık hakediş özeti başarıyla alındı');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createHakedis,
  getAllHakedis,
  getHakedisById,
  updateHakedis,
  deleteHakedis,
  getWeeklyHakedisSummary
};
