const { body, param, query } = require('express-validator');

const saveDraftValidation = [
  body('date')
    .notEmpty()
    .withMessage('Tarih gereklidir')
    .isString()
    .withMessage('Tarih metin olmalıdır')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Tarih YYYY-MM-DD formatında olmalıdır'),
  
  body('products')
    .notEmpty()
    .withMessage('Ürün bilgileri gereklidir')
    .isObject()
    .withMessage('Ürün bilgileri obje olmalıdır'),
  
  body('products.dolum')
    .optional()
    .isNumeric()
    .withMessage('Dolum adedi sayısal olmalıdır'),
  
  body('products.tamKart')
    .optional()
    .isNumeric()
    .withMessage('Tam Kart adedi sayısal olmalıdır'),
  
  body('products.indirimliKart')
    .optional()
    .isNumeric()
    .withMessage('İndirimli Kart adedi sayısal olmalıdır'),
  
  body('products.serbestKart')
    .optional()
    .isNumeric()
    .withMessage('Serbest Kart adedi sayısal olmalıdır'),
  
  body('products.serbestVize')
    .optional()
    .isNumeric()
    .withMessage('Serbest Vize adedi sayısal olmalıdır'),
  
  body('products.indirimliVize')
    .optional()
    .isNumeric()
    .withMessage('İndirimli Vize adedi sayısal olmalıdır'),
  
  body('products.kartKilifi')
    .optional()
    .isNumeric()
    .withMessage('Kart Kılıfı adedi sayısal olmalıdır'),
  
  body('categoryCreditCards')
    .notEmpty()
    .withMessage('Kredi kartı bilgileri gereklidir')
    .isObject()
    .withMessage('Kredi kartı bilgileri obje olmalıdır'),
  
  body('categoryCreditCards.dolum')
    .optional()
    .isNumeric()
    .withMessage('Dolum kredi kartı tutarı sayısal olmalıdır'),
  
  body('categoryCreditCards.kart')
    .optional()
    .isNumeric()
    .withMessage('Kart kredi kartı tutarı sayısal olmalıdır'),
  
  body('categoryCreditCards.vize')
    .optional()
    .isNumeric()
    .withMessage('Vize kredi kartı tutarı sayısal olmalıdır'),
  
  body('categoryCreditCards.kartKilifi')
    .optional()
    .isNumeric()
    .withMessage('Kart Kılıfı kredi kartı tutarı sayısal olmalıdır'),
  
  body('payments')
    .notEmpty()
    .withMessage('Ödeme bilgileri gereklidir')
    .isObject()
    .withMessage('Ödeme bilgileri obje olmalıdır'),
  
  body('payments.gunbasiNakit')
    .optional()
    .isNumeric()
    .withMessage('Günbaşı nakit tutarı sayısal olmalıdır'),
  
  body('payments.bankayaGonderilen')
    .optional()
    .isNumeric()
    .withMessage('Bankaya gönderilen tutar sayısal olmalıdır'),
  
  body('payments.ertesiGuneBirakilan')
    .optional()
    .isNumeric()
    .withMessage('Ertesi güne bırakılan tutar sayısal olmalıdır'),
  
  // Banknote validations (optional - new categorized format)
  body('banknotes')
    .optional()
    .isObject()
    .withMessage('Banknot bilgileri obje olmalıdır'),

  // Dolum category banknotes
  body('banknotes.dolum')
    .optional()
    .isObject()
    .withMessage('Dolum banknot bilgileri obje olmalıdır'),

  body('banknotes.dolum.b200')
    .optional()
    .isNumeric()
    .withMessage('Dolum 200 TL banknot adedi sayısal olmalıdır'),

  body('banknotes.dolum.b100')
    .optional()
    .isNumeric()
    .withMessage('Dolum 100 TL banknot adedi sayısal olmalıdır'),

  body('banknotes.dolum.b50')
    .optional()
    .isNumeric()
    .withMessage('Dolum 50 TL banknot adedi sayısal olmalıdır'),

  body('banknotes.dolum.b20')
    .optional()
    .isNumeric()
    .withMessage('Dolum 20 TL banknot adedi sayısal olmalıdır'),

  body('banknotes.dolum.b10')
    .optional()
    .isNumeric()
    .withMessage('Dolum 10 TL banknot adedi sayısal olmalıdır'),

  body('banknotes.dolum.b5')
    .optional()
    .isNumeric()
    .withMessage('Dolum 5 TL banknot adedi sayısal olmalıdır'),

  body('banknotes.dolum.c1')
    .optional()
    .isNumeric()
    .withMessage('Dolum 1 TL madeni para adedi sayısal olmalıdır'),

  body('banknotes.dolum.c050')
    .optional()
    .isNumeric()
    .withMessage('Dolum 50 Kuruş madeni para adedi sayısal olmalıdır'),

  // Kart category banknotes
  body('banknotes.kart')
    .optional()
    .isObject()
    .withMessage('Kart banknot bilgileri obje olmalıdır'),

  body('banknotes.kart.b200')
    .optional()
    .isNumeric()
    .withMessage('Kart 200 TL banknot adedi sayısal olmalıdır'),

  body('banknotes.kart.b100')
    .optional()
    .isNumeric()
    .withMessage('Kart 100 TL banknot adedi sayısal olmalıdır'),

  body('banknotes.kart.b50')
    .optional()
    .isNumeric()
    .withMessage('Kart 50 TL banknot adedi sayısal olmalıdır'),

  body('banknotes.kart.b20')
    .optional()
    .isNumeric()
    .withMessage('Kart 20 TL banknot adedi sayısal olmalıdır'),

  body('banknotes.kart.b10')
    .optional()
    .isNumeric()
    .withMessage('Kart 10 TL banknot adedi sayısal olmalıdır'),

  body('banknotes.kart.b5')
    .optional()
    .isNumeric()
    .withMessage('Kart 5 TL banknot adedi sayısal olmalıdır'),

  body('banknotes.kart.c1')
    .optional()
    .isNumeric()
    .withMessage('Kart 1 TL madeni para adedi sayısal olmalıdır'),

  body('banknotes.kart.c050')
    .optional()
    .isNumeric()
    .withMessage('Kart 50 Kuruş madeni para adedi sayısal olmalıdır'),

  // Vize category banknotes
  body('banknotes.vize')
    .optional()
    .isObject()
    .withMessage('Vize banknot bilgileri obje olmalıdır'),

  body('banknotes.vize.b200')
    .optional()
    .isNumeric()
    .withMessage('Vize 200 TL banknot adedi sayısal olmalıdır'),

  body('banknotes.vize.b100')
    .optional()
    .isNumeric()
    .withMessage('Vize 100 TL banknot adedi sayısal olmalıdır'),

  body('banknotes.vize.b50')
    .optional()
    .isNumeric()
    .withMessage('Vize 50 TL banknot adedi sayısal olmalıdır'),

  body('banknotes.vize.b20')
    .optional()
    .isNumeric()
    .withMessage('Vize 20 TL banknot adedi sayısal olmalıdır'),

  body('banknotes.vize.b10')
    .optional()
    .isNumeric()
    .withMessage('Vize 10 TL banknot adedi sayısal olmalıdır'),

  body('banknotes.vize.b5')
    .optional()
    .isNumeric()
    .withMessage('Vize 5 TL banknot adedi sayısal olmalıdır'),

  body('banknotes.vize.c1')
    .optional()
    .isNumeric()
    .withMessage('Vize 1 TL madeni para adedi sayısal olmalıdır'),

  body('banknotes.vize.c050')
    .optional()
    .isNumeric()
    .withMessage('Vize 50 Kuruş madeni para adedi sayısal olmalıdır'),

  // Bank sent cash validations (optional)
  body('bankSentCash')
    .optional()
    .isObject()
    .withMessage('Bankaya gönderilen nakit bilgileri obje olmalıdır'),

  body('bankSentCash.dolum')
    .optional()
    .isNumeric()
    .withMessage('Bankaya gönderilen dolum tutarı sayısal olmalıdır'),

  body('bankSentCash.kart')
    .optional()
    .isNumeric()
    .withMessage('Bankaya gönderilen kart tutarı sayısal olmalıdır'),

  body('bankSentCash.vize')
    .optional()
    .isNumeric()
    .withMessage('Bankaya gönderilen vize tutarı sayısal olmalıdır'),

  body('bankSentCash.totalSent')
    .optional()
    .isNumeric()
    .withMessage('Toplam gönderilen tutar sayısal olmalıdır')
];

const submitValidation = saveDraftValidation; // Same validation

const reviewValidation = [
  param('id')
    .notEmpty()
    .withMessage('Kayıt ID gereklidir'),
  
  body('action')
    .notEmpty()
    .withMessage('Aksiyon gereklidir')
    .isIn(['approve', 'reject', 'revise'])
    .withMessage('Aksiyon "approve", "reject" veya "revise" olmalıdır'),
  
  body('notes')
    .optional()
    .isString()
    .withMessage('Notlar metin olmalıdır')
];

const recordIdValidation = [
  param('id')
    .notEmpty()
    .withMessage('Kayıt ID gereklidir')
];

const dateValidation = [
  param('date')
    .notEmpty()
    .withMessage('Tarih gereklidir')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Tarih YYYY-MM-DD formatında olmalıdır')
];

const queryValidation = [
  query('startDate')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Başlangıç tarihi YYYY-MM-DD formatında olmalıdır'),
  
  query('endDate')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Bitiş tarihi YYYY-MM-DD formatında olmalıdır'),
  
  query('status')
    .optional()
    .isIn(['draft', 'submitted', 'pending_revision', 'revised', 'approved', 'rejected', 'all'])
    .withMessage('Geçersiz durum değeri')
];

module.exports = {
  saveDraftValidation,
  submitValidation,
  reviewValidation,
  recordIdValidation,
  dateValidation,
  queryValidation
};
