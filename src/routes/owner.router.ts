import { Router } from 'express';
import { addOwnerProperty, tenantRegistration, getAllOwnerBuildings } from '../controllers/owner';

const router: Router = Router();

// endpoints for owner
router.get('/ping', (req, res) => {
	res.status(200).send('owner ping');
});

router.post('/add-property', addOwnerProperty);

router.post('/register-tenant', tenantRegistration);

router.post('/dashboard', getAllOwnerBuildings);

export default router;
