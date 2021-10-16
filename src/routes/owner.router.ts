import { Router } from 'express';
import {
	addOwnerProperty,
	tenantRegistration,
	getAllOwnerBuildings,
	updateOwnerBuilding,
	updateRoomDetails,
	addBuildings,
	addRooms,
	addMaintainer,
	removeTenant,
	removeMaintainer,
	removeBuilding,
	removeRoom,
	ownerAddBankAccountInfo,
	updateOwnerBankDetails,
} from '../controllers/owner';

import { updateTenantInfo } from '../controllers/tenant';
import { payWithCashAndOtherMeans } from '../payment/payWithCash';

const router: Router = Router();

// endpoints for owner
router.get('/ping', (req, res) => {
	res.status(200).send('owner ping');
});

router.post('/add-bank-info', ownerAddBankAccountInfo);
router.post('/add-property', addOwnerProperty);

router.post('/register-tenant', tenantRegistration);
router.post('/dashboard', getAllOwnerBuildings);

router.post('/pay-with-cash', payWithCashAndOtherMeans);

router.put('/update-building', updateOwnerBuilding);
router.put('/update-room-details', updateRoomDetails);

router.put('/add-buildings', addBuildings);
router.put('/add-rooms', addRooms);

router.put('/add-maintainer', addMaintainer);
router.put('/update-tenant-info', updateTenantInfo);

router.put('/update-owner-bank-details', updateOwnerBankDetails);

// TODO: For all remove, check if required params are passed in the owner dashboard or not
router.delete('/remove-tenant', removeTenant);
router.delete('/remove-maintainer', removeMaintainer);
router.delete('/remove-building', removeBuilding);
router.delete('/remove-room', removeRoom);

export default router;
