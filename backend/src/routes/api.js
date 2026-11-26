const express = require('express');
const router = express.Router();
const multer = require('multer');

// Configure file upload with memory storage for S3
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, callback) => {
    const mimeTypesByExtension = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      svg: 'image/svg+xml',
      webp: 'image/webp'
    };
    const extension = file.originalname.split('.').pop()?.toLowerCase();
    const expectedMimeType = mimeTypesByExtension[extension];
    const hasGenericMimeType = !file.mimetype || file.mimetype === 'application/octet-stream';
    if (!expectedMimeType || (!hasGenericMimeType && file.mimetype !== expectedMimeType)) {
      const error = new Error('Only PNG, JPG, JPEG, SVG, and WebP floor plan images are allowed.');
      error.status = 400;
      return callback(error);
    }
    file.mimetype = expectedMimeType;
    return callback(null, true);
  },
  limits: { fileSize: 10 * 1024 * 1024, files: 1 } // 10MB
});

const mapController = require('../controllers/mapController');
const routeController = require('../controllers/routeController');
const facilityController = require('../controllers/facilityController');
const adminController = require('../controllers/adminController');
const authController = require('../controllers/authController');
const staffController = require('../controllers/staffController');

// Campus Map & Location endpoints
router.get('/blocks', mapController.getBlocks);
router.get('/floors', mapController.getFloors);
router.get('/nodes', mapController.getNodes);
router.get('/edges', mapController.getEdges);
router.get('/search', mapController.searchLocations);
router.get('/locations/:id/qr', mapController.getLocationQr);
router.get('/faculty', staffController.list);

// Navigation & Dijkstra Route Engine
router.post('/route', routeController.calculateRoute);
router.post('/facilities/nearby', facilityController.getNearbyFacilities);

// Administrator Management Endpoints
router.use('/admin', authController.requireAdmin);
router.post('/admin/nodes', adminController.createNode);
router.put('/admin/nodes/:id', adminController.updateNode);
router.delete('/admin/nodes/:id', adminController.deleteNode);
router.put('/admin/blocks/:id/availability', adminController.updateBlockAvailability);
router.post('/admin/faculty', staffController.create);
router.put('/admin/faculty/:id', staffController.update);
router.delete('/admin/faculty/:id', staffController.remove);

router.post('/admin/edges', adminController.createEdge);
router.put('/admin/edges/:id', adminController.updateEdge);
router.delete('/admin/edges/:id', adminController.deleteEdge);

router.post('/admin/upload-map', upload.single('mapFile'), adminController.uploadFloorPlan);
router.get('/admin/stats', adminController.getStats);
router.post('/admin/reset', adminController.resetToDefault);

// Authentication
router.post('/auth/login', authController.login);
router.get('/auth/me', authController.requireAdmin, authController.getProfile);

module.exports = router;
