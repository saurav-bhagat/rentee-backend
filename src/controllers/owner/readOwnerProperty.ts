import { Request, Response } from 'express';
import Property from '../../models/property/property';

import { verifyObjectId } from '../../utils/errorUtils';

// owner dashboard details
export const getAllOwnerBuildings = (req: Request, res: Response) => {
	const { ownerId } = req.body;
	if (!ownerId || !verifyObjectId([ownerId])) {
		return res.status(403).json({ err: 'Not authorized' });
	}
	if (req.isAuth) {
		Property.findOne({ ownerId })
			.populate({
				path: 'buildings.rooms',
				populate: {
					path: 'tenants',
					populate: {
						path: 'userId',
					},
				},
			})
			.populate({ path: 'buildings.maintainerId' })
			.then((data) => {
				if (!data) {
					return res.status(400).json({ err: 'Invalid owner detail' });
				}
				return res.status(200).json({ ownerBuildingDetails: data });
			});
	} else {
		return res.status(403).json({ err: 'Not Authorized' });
	}
};
