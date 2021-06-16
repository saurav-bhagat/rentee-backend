import { Router } from 'express';
import {
	addOwnerProperty,
	tenantRegistration,
	getAllOwnerBuildings,
	updateOnwerBuilding,
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

router.put('/update-building', updateOnwerBuilding);

router.put('/update-rooms-details', updateRoomDetails);

router.put('/add-buildings', addBuildings);
router.put('/add-rooms', addRooms);

router.put('/add-maintainer', addMaintainer);

router.delete('/remove-tenant', removeTenant);
router.delete('/remove-maintainer', removeMaintainer);
router.delete('/remove-building', removeBuilding);
router.delete('/remove-room', removeRoom);

export default router;
