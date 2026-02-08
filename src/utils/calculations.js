/**
 * Desk calculations utility functions
 */

// Birim fiyatlar - Ürün başına fiyat
const UNIT_PRICES = {
  dolum: 1,
  tamKart: 50,
  indirimliKart: 100,
  serbestKart: 100,
  serbestVize: 75,
  indirimliVize: 25,
  kartKilifi: 10
};

/**
 * Calculate totals for desk record
 * @param {Object} products - Ürün adetleri
 * @param {Object} categoryCreditCards - Kategori bazlı kredi kartı ödemeleri
 * @param {Object} payments - Günbaşı, banka, ertesi gün ödemeleri
 * @returns {Object} Hesaplanan toplamlar
 */
const calculateTotals = (products, categoryCreditCards, payments) => {
  // Toplam Satış = Tüm ürünlerin tutar toplamı
  const totalSales = 
    (products.dolum || 0) * UNIT_PRICES.dolum +
    (products.tamKart || 0) * UNIT_PRICES.tamKart +
    (products.indirimliKart || 0) * UNIT_PRICES.indirimliKart +
    (products.serbestKart || 0) * UNIT_PRICES.serbestKart +
    (products.serbestVize || 0) * UNIT_PRICES.serbestVize +
    (products.indirimliVize || 0) * UNIT_PRICES.indirimliVize +
    (products.kartKilifi || 0) * UNIT_PRICES.kartKilifi;
  
  // Toplam Kredi Kartı = Tüm kategorilerdeki kredi kartı toplamı
  const totalCreditCard = 
    (categoryCreditCards.dolum || 0) +
    (categoryCreditCards.kart || 0) +
    (categoryCreditCards.vize || 0) +
    (categoryCreditCards.kartKilifi || 0);
  
  // Toplam Nakit = Toplam Satış - Kredi Kartı
  const totalCash = totalSales - totalCreditCard;
  
  // Kasada Kalan = Günbaşı Nakit + Toplam Satış - (Kredi Kartı + Bankaya + Ertesi Güne)
  const cashInRegister = 
    (payments.gunbasiNakit || 0) + 
    totalSales - 
    (totalCreditCard + (payments.bankayaGonderilen || 0) + (payments.ertesiGuneBirakilan || 0));
  
  // Fark = Toplam Satış - (Günbaşı + Kredi Kartı + Bankaya + Ertesi Güne)
  const difference = 
    totalSales - 
    ((payments.gunbasiNakit || 0) + totalCreditCard + (payments.bankayaGonderilen || 0) + (payments.ertesiGuneBirakilan || 0));
  
  return {
    totalSales: Number(totalSales.toFixed(2)),
    totalCreditCard: Number(totalCreditCard.toFixed(2)),
    totalCash: Number(totalCash.toFixed(2)),
    cashInRegister: Number(cashInRegister.toFixed(2)),
    difference: Number(difference.toFixed(2))
  };
};

/**
 * Calculate total amount from banknotes
 * Supports both old format (single object) and new format (categorized: dolum, kart, vize)
 * @param {Object} banknotes - Banknote counts
 * @returns {Number} Total amount in TL
 */
const calculateBanknoteTotal = (banknotes) => {
  if (!banknotes) return 0;

  // Check if this is the new categorized format
  if (banknotes.dolum || banknotes.kart || banknotes.vize) {
    let total = 0;

    // Calculate dolum category
    if (banknotes.dolum) {
      total += (
        (banknotes.dolum.b200 || 0) * 200 +
        (banknotes.dolum.b100 || 0) * 100 +
        (banknotes.dolum.b50 || 0) * 50 +
        (banknotes.dolum.b20 || 0) * 20 +
        (banknotes.dolum.b10 || 0) * 10 +
        (banknotes.dolum.b5 || 0) * 5 +
        (banknotes.dolum.c1 || 0) * 1 +
        (banknotes.dolum.c050 || 0) * 0.50
      );
    }

    // Calculate kart category
    if (banknotes.kart) {
      total += (
        (banknotes.kart.b200 || 0) * 200 +
        (banknotes.kart.b100 || 0) * 100 +
        (banknotes.kart.b50 || 0) * 50 +
        (banknotes.kart.b20 || 0) * 20 +
        (banknotes.kart.b10 || 0) * 10 +
        (banknotes.kart.b5 || 0) * 5 +
        (banknotes.kart.c1 || 0) * 1 +
        (banknotes.kart.c050 || 0) * 0.50
      );
    }

    // Calculate vize category (only for desk records)
    if (banknotes.vize) {
      total += (
        (banknotes.vize.b200 || 0) * 200 +
        (banknotes.vize.b100 || 0) * 100 +
        (banknotes.vize.b50 || 0) * 50 +
        (banknotes.vize.b20 || 0) * 20 +
        (banknotes.vize.b10 || 0) * 10 +
        (banknotes.vize.b5 || 0) * 5 +
        (banknotes.vize.c1 || 0) * 1 +
        (banknotes.vize.c050 || 0) * 0.50
      );
    }

    return total;
  }

  // Old format - single object
  return (
    (banknotes.b200 || 0) * 200 +
    (banknotes.b100 || 0) * 100 +
    (banknotes.b50 || 0) * 50 +
    (banknotes.b20 || 0) * 20 +
    (banknotes.b10 || 0) * 10 +
    (banknotes.b5 || 0) * 5 +
    (banknotes.c1 || 0) * 1 +
    (banknotes.c050 || 0) * 0.50
  );
};

/**
 * Validate if all required fields are present
 * @param {Object} data - Desk record data
 * @returns {Object} { valid: boolean, errors: string[] }
 */
const validateDeskData = (data) => {
  const errors = [];
  
  if (!data.date) {
    errors.push('Tarih gereklidir');
  }
  
  if (!data.products) {
    errors.push('Ürün bilgileri gereklidir');
  }
  
  if (!data.categoryCreditCards) {
    errors.push('Kredi kartı bilgileri gereklidir');
  }
  
  if (!data.payments) {
    errors.push('Ödeme bilgileri gereklidir');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

module.exports = {
  UNIT_PRICES,
  calculateTotals,
  calculateBanknoteTotal,
  validateDeskData
};
