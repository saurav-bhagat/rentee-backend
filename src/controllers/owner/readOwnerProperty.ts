import { Request, Response } from 'express';
import Property from '../../models/property/property';

import User from '../../models/user/User';
import { verifyObjectId } from '../../utils/errorUtils';

import { BasicUser, OwnerDashoardDetail, IDashbhoardBuild } from './ownerTypes';

import { findBuilding } from './ownerUtils';

// owner dashboard details
export const getAllOwnerBuildings = async (req: Request, res: Response) => {
	const { ownerId } = req.body;
	console.log(ownerId);
	if (!ownerId || !verifyObjectId([ownerId])) {
		return res.status(400).json({ err: 'User details missing' });
	}
	if (req.isAuth) {
		const owner = await User.findOne({ _id: ownerId, userType: 'Owner' });
		if (owner) {
			const ownerDetails = await Property.findOne({ ownerId })
				.populate({
					path: 'buildings.rooms',
					populate: {
						path: 'tenants',
						populate: {
							path: 'userId',
						},
					},
				})
				.populate({
					path: 'buildings.maintainerId',
					populate: {
						path: 'userId',
					},
				});
			if (ownerDetails) {
				const { _id, ownerId, buildings } = ownerDetails;
				const tempbuildingArray: Array<IDashbhoardBuild> = [];
				for (let i = 0; i < buildings.length; i++) {
					const tempBuild: IDashbhoardBuild = findBuilding(buildings[i]);
					tempbuildingArray.push(tempBuild);
				}
				const ownerDashoardResult: OwnerDashoardDetail = { _id, ownerId, buildings: tempbuildingArray };
				return res.status(200).json({ ownerDashoardResult });
			} else {
				const { _id, name, email, phoneNumber, userType } = owner;
				const ownerInfo: BasicUser = { _id, email, name, phoneNumber, userType };
				// TODO:  send userID for the tenants
				return res.status(200).json({ ownerInfo });
			}
		} else {
			return res.status(400).json({ err: 'Invalid Owner' });
		}
	} else {
		return res.status(403).json({ err: 'Not Authorized' });
	}
};
