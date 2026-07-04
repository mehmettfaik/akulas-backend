const express = require('express');
const {
  submitKioskDolum,
  getSubmittedRecords,
  getRecordById,
  reviewRecord,
  updateRecord,
  deleteRecord
} = require('../controllers/kiosk-dolum.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { UserRole } = require('../constants/enums');

// Note: Using minimal validation for speed since frontend handles most of it
const router = express.Router();

router.use(authenticate);

// Submit Kiosk Dolum
router.post(
  '/submit',
  authorize(UserRole.DESK),
  submitKioskDolum
);

// Get all submitted records
router.get(
  '/submitted',
  authorize(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.DESK, UserRole.RESPONSIBLE),
  getSubmittedRecords
);

// Get by ID
router.get(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.DESK, UserRole.RESPONSIBLE),
  getRecordById
);

// Review record (Admin/Responsible)
router.post(
  '/:id/review',
  authorize(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.RESPONSIBLE),
  reviewRecord
);

// Update record
router.put(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.DESK),
  updateRecord
);

// Delete record
router.delete(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.DESK),
  deleteRecord
);

module.exports = router;
