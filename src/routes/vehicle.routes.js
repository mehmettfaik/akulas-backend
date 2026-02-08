const express = require('express');
const {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehiclesByLine
} = require('../controllers/vehicle.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const {
  createVehicleValidation,
  updateVehicleValidation,
  vehicleIdValidation
} = require('../validators/vehicle.validator');
const { UserRole } = require('../constants/enums');

const router = express.Router();

// All routes require JWT authentication
router.use(authenticate);

// Get all vehicles (all authenticated users)
router.get('/', getAllVehicles);

// Get vehicles by route name (all authenticated users)
router.get('/route/:routeName', getVehiclesByLine);

// Get vehicle by ID (all authenticated users)
router.get('/:id', validate(vehicleIdValidation), getVehicleById);

// Create vehicle (admin and supervisor only)
router.post(
  '/',
  authorize(UserRole.ADMIN, UserRole.SUPERVISOR),
  validate(createVehicleValidation),
  createVehicle
);

// Update vehicle (admin and supervisor only)
router.put(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.SUPERVISOR),
  validate(updateVehicleValidation),
  updateVehicle
);

// Delete vehicle (admin only)
router.delete(
  '/:id',
  authorize(UserRole.ADMIN),
  validate(vehicleIdValidation),
  deleteVehicle
);

module.exports = router;
