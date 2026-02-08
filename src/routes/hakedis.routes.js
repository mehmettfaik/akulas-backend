const express = require('express');
const {
  createHakedis,
  getAllHakedis,
  getHakedisById,
  updateHakedis,
  deleteHakedis,
  getWeeklyHakedisSummary
} = require('../controllers/hakedis.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { body, param, query } = require('express-validator');
const { UserRole } = require('../constants/enums');

const router = express.Router();

// All routes require JWT authentication
router.use(authenticate);

// Validation rules
const createHakedisValidation = [
  body('date')
    .notEmpty()
    .withMessage('Tarih gereklidir')
    .isString()
    .withMessage('Tarih metin olmalıdır'),
  body('type')
    .notEmpty()
    .withMessage('Hakediş türü gereklidir')
    .isIn(['HAFTALIK', 'KREDI_KARTI'])
    .withMessage('Geçersiz hakediş türü'),
  body('routes')
    .notEmpty()
    .withMessage('Hat bilgileri gereklidir')
    .isObject()
    .withMessage('Hat bilgileri obje olmalıdır'),
  body('vehicles')
    .optional()
    .isObject()
    .withMessage('Araç bilgileri obje olmalıdır'),
  body('raporal')
    .notEmpty()
    .withMessage('Raporal tutarı gereklidir')
    .isNumeric()
    .withMessage('Raporal tutarı sayısal olmalıdır'),
  body('sistem')
    .notEmpty()
    .withMessage('Sistem tutarı gereklidir')
    .isNumeric()
    .withMessage('Sistem tutarı sayısal olmalıdır')
];

const updateHakedisValidation = [
  param('id')
    .notEmpty()
    .withMessage('Hakediş ID gereklidir'),
  body('date')
    .optional()
    .isString()
    .withMessage('Tarih metin olmalıdır'),
  body('type')
    .optional()
    .isIn(['HAFTALIK', 'KREDI_KARTI'])
    .withMessage('Geçersiz hakediş türü'),
  body('routes')
    .optional()
    .isObject()
    .withMessage('Hat bilgileri obje olmalıdır'),
  body('vehicles')
    .optional()
    .isObject()
    .withMessage('Araç bilgileri obje olmalıdır'),
  body('raporal')
    .optional()
    .isNumeric()
    .withMessage('Raporal tutarı sayısal olmalıdır'),
  body('sistem')
    .optional()
    .isNumeric()
    .withMessage('Sistem tutarı sayısal olmalıdır')
];

const hakedisIdValidation = [
  param('id')
    .notEmpty()
    .withMessage('Hakediş ID gereklidir')
];

const weeklyHakedisValidation = [
  query('startDate')
    .notEmpty()
    .withMessage('Başlangıç tarihi gereklidir')
    .isString()
    .withMessage('Başlangıç tarihi metin olmalıdır'),
  query('endDate')
    .notEmpty()
    .withMessage('Bitiş tarihi gereklidir')
    .isString()
    .withMessage('Bitiş tarihi metin olmalıdır')
];

// Get weekly hakedis summary for bank (all authenticated users)
router.get('/weekly/summary', validate(weeklyHakedisValidation), getWeeklyHakedisSummary);

// Get all hakediş (all authenticated users)
router.get('/', getAllHakedis);

// Get hakediş by ID (all authenticated users)
router.get('/:id', validate(hakedisIdValidation), getHakedisById);

// Create hakediş (admin, supervisor, responsible)
router.post(
  '/',
  authorize(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.RESPONSIBLE),
  validate(createHakedisValidation),
  createHakedis
);

// Update hakediş (admin, supervisor)
router.put(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.SUPERVISOR),
  validate(updateHakedisValidation),
  updateHakedis
);

// Delete hakediş (admin only)
router.delete(
  '/:id',
  authorize(UserRole.ADMIN),
  validate(hakedisIdValidation),
  deleteHakedis
);

module.exports = router;
