import { Router } from 'express';
import { OwnerController } from '../controllers/owner.controller';

const router: Router = Router();

const ownerController: OwnerController = new OwnerController();

// endpoints for owner
router.get('/ping', ownerController.pong);

router.post('/add-property', ownerController.addOwnerProperty);

router.post('/register-tenant', ownerController.tenantRegistration);

router.post('/dashboard', ownerController.getAllOwnerBuildings);

export default router;
