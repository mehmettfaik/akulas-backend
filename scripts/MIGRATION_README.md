# Banknotes Migration Guide

Bu rehber, banknotes yapısının eski formattan yeni kategorili formata geçiş yapılmasını açıklar.

## Değişiklikler

### Eski Format (Old)
```javascript
{
  banknotes: {
    b200: 10,
    b100: 20,
    b50: 30,
    // ...
  }
}
```

### Yeni Format (New)
```javascript
// Desk Records
{
  banknotes: {
    dolum: { b200: 10, b100: 20, b50: 30, ... },
    kart: { b200: 5, b100: 15, b50: 25, ... },
    vize: { b200: 3, b100: 8, b50: 12, ... }
  },
  bankSentCash: {
    dolum: 0,
    kart: 0,
    vize: 0,
    totalSent: 0
  }
}

// Bayi Dolum Records (vize yok)
{
  banknotes: {
    dolum: { b200: 10, b100: 20, b50: 30, ... },
    kart: { b200: 5, b100: 15, b50: 25, ... }
  },
  bankSentCash: {
    dolum: 0,
    kart: 0,
    totalSent: 0
  }
}
```

## Migration Öncesi

**ÖNEMLİ:** Migration işleminden önce mutlaka veritabanı yedeği alın!

### Firebase/Firestore Yedekleme

```bash
# Firebase Console üzerinden:
# 1. Firebase Console'a gidin
# 2. Firestore Database bölümüne gidin
# 3. "Import/Export" sekmesine tıklayın
# 4. "Export" butonuna tıklayın
# 5. Export bucket'ı seçin ve başlatın
```

## Migration Çalıştırma

### 1. Ortam Değişkenlerini Kontrol Edin

`.env` dosyanızın doğru yapılandırıldığından emin olun:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY=your-private-key
```

### 2. Migration Script'ini Çalıştırın

```bash
# Backend dizininde
cd /path/to/backend

# Migration'ı çalıştır
node scripts/migrate-banknotes.js
```

### 3. Çıktıyı Kontrol Edin

Script şu bilgileri gösterecektir:
- Migrasyon edilen kayıt sayısı
- Atlanan kayıt sayısı (zaten yeni formatta olanlar)
- Hata mesajları (varsa)

Örnek çıktı:
```
=====================================================
  Banknotes Structure Migration
=====================================================

Starting Desk Records migration...
Record abc123: Migrating banknotes from old format
Record abc123: Adding bankSentCash field
✓ Record abc123 migrated successfully
...
Desk Records migration completed: 15 migrated, 5 skipped

Starting Bayi Dolum Records migration...
...
Bayi Dolum Records migration completed: 8 migrated, 2 skipped

=====================================================
  Migration Summary
=====================================================
Desk Records: 15 migrated, 5 skipped
Bayi Dolum Records: 8 migrated, 2 skipped
Total: 23 migrated, 7 skipped
=====================================================

Migration completed successfully!
```

## Migration Sonrası Kontroller

### 1. Veritabanı Kontrolü

Firebase Console'dan birkaç kayıt kontrol edin:

```javascript
// Yeni format olmalı
{
  banknotes: {
    dolum: { ... },
    kart: { ... },
    vize: { ... } // Sadece Desk Records için
  },
  bankSentCash: {
    dolum: 0,
    kart: 0,
    vize: 0, // Sadece Desk Records için
    totalSent: 0
  }
}
```

### 2. API Test

API endpoint'lerini test edin:

```bash
# Desk kayıtlarını getir
curl -X GET "http://localhost:3000/api/desk/submitted?status=approved" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Bayi Dolum kayıtlarını getir
curl -X GET "http://localhost:3000/api/bayi-dolum/submitted?status=approved" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Frontend Test

Frontend'in yeni API yanıtlarını doğru şekilde işlediğinden emin olun.

## Sorun Giderme

### Migration Hatası Durumunda

1. **Yedekten Geri Yükleme:**
   - Firebase Console > Firestore Database > Import/Export
   - "Import" butonuna tıklayın
   - Yedek dosyanızı seçin ve geri yükleyin

2. **Log İnceleme:**
   - Migration script detaylı log üretir
   - Hangi kayıtlarda sorun olduğunu gösterir
   - Hata mesajlarını okuyun ve düzeltin

3. **Manuel Düzeltme:**
   - Sorunlu kayıtları Firebase Console'dan manuel olarak düzeltin
   - Format: yukarıdaki "Yeni Format" bölümüne bakın

## Not

- Migration script **idempotent**'tir - birden fazla kez çalıştırılabilir
- Zaten yeni formattaki kayıtlar atlanır
- Migration sırasında `updatedAt` alanı güncellenir
- Eski banknotes değerleri otomatik olarak `dolum` kategorisine atanır

## Destek

Sorun yaşarsanız:
1. Migration log'larını kontrol edin
2. Firebase Console'dan veritabanını inceleyin
3. Backend log'larını kontrol edin
4. Gerekirse yedekten geri yükleyin
