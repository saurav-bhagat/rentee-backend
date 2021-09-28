import { Router } from 'express';
import { signUp, login } from '../controllers/admin/adminAuth';
import { getAllOwner } from '../controllers/admin/readAllOwner';
import isAuth from '../middleware/is-auth';

const router: Router = Router();

// endpoints for admin

router.post('/signup', signUp);

router.post('/login', login);

router.post('/getAllOwner', isAuth, getAllOwner);

export default router;
