import { Router } from 'express';
import { updateTenantPassword, tenantInfo } from '../controllers/tenant';

const router: Router = Router();

// endpoints for tenants

router.get('/ping', (req, res) => {
	res.status(200).send('Tenant pong');
});

router.put('/update-password', updateTenantPassword);

router.post('/dashboard', tenantInfo);

export default router;
