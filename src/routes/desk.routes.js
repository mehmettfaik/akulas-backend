const express = require('express');
const {
  saveDraft,
  submitToResponsible,
  getSubmittedRecords,
  getRecordById,
  reviewRecord,
  deleteRecord,
  getDraftByDate,
  updateRecord
} = require('../controllers/desk.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const {
  saveDraftValidation,
  submitValidation,
  reviewValidation,
  recordIdValidation,
  dateValidation,
  queryValidation
} = require('../validators/desk.validator');
const { UserRole } = require('../constants/enums');

const router = express.Router();

// All routes require JWT authentication
router.use(authenticate);

// Save as draft (desk users only)
router.post(
  '/save',
  authorize(UserRole.DESK),
  validate(saveDraftValidation),
  saveDraft
);

// Submit to responsible (desk users only)
router.post(
  '/submit',
  authorize(UserRole.DESK),
  validate(submitValidation),
  submitToResponsible
);

// Get submitted records (all authenticated users with role-based filtering)
router.get(
  '/submitted',
  validate(queryValidation),
  getSubmittedRecords
);

// Get draft by date (desk users only)
router.get(
  '/draft/:date',
  authorize(UserRole.DESK),
  validate(dateValidation),
  getDraftByDate
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
  validate(submitValidation),
  updateRecord
);

// Alternative route for convenience (without /submitted prefix)
router.put(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.DESK),
  validate(submitValidation),
  updateRecord
);

// Delete record (desk users can delete their own drafts/rejected records)
router.delete(
  '/submitted/:id',
  validate(recordIdValidation),
  deleteRecord
);

module.exports = router;
