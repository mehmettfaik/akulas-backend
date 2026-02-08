const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const vehicleRoutes = require('./vehicle.routes');
const recordRoutes = require('./record.routes');
const reportRoutes = require('./report.routes');
const hakedisRoutes = require('./hakedis.routes');
const deskRoutes = require('./desk.routes');
const bayiDolumRoutes = require('./bayi-dolum.routes');
const leaveRoutes = require('./leave.routes');

const router = express.Router();

// Health check endpoint (No auth required)
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// Authentication routes (No auth required for login)
router.use('/auth', authRoutes);

// User management routes (Auth required)
router.use('/users', userRoutes);

// API routes (Auth required)
router.use('/vehicles', vehicleRoutes);
router.use('/records', recordRoutes);
router.use('/reports', reportRoutes);
router.use('/hakedis', hakedisRoutes);
router.use('/desk', deskRoutes);
router.use('/bayi-dolum', bayiDolumRoutes);
router.use('/leave', leaveRoutes);

module.exports = router;
