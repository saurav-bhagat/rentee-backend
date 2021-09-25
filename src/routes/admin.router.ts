import { Router } from 'express';
import { signUp, login } from '../controllers/admin/adminAuth';

const router: Router = Router();

// endpoints for admin

router.post('/signup', signUp);

router.post('/login', login);

export default router;
