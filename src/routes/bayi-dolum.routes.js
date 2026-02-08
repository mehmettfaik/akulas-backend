const express = require('express');
const {
  submitBayiDolum,
  getSubmittedRecords,
  getRecordById,
  reviewRecord,
  updateRecord,
  deleteRecord
} = require('../controllers/bayi-dolum.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const {
  submitBayiDolumValidation,
  reviewValidation,
  recordIdValidation,
  queryValidation
} = require('../validators/bayi-dolum.validator');
const { UserRole } = require('../constants/enums');

const router = express.Router();

// All routes require JWT authentication
router.use(authenticate);

// Submit bayi dolum to responsible (desk users only)
router.post(
  '/submit',
  authorize(UserRole.DESK),
  validate(submitBayiDolumValidation),
  submitBayiDolum
);

// Get submitted records (all authenticated users with role-based filtering)
router.get(
  '/submitted',
  validate(queryValidation),
  getSubmittedRecords
);

// Get single record by ID (all authenticated users with role-based access)
router.get(
  '/submitted/:id',
  validate(recordIdValidation),
  getRecordById
);

// Review record - approve/reject/revise (responsible, supervisor, admin)
router.patch(
  '/submitted/:id/review',
  authorize(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.RESPONSIBLE),
  validate(reviewValidation),
  reviewRecord
);

// Update record (for revising pending_revision records)
router.put(
  '/submitted/:id',
  authorize(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.DESK),
  validate(submitBayiDolumValidation),
  updateRecord
);

// Alternative route for convenience (without /submitted prefix)
router.put(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.DESK),
  validate(submitBayiDolumValidation),
  updateRecord
);

// Delete record
router.delete(
  '/submitted/:id',
  validate(recordIdValidation),
  deleteRecord
);

module.exports = router;
