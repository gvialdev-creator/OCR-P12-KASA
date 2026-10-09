const express = require('express');
const router = express.Router();

const dbReady = require('../middlewares/dbReady');
const { requireRole, requireAdmin, requireSelfOrAdmin, requireAuth } = require('../middlewares/auth');
const properties = require('../controllers/propertiesController');
const users = require('../controllers/usersController');
const ratings = require('../controllers/ratingsController');
const favorites = require('../controllers/favoritesController');
const uploads = require('../controllers/uploadsController');
const ownerRequests = require('../controllers/ownerRequestsController');
const messaging = require('../controllers/messagingController');

// Ensure DB is ready for all API routes
router.use(dbReady);

router.use('/conversations', requireAuth, (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
router.get('/conversations', messaging.list);
router.post('/conversations', messaging.rateLimit('start', 30), messaging.start);
router.get('/conversations/:id', messaging.get);
router.get('/conversations/:id/messages', messaging.load);
router.post('/conversations/:id/messages', messaging.rateLimit('send', 60), messaging.send);
router.patch('/conversations/:id/read', messaging.rateLimit('read', 120), messaging.read);
router.post('/messaging/socket-token', requireAuth, messaging.rateLimit('ticket', 20), messaging.ticket);

// Owner access requests
router.post('/owner-requests', requireRole(['client']), ownerRequests.submit);
router.get('/owner-requests/me', requireRole(['client']), ownerRequests.getMine);
router.get('/admin/owner-requests', requireAdmin, ownerRequests.listPending);
router.patch('/admin/owner-requests/:id', requireAdmin, ownerRequests.decide);

// Properties
router.get('/properties', properties.list);
router.get('/properties/:id', properties.getById);
router.post('/properties', requireRole(['owner','admin']), properties.create);
router.patch('/properties/:id', requireRole(['owner','admin']), properties.update);
router.delete('/properties/:id', requireRole(['owner','admin']), properties.remove);

// Users
router.get('/users', requireAdmin, users.list);
router.get('/users/:id', requireSelfOrAdmin('id'), users.getById);
router.post('/users', requireAdmin, users.create);
router.patch('/users/:id/password', requireSelfOrAdmin('id'), users.changePassword);
router.patch('/users/:id', requireSelfOrAdmin('id'), users.update);

// Ratings for properties
router.get('/properties/:id/ratings', ratings.listForProperty);
router.post('/properties/:id/ratings', ratings.add);

// Favorites
router.post('/properties/:id/favorite', requireAuth, favorites.addForProperty);
router.delete('/properties/:id/favorite', requireAuth, favorites.removeForProperty);
router.get('/users/:id/favorites', requireSelfOrAdmin('id'), favorites.listForUser);

// Uploads
router.post('/uploads/image', requireRole(['owner','admin']), uploads.uploadImage);

// Delete one or multiple uploaded images by filename or URL
router.delete('/uploads/images', requireRole(['owner','admin']), uploads.deleteImages);

module.exports = router;
