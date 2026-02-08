#!/usr/bin/env node

/**
 * Firestore Database'de admin kullanıcısı oluşturma scripti
 * Kullanım: node scripts/create-admin.js
 */

require('dotenv').config();
const { db } = require('../src/config/firebase');
const bcrypt = require('bcrypt');

async function createAdminUser() {
  try {
    console.log('🔄 Admin kullanıcısı oluşturuluyor...\n');

    const email = 'admin@akulas.com';
    const password = 'admin123456';
    const displayName = 'Admin User';
    const role = 'admin';

    // Kullanıcının zaten var olup olmadığını kontrol et
    const existingUser = await db.collection('users')
      .where('email', '==', email)
      .get();

    if (!existingUser.empty) {
      console.log('⚠️  Kullanıcı zaten mevcut!');
      const userDoc = existingUser.docs[0];
      console.log('\n✅ Mevcut kullanıcı bilgileri:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 Email:', email);
      console.log('🔑 Password:', password);
      console.log('👤 Display Name:', userDoc.data().displayName);
      console.log('🎭 Role:', userDoc.data().role);
      console.log('🆔 UID:', userDoc.id);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      process.exit(0);
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, 10);

    // Yeni kullanıcı oluştur
    const userRef = await db.collection('users').add({
      email,
      password: hashedPassword,
      displayName,
      role,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('\n✅ Admin kullanıcısı başarıyla oluşturuldu!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 Display Name:', displayName);
    console.log('🎭 Role:', role);
    console.log('🆔 UID:', userRef.id);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('\n✨ Bu bilgilerle giriş yapabilirsiniz!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Hata:', error.message);
    if (error.code) {
      console.error('Hata Kodu:', error.code);
    }
    console.error(error.stack);
    process.exit(1);
  }
}

// Script'i çalıştır
createAdminUser();
