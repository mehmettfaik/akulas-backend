const express = require('express');
const {
  createRecord,
  getRecords,
  getRecordById,
  getRecordsByDate,
  updateRecord,
  deleteRecord
} = require('../controllers/record.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const {
  createRecordValidation,
  getRecordsByDateValidation,
  recordIdValidation
} = require('../validators/record.validator');
const { UserRole } = require('../constants/enums');

const router = express.Router();

// All routes require JWT authentication
router.use(authenticate);

// Get all records with filters (admin and supervisor only)
router.get('/', authorize(UserRole.ADMIN, UserRole.SUPERVISOR), validate(getRecordsByDateValidation), getRecords);

// Get records by specific date (admin and supervisor only)
router.get('/date/:date', authorize(UserRole.ADMIN, UserRole.SUPERVISOR), getRecordsByDate);

// Get record by ID (admin and supervisor only)
router.get('/:id', authorize(UserRole.ADMIN, UserRole.SUPERVISOR), validate(recordIdValidation), getRecordById);

// Create record (admin, supervisor, and desk)
router.post(
  '/',
  authorize(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.DESK),
  validate(createRecordValidation),
  createRecord
);

// Update record (admin and supervisor only)
router.put(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.SUPERVISOR),
  validate(recordIdValidation),
  updateRecord
);

// Delete record (admin only)
router.delete(
  '/:id',
  authorize(UserRole.ADMIN),
  validate(recordIdValidation),
  deleteRecord
);

module.exports = router;
