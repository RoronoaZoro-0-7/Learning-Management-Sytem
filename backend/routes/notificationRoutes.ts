import express from 'express';
import notification from '../controllers/notificationController';
import isAuthenticated, { authorizeRoles } from '../middleware/auth';

const router = express.Router();

router.get('/all-notifications', isAuthenticated,
    authorizeRoles("admin"), notification.getNotifications);

router.put('/update-notification/:id', isAuthenticated,
    authorizeRoles("admin"), notification.updateNotification);

export default router;