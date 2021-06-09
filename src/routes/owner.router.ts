import { Router } from 'express';
import { CreateOwnerProperty, OwnerUtils, ReadOnwerProperty } from '../controllers/owner';

const router: Router = Router();

const createOwnerProperty: CreateOwnerProperty = new CreateOwnerProperty();
const ownerUtils: OwnerUtils = new OwnerUtils();
const readOnwerProperty: ReadOnwerProperty = new ReadOnwerProperty();

// endpoints for owner
router.get('/ping', createOwnerProperty.pong);

router.post('/add-property', createOwnerProperty.addOwnerProperty);

router.post('/register-tenant', ownerUtils.tenantRegistration);

router.post('/dashboard', readOnwerProperty.getAllOwnerBuildings);

export default router;
