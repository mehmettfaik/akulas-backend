const { body, param } = require('express-validator');

const createVehicleValidation = [
  body('plateNumber')
    .trim()
    .notEmpty()
    .withMessage('Plaka numarası gereklidir')
    .isString()
    .withMessage('Plaka numarası metin olmalıdır'),

  body('vehicleNumber')
    .notEmpty()
    .withMessage('Araç numarası gereklidir'),

  body('routeName')
    .trim()
    .notEmpty()
    .withMessage('Hat adı gereklidir')
    .isString()
    .withMessage('Hat adı metin olmalıdır'),

  body('driverName')
    .trim()
    .notEmpty()
    .withMessage('Sürücü adı gereklidir')
    .isString()
    .withMessage('Sürücü adı metin olmalıdır'),

  body('iban')
    .trim()
    .notEmpty()
    .withMessage('IBAN gereklidir')
    .isString()
    .withMessage('IBAN metin olmalıdır')
    .customSanitizer(value => value.replace(/\s+/g, ''))
    .matches(/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/)
    .withMessage('Geçersiz IBAN formatı'),

  body('taxId')
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('Vergi/TC kimlik numarası metin olmalıdır')
    .trim()
    .matches(/^[0-9]{10,11}$/)
    .withMessage('Vergi/TC kimlik numarası 10 veya 11 haneli olmalıdır'),

  body('contactInfo')
    .optional()
    .trim()
    .isString()
    .withMessage('İletişim bilgisi metin olmalıdır')
];

const updateVehicleValidation = [
  param('id')
    .notEmpty()
    .withMessage('Araç ID gereklidir'),

  body('plateNumber')
    .optional()
    .trim()
    .isString()
    .withMessage('Plaka numarası metin olmalıdır'),

  body('vehicleNumber')
    .optional(),

  body('routeName')
    .optional()
    .trim()
    .isString()
    .withMessage('Hat adı metin olmalıdır'),

  body('driverName')
    .optional()
    .trim()
    .isString()
    .withMessage('Sürücü adı metin olmalıdır'),

  body('iban')
    .optional()
    .trim()
    .isString()
    .withMessage('IBAN metin olmalıdır')
    .customSanitizer(value => value.replace(/\s+/g, ''))
    .matches(/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/)
    .withMessage('Geçersiz IBAN formatı'),

  body('taxId')
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('Vergi/TC kimlik numarası metin olmalıdır')
    .trim()
    .matches(/^[0-9]{10,11}$/)
    .withMessage('Vergi/TC kimlik numarası 10 veya 11 haneli olmalıdır'),

  body('contactInfo')
    .optional()
    .trim()
    .isString()
    .withMessage('Contact info must be a string')
];

const vehicleIdValidation = [
  param('id')
    .notEmpty()
    .withMessage('Vehicle ID is required')
];

module.exports = {
  createVehicleValidation,
  updateVehicleValidation,
  vehicleIdValidation
};
