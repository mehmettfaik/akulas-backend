const { db } = require('../config/firebase');
const { successResponse } = require('../utils/response');
const { NotFoundError, BadRequestError } = require('../utils/errors');

const RECORDS_COLLECTION = 'daily_records';
const VEHICLES_COLLECTION = 'vehicles';

/**
 * Get records within a date range
 */
const getRecordsByDateRange = async (req, res, next) => {
  try {
    const { startDate, endDate, type } = req.query;

    if (!startDate || !endDate) {
      throw new BadRequestError('Start date and end date are required');
    }

    // Validate date order
    if (new Date(startDate) > new Date(endDate)) {
      throw new BadRequestError('Start date cannot be after end date');
    }

    let query = db.collection(RECORDS_COLLECTION)
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .orderBy('date', 'desc');

    const snapshot = await query.get();

    let records = [];
    snapshot.forEach(doc => {
      records.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Filter by type if provided (since we can only use one where clause on date)
    if (type) {
      records = records.filter(record => record.type === type);
    }

    // Calculate totals
    const totals = {
      totalRaporal: records.reduce((sum, r) => sum + (r.raporal || 0), 0),
      totalSystem: records.reduce((sum, r) => sum + (r.sistem || 0), 0),
      totalDifference: records.reduce((sum, r) => sum + (r.difference || 0), 0),
      recordCount: records.length
    };

    successResponse(res, {
      records,
      totals,
      dateRange: { startDate, endDate }
    }, 'Date range report retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get report for a specific vehicle
 */
const getVehicleReport = async (req, res, next) => {
  try {
    const { vehicleNumber } = req.params;
    const { startDate, endDate } = req.query;

    // Get vehicle info by vehicleNumber
    const vehicleSnapshot = await db.collection(VEHICLES_COLLECTION)
      .where('vehicleNumber', '==', Number(vehicleNumber))
      .get();
    
    if (vehicleSnapshot.empty) {
      throw new NotFoundError('Araç bulunamadı');
    }

    const vehicleDoc = vehicleSnapshot.docs[0];
    const vehicle = {
      id: vehicleDoc.id,
      ...vehicleDoc.data()
    };

    // Build query for reports collection (no orderBy to avoid index requirement)
    let query = db.collection('reports')
      .where('vehicleNumber', '==', Number(vehicleNumber));

    const snapshot = await query.get();

    // Group reports by week (date) to calculate weekly totals
    const reportsByWeek = {};
    
    snapshot.forEach(doc => {
      const reportData = doc.data();
      
      // Apply date filters
      const reportDate = reportData.date;
      const isInRange = (!startDate || reportDate >= startDate) && 
                        (!endDate || reportDate <= endDate);
      
      if (isInRange) {
        if (!reportsByWeek[reportDate]) {
          reportsByWeek[reportDate] = {
            date: reportDate,
            vehicleNumber: reportData.vehicleNumber,
            plateNumber: reportData.plateNumber,
            routeName: reportData.routeName,
            routeAmount: 0,
            vehicleAmount: 0,
            totalAmount: 0,
            types: []
          };
        }
        
        // Add amounts based on type
        reportsByWeek[reportDate].routeAmount += (reportData.routeAmount || 0);
        reportsByWeek[reportDate].vehicleAmount += (reportData.vehicleAmount || 0);
        reportsByWeek[reportDate].totalAmount += (reportData.totalAmount || reportData.amount || 0);
        
        if (!reportsByWeek[reportDate].types.includes(reportData.type)) {
          reportsByWeek[reportDate].types.push(reportData.type);
        }
      }
    });

    // Convert to array and sort by date descending
    const vehicleReports = Object.values(reportsByWeek).sort((a, b) => b.date.localeCompare(a.date));

    // Calculate totals
    const totalAmount = vehicleReports.reduce((sum, report) => sum + report.totalAmount, 0);
    const totalRouteAmount = vehicleReports.reduce((sum, report) => sum + report.routeAmount, 0);
    const totalVehicleAmount = vehicleReports.reduce((sum, report) => sum + report.vehicleAmount, 0);

    successResponse(res, {
      vehicle: {
        vehicleNumber: vehicle.vehicleNumber,
        plateNumber: vehicle.plateNumber,
        routeName: vehicle.routeName || vehicle.lineName,
        driverName: vehicle.driverName
      },
      reports: vehicleReports,
      summary: {
        totalAmount,
        totalRouteAmount,
        totalVehicleAmount,
        reportCount: vehicleReports.length,
        startDate,
        endDate
      }
    }, `${vehicle.vehicleNumber} numaralı araç için rapor başarıyla getirildi`);
  } catch (error) {
    next(error);
  }
};

/**
 * Get report for a specific route/line
 */
const getLineReport = async (req, res, next) => {
  try {
    const { routeName } = req.params;
    const { startDate, endDate } = req.query;

    // Get vehicles on this route (check both routeName and lineName fields)
    const vehiclesSnapshot = await db.collection(VEHICLES_COLLECTION).get();
    const vehicles = [];
    
    vehiclesSnapshot.forEach(doc => {
      const vehicleData = doc.data();
      const vehicleRoute = vehicleData.routeName || vehicleData.lineName;
      if (vehicleRoute === routeName) {
        vehicles.push({
          id: doc.id,
          ...vehicleData
        });
      }
    });

    // Get reports for this route
    const reportsSnapshot = await db.collection('reports')
      .where('routeName', '==', routeName)
      .get();

    // Filter by date range and aggregate
    const reportsByDate = {};
    
    reportsSnapshot.forEach(doc => {
      const reportData = doc.data();
      const reportDate = reportData.date;
      
      const isInRange = (!startDate || reportDate >= startDate) && 
                        (!endDate || reportDate <= endDate);
      
      if (isInRange) {
        if (!reportsByDate[reportDate]) {
          reportsByDate[reportDate] = {
            date: reportDate,
            routeAmount: 0,
            vehicleAmount: 0,
            totalAmount: 0,
            vehicleCount: 0,
            types: []
          };
        }
        
        reportsByDate[reportDate].routeAmount += (reportData.routeAmount || 0);
        reportsByDate[reportDate].vehicleAmount += (reportData.vehicleAmount || 0);
        reportsByDate[reportDate].totalAmount += (reportData.totalAmount || reportData.amount || 0);
        reportsByDate[reportDate].vehicleCount++;
        
        if (!reportsByDate[reportDate].types.includes(reportData.type)) {
          reportsByDate[reportDate].types.push(reportData.type);
        }
      }
    });

    // Convert to array and sort
    const lineReports = Object.values(reportsByDate).sort((a, b) => b.date.localeCompare(a.date));

    // Calculate totals
    const totalAmount = lineReports.reduce((sum, report) => sum + report.totalAmount, 0);
    const totalRouteAmount = lineReports.reduce((sum, report) => sum + report.routeAmount, 0);
    const totalVehicleAmount = lineReports.reduce((sum, report) => sum + report.vehicleAmount, 0);

    successResponse(res, {
      routeName,
      vehicles,
      reports: lineReports,
      summary: {
        totalAmount,
        totalRouteAmount,
        totalVehicleAmount,
        recordCount: lineReports.length,
        vehicleCount: vehicles.length,
        startDate,
        endDate
      }
    }, `${routeName} hattı için rapor başarıyla getirildi`);
  } catch (error) {
    next(error);
  }
};

/**
 * Get summary statistics
 */
const getSummaryReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    // Get all hakedis records
    let hakedisQuery = db.collection('hakedis');

    if (startDate) {
      hakedisQuery = hakedisQuery.where('date', '>=', startDate);
    }
    if (endDate) {
      hakedisQuery = hakedisQuery.where('date', '<=', endDate);
    }

    const hakedisSnapshot = await hakedisQuery.get();

    const hakedisRecords = [];
    hakedisSnapshot.forEach(doc => {
      hakedisRecords.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Calculate statistics
    const weeklyRecords = hakedisRecords.filter(r => r.type === 'HAFTALIK');
    const creditCardRecords = hakedisRecords.filter(r => r.type === 'KREDI_KARTI');

    const summary = {
      total: {
        records: hakedisRecords.length,
        raporal: hakedisRecords.reduce((sum, r) => sum + (r.raporal || 0), 0),
        sistem: hakedisRecords.reduce((sum, r) => sum + (r.sistem || 0), 0),
        difference: hakedisRecords.reduce((sum, r) => sum + (r.difference || 0), 0)
      },
      weekly: {
        records: weeklyRecords.length,
        raporal: weeklyRecords.reduce((sum, r) => sum + (r.raporal || 0), 0),
        sistem: weeklyRecords.reduce((sum, r) => sum + (r.sistem || 0), 0),
        difference: weeklyRecords.reduce((sum, r) => sum + (r.difference || 0), 0)
      },
      creditCard: {
        records: creditCardRecords.length,
        raporal: creditCardRecords.reduce((sum, r) => sum + (r.raporal || 0), 0),
        sistem: creditCardRecords.reduce((sum, r) => sum + (r.sistem || 0), 0),
        difference: creditCardRecords.reduce((sum, r) => sum + (r.difference || 0), 0)
      },
      dateRange: {
        startDate: startDate || 'N/A',
        endDate: endDate || 'N/A'
      }
    };

    successResponse(res, summary, 'Özet rapor başarıyla getirildi');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRecordsByDateRange,
  getVehicleReport,
  getLineReport,
  getSummaryReport
};
