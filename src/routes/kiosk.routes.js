const express = require('express');
const { getKiosks, createKiosk, deleteKiosk } = require('../controllers/kiosk.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { UserRole } = require('../constants/enums');

const router = express.Router();

router.use(authenticate);

router.get('/', getKiosks);

// Only admin can create/delete kiosks
router.post('/', authorize(UserRole.ADMIN, UserRole.SUPERVISOR), createKiosk);
router.delete('/:id', authorize(UserRole.ADMIN, UserRole.SUPERVISOR), deleteKiosk);

module.exports = router;
