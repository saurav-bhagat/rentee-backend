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
} from '../controllers/owner';

const router: Router = Router();

// endpoints for owner
router.get('/ping', (req, res) => {
	res.status(200).send('owner ping');
});

router.post('/add-property', addOwnerProperty);

router.post('/register-tenant', tenantRegistration);

router.post('/dashboard', getAllOwnerBuildings);

router.put('/update-building', updateOwnerBuilding);

router.put('/update-rooms-details', updateRoomDetails);

router.put('/add-buildings', addBuildings);
router.put('/add-rooms', addRooms);

router.put('/add-maintainer', addMaintainer);

// TODO: For all remove, check if required params are passed in the owner dashboard or not
router.delete('/remove-tenant', removeTenant);
router.delete('/remove-maintainer', removeMaintainer);
router.delete('/remove-building', removeBuilding);
router.delete('/remove-room', removeRoom);

export default router;
