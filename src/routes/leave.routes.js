const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leave.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// ÇALIŞAN ROUTES
router.get('/employees', authenticate, authorize(['admin']), leaveController.getAllEmployees);
router.get('/employees/:id', authenticate, authorize(['admin']), leaveController.getEmployeeById);
router.post('/employees', authenticate, authorize(['admin']), leaveController.createEmployee);
router.put('/employees/:id', authenticate, authorize(['admin']), leaveController.updateEmployee);
router.delete('/employees/:id', authenticate, authorize(['admin']), leaveController.deleteEmployee);

// İZİN TALEPLERİ
router.get('/requests', authenticate, authorize(['admin']), leaveController.getLeaveRequests);
router.post('/requests', authenticate, authorize(['admin']), leaveController.createLeaveRequest);
router.patch('/requests/:id/review', authenticate, authorize(['admin']), leaveController.reviewLeaveRequest);
router.patch('/requests/:id/cancel', authenticate, authorize(['admin']), leaveController.cancelLeaveRequest);

// İZİN HAKEDİŞLERİ
router.get('/entitlements/:employeeId', authenticate, authorize(['admin']), leaveController.getLeaveEntitlements);
router.get('/entitlements', authenticate, authorize(['admin']), leaveController.getAllEntitlements);

module.exports = router;