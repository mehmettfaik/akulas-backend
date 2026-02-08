const express = require('express');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { body, param } = require('express-validator');
const { validate } = require('../middlewares/validation.middleware');
const { UserRole } = require('../constants/enums');

const router = express.Router();

// Validation rules
const createUserValidation = [
  body('email')
    .notEmpty()
    .withMessage('E-posta gereklidir')
    .isEmail()
    .withMessage('Geçerli bir e-posta adresi girin'),
  
  body('password')
    .notEmpty()
    .withMessage('Şifre gereklidir')
    .isLength({ min: 6 })
    .withMessage('Şifre en az 6 karakter olmalıdır'),
  
  body('displayName')
    .optional()
    .trim()
    .isString()
    .withMessage('Görünen ad metin olmalıdır'),
  
  body('role')
    .notEmpty()
    .withMessage('Rol gereklidir')
    .isIn([UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.RESPONSIBLE, UserRole.DESK])
    .withMessage('Geçersiz rol')
];

const updateUserValidation = [
  param('id')
    .notEmpty()
    .withMessage('Kullanıcı ID gereklidir'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Geçerli bir e-posta adresi girin'),
  
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Şifre en az 6 karakter olmalıdır'),
  
  body('displayName')
    .optional()
    .trim()
    .isString()
    .withMessage('Görünen ad metin olmalıdır'),
  
  body('role')
    .optional()
    .isIn([UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.RESPONSIBLE, UserRole.DESK])
    .withMessage('Geçersiz rol')
];

const userIdValidation = [
  param('id')
    .notEmpty()
    .withMessage('Kullanıcı ID gereklidir')
];

// All routes require JWT authentication
router.use(authenticate);

// GET /api/users - Get all users (Admin only)
router.get('/', authorize(UserRole.ADMIN), getAllUsers);

// GET /api/users/:id - Get user by ID
router.get('/:id', authorize(UserRole.ADMIN), validate(userIdValidation), getUserById);

// POST /api/users - Create new user (Admin only)
router.post(
  '/',
  authorize(UserRole.ADMIN),
  validate(createUserValidation),
  createUser
);

// PUT /api/users/:id - Update user (Admin only)
router.put(
  '/:id',
  authorize(UserRole.ADMIN),
  validate(updateUserValidation),
  updateUser
);

// DELETE /api/users/:id - Delete user (Admin only)
router.delete(
  '/:id',
  authorize(UserRole.ADMIN),
  validate(userIdValidation),
  deleteUser
);

module.exports = router;
