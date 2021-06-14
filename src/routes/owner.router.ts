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

export default router;
