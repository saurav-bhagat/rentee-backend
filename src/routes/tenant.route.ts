import { Router } from 'express';
import { ReadTenant, UpdateTenant } from '../controllers/tenant';

const router: Router = Router();

const readTenant: ReadTenant = new ReadTenant();
const updateTenant: UpdateTenant = new UpdateTenant();

// endpoints for tenants

router.get('/ping', (req, res) => {
	res.status(200).send('Tenant pong');
});

router.put('/update-password', updateTenant.updateTenantPassword);

router.post('/dashboard', readTenant.tenantInfo);

export default router;
