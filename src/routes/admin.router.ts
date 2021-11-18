import { Router } from 'express';
import { signUp, login } from '../controllers/admin/adminAuth';
import { notificationsToSpecificUserType } from '../controllers/admin/notificationToUsertype';
import { getAllOwner } from '../controllers/admin/readAllOwner';
import isAuth from '../middleware/is-auth';

const router: Router = Router();

// endpoints for admin

router.post('/signup', signUp);

router.post('/login', login);

router.post('/getAllOwner', isAuth, getAllOwner);

router.post('/notifications-to-specific-usertype', isAuth, notificationsToSpecificUserType);

export default router;
