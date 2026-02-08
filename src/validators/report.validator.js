const { query, param } = require('express-validator');

const dateRangeValidation = [
  query('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Start date must be in YYYY-MM-DD format'),
  
  query('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('End date must be in YYYY-MM-DD format'),
  
  query('type')
    .optional()
    .isString()
    .withMessage('Type must be a string')
];

const vehicleReportValidation = [
  param('vehicleNumber')
    .notEmpty()
    .withMessage('Araç numarası gereklidir')
    .isNumeric()
    .withMessage('Araç numarası sayısal olmalıdır'),
  
  query('startDate')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Başlangıç tarihi YYYY-MM-DD formatında olmalıdır'),
  
  query('endDate')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Bitiş tarihi YYYY-MM-DD formatında olmalıdır')
];

const lineReportValidation = [
  param('routeName')
    .notEmpty()
    .withMessage('Hat adı gereklidir')
    .isString()
    .withMessage('Hat adı metin olmalıdır')
];

module.exports = {
  dateRangeValidation,
  vehicleReportValidation,
  lineReportValidation
};
