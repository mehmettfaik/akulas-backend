const { db } = require('../config/firebase');
const bcrypt = require('bcrypt');
const { successResponse } = require('../utils/response');
const { NotFoundError, BadRequestError, ConflictError } = require('../utils/errors');

const USERS_COLLECTION = 'users';

/**
 * Get all users (Admin only)
 */
const getAllUsers = async (req, res, next) => {
  try {
    const snapshot = await db.collection(USERS_COLLECTION)
      .orderBy('createdAt', 'desc')
      .get();

    const users = [];
    snapshot.forEach(doc => {
      const userData = doc.data();
      // Şifreyi response'dan çıkar
      delete userData.password;
      users.push({
        uid: doc.id,
        ...userData
      });
    });

    successResponse(res, users, 'Kullanıcılar başarıyla getirildi');
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID
 */
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const doc = await db.collection(USERS_COLLECTION).doc(id).get();

    if (!doc.exists) {
      throw new NotFoundError('Kullanıcı bulunamadı');
    }

    const userData = doc.data();
    // Şifreyi response'dan çıkar
    delete userData.password;

    successResponse(res, {
      uid: doc.id,
      ...userData
    }, 'Kullanıcı başarıyla getirildi');
  } catch (error) {
    next(error);
  }
};

/**
 * Create new user (Admin only)
 */
const createUser = async (req, res, next) => {
  try {
    const { email, password, displayName, role = 'desk' } = req.body;

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

    // Role validation
    const validRoles = ['admin', 'supervisor', 'responsible', 'desk'];
    if (!validRoles.includes(role)) {
      throw new BadRequestError('Geçersiz rol. Geçerli roller: admin, supervisor, responsible, desk');
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, 10);

    // Kullanıcıyı oluştur
    const userRef = await db.collection(USERS_COLLECTION).add({
      email,
      password: hashedPassword,
      displayName: displayName || email.split('@')[0],
      role,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    successResponse(res, {
      uid: userRef.id,
      email,
      displayName: displayName || email.split('@')[0],
      role
    }, 'Kullanıcı başarıyla oluşturuldu', 201);

  } catch (error) {
    next(error);
  }
};

/**
 * Update user (Admin only)
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, password, displayName, role } = req.body;

    const docRef = db.collection(USERS_COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundError('Kullanıcı bulunamadı');
    }

    const updateData = {
      updatedAt: new Date()
    };

    // Email güncelleme ve çakışma kontrolü
    if (email && email !== doc.data().email) {
      const existingUser = await db.collection(USERS_COLLECTION)
        .where('email', '==', email)
        .get();

      if (!existingUser.empty) {
        throw new ConflictError('Bu e-posta adresi zaten kullanılıyor');
      }
      updateData.email = email;
    }

    if (displayName) {
      updateData.displayName = displayName;
    }

    if (role) {
      const validRoles = ['admin', 'supervisor', 'responsible', 'desk'];
      if (!validRoles.includes(role)) {
        throw new BadRequestError('Geçersiz rol. Geçerli roller: admin, supervisor, responsible, desk');
      }
      updateData.role = role;
    }

    // Şifre güncelleme
    if (password) {
      if (password.length < 6) {
        throw new BadRequestError('Şifre en az 6 karakter olmalıdır');
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    await docRef.update(updateData);

    const updatedDoc = await docRef.get();
    const userData = updatedDoc.data();
    // Şifreyi response'dan çıkar
    delete userData.password;

    successResponse(res, {
      uid: updatedDoc.id,
      ...userData
    }, 'Kullanıcı başarıyla güncellendi');

  } catch (error) {
    next(error);
  }
};

/**
 * Delete user (Admin only)
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Kendini silmeyi engelle
    if (req.user && req.user.uid === id) {
      throw new BadRequestError('Kendi hesabınızı silemezsiniz');
    }

    const docRef = db.collection(USERS_COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundError('Kullanıcı bulunamadı');
    }

    await docRef.delete();

    successResponse(res, { uid: id }, 'Kullanıcı başarıyla silindi');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
