import { Request, Response } from 'express';
import Property from '../../models/property/property';

import { verifyObjectId } from '../../utils/errorUtils';

export class ReadOnwerProperty {
	pong = (_req: Request, res: Response): void => {
		res.status(200).send('pong');
	};

	// owner dashboard details
	getAllOwnerBuildings = (req: Request, res: Response) => {
		const { ownerId } = req.body;
		if (!ownerId || !verifyObjectId([ownerId])) {
			return res.status(400).json({ err: 'Incorrect owner detail' });
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
				.then((data) => {
					return res.status(200).json({ ownerBuildingDetails: data });
				});
		} else {
			return res.status(403).json({ err: 'Not Authorized' });
		}
	};
}
