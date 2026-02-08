const { body, query, param } = require('express-validator');
const { RecordType } = require('../constants/enums');

const createRecordValidation = [
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isString()
    .withMessage('Date must be a string')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Date must be in YYYY-MM-DD format'),
  
  body('type')
    .notEmpty()
    .withMessage('Type is required')
    .isIn([RecordType.WEEKLY, RecordType.CREDIT_CARD])
    .withMessage(`Type must be either ${RecordType.WEEKLY} or ${RecordType.CREDIT_CARD}`),
  
  body('routes')
    .notEmpty()
    .withMessage('Hat değerleri gereklidir')
    .isObject()
    .withMessage('Hat değerleri obje olmalıdır'),
  
  body('vehicles')
    .optional()
    .isObject()
    .withMessage('Araç değerleri obje olmalıdır'),
  
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

const getRecordsByDateValidation = [
  query('startDate')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Start date must be in YYYY-MM-DD format'),
  
  query('endDate')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('End date must be in YYYY-MM-DD format'),
  
  query('type')
    .optional()
    .isIn([RecordType.WEEKLY, RecordType.CREDIT_CARD])
    .withMessage(`Type must be either ${RecordType.WEEKLY} or ${RecordType.CREDIT_CARD}`)
];

const recordIdValidation = [
  param('id')
    .notEmpty()
    .withMessage('Record ID is required')
];

module.exports = {
  createRecordValidation,
  getRecordsByDateValidation,
  recordIdValidation
};
