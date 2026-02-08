const express = require('express');
const { register, login, verifyToken } = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { body } = require('express-validator');
const { validate } = require('../middlewares/validation.middleware');

const router = express.Router();

// Register validation
const registerValidation = [
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
  
  body('role')
    .optional()
    .isIn(['admin', 'supervisor', 'responsible', 'desk'])
    .withMessage('Geçersiz rol')
];

// Login validation (email + password için)
const loginValidation = [
  body('email')
    .notEmpty()
    .withMessage('E-posta gereklidir')
    .isEmail()
    .withMessage('Geçerli bir e-posta adresi girin'),
  
  body('password')
    .notEmpty()
    .withMessage('Şifre gereklidir')
    .isLength({ min: 6 })
    .withMessage('Şifre en az 6 karakter olmalıdır')
];

// POST /api/auth/register - Yeni kullanıcı kaydı
router.post('/register', validate(registerValidation), register);

// POST /api/auth/login - Email/Password ile giriş (JWT token döner)
router.post('/login', validate(loginValidation), login);

// GET /api/auth/verify - Token doğrulama
router.get('/verify', authenticate, verifyToken);

module.exports = router;
