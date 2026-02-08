const express = require('express');
const {
  getRecordsByDateRange,
  getVehicleReport,
  getLineReport,
  getSummaryReport
} = require('../controllers/report.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const {
  dateRangeValidation,
  vehicleReportValidation,
  lineReportValidation
} = require('../validators/report.validator');
const { UserRole } = require('../constants/enums');

const router = express.Router();

// All routes require JWT authentication and admin/supervisor role
router.use(authenticate);
router.use(authorize(UserRole.ADMIN, UserRole.SUPERVISOR));

// Get records by date range
router.get('/date-range', validate(dateRangeValidation), getRecordsByDateRange);

// Get records by specific date (alias for frontend compatibility)
router.get('/date', validate(dateRangeValidation), getRecordsByDateRange);

// Get summary report
router.get('/summary', getSummaryReport);

// Get report for specific vehicle
router.get('/vehicle/:vehicleNumber', validate(vehicleReportValidation), getVehicleReport);

// Get report for specific route
router.get('/route/:routeName', validate(lineReportValidation), getLineReport);

// Alias for line report (backwards compatibility)
router.get('/line/:routeName', validate(lineReportValidation), getLineReport);

module.exports = router;
