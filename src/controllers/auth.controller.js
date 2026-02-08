const { db } = require('../config/firebase');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { successResponse } = require('../utils/response');
const { UnauthorizedError, BadRequestError, ConflictError } = require('../utils/errors');

const USERS_COLLECTION = 'users';

/**
 * Register - Yeni kullanıcı kaydı (Firestore + JWT)
 */
const register = async (req, res, next) => {
  try {
    const { email, password, role = 'desk', displayName } = req.body;

    if (!email || !password) {
      throw new BadRequestError('E-posta ve şifre gereklidir');
    }

    if (password.length < 6) {
      throw new BadRequestError('Şifre en az 6 karakter olmalıdır');
    }

    // Email kontrolü
    const existingUser = await db.collection(USERS_COLLECTION)
      .where('email', '==', email)
      .get();

    if (!existingUser.empty) {
      throw new ConflictError('Bu e-posta adresi zaten kullanılıyor');
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, 10);

    // Kullanıcıyı Firestore'a kaydet
    const userRef = await db.collection(USERS_COLLECTION).add({
      email,
      password: hashedPassword,
      displayName: displayName || email.split('@')[0],
      role,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    successResponse(res, {
      user: {
        uid: userRef.id,
        email,
        displayName: displayName || email.split('@')[0],
        role
      }
    }, 'Kullanıcı başarıyla oluşturuldu', 201);

  } catch (error) {
    next(error);
  }
};

/**
 * Login - Email/Password ile giriş (JWT token döner)
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new BadRequestError('E-posta ve şifre gereklidir');
    }

    // Kullanıcıyı Firestore'dan bul
    const usersRef = db.collection(USERS_COLLECTION);
    const snapshot = await usersRef.where('email', '==', email).get();

    if (snapshot.empty) {
      throw new UnauthorizedError('Geçersiz e-posta veya şifre');
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    // Şifre kontrolü
    const isPasswordValid = await bcrypt.compare(password, userData.password);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Geçersiz e-posta veya şifre');
    }

    // JWT secret kontrolü
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET tanımlı değil');
    }

    // JWT token oluştur
    const token = jwt.sign(
      {
        uid: userDoc.id,
        email: userData.email,
        role: userData.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Response
    successResponse(res, {
      token,
      user: {
        uid: userDoc.id,
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role
      }
    }, 'Giriş başarılı');

  } catch (error) {
    next(error);
  }
};

/**
 * Verify Token - Token doğrulama
 */
const verifyToken = async (req, res, next) => {
  try {
    const user = req.user; // JWT middleware'den gelir

    if (!user) {
      throw new UnauthorizedError('Token geçersiz');
    }

    successResponse(res, {
      uid: user.uid,
      email: user.email,
      role: user.role
    }, 'Token geçerli');

  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  verifyToken
};
