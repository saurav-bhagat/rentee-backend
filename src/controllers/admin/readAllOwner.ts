import { Request, Response } from 'express';
import property from '../../models/property/property';
import User from '../../models/user/User';

import { IOwnerForAdmin } from './adminType';
import { formatOwnerResponse } from './adminUtil';

export const getAllOwner = async (req: Request, res: Response) => {
	if (req.isAuth) {
		const users = await User.find({ userType: 'Owner' });
		const allOwnerInfo: Array<IOwnerForAdmin> = [];
		if (users.length) {
			for (let user = 0; user < users.length; user++) {
				const { _id, email, phoneNumber, name } = users[user];
				const propertyDoc = await property
					.findOne({ ownerId: _id })
					.populate({ path: 'ownerId ownerInfo' })
					.populate({
						path: 'buildings.maintainerId',
						populate: {
							path: 'userId',
						},
					})
					.populate({
						path: 'buildings.rooms',
						populate: {
							path: 'tenants',
							populate: {
								path: 'userId payments receipts',
							},
						},
					});
				if (propertyDoc) {
					allOwnerInfo.push(formatOwnerResponse(propertyDoc));
				} else {
					allOwnerInfo.push({ _id, name, email, phoneNumber });
				}
			}
		}
		return res.status(200).json({ allOwnerInfo });
	} else {
		return res.status(403).json({ err: 'Not Authorized' });
	}
};
