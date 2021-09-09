import { Request, Response } from 'express';
import { IOwner } from '../../models/owner/interface';
import Property from '../../models/property/property';

import User from '../../models/user/User';
import { verifyObjectId } from '../../utils/errorUtils';

import { OwnerDashboardDetail, IDashboardBuild } from './ownerTypes';

import { findBuilding } from './ownerUtils';

// owner dashboard details
export const getAllOwnerBuildings = async (req: Request, res: Response) => {
	if (req.isAuth) {
		const { ownerId } = req.body;

		if (!ownerId || !verifyObjectId([ownerId])) {
			return res.status(400).json({ err: 'Invalid owner' });
		}

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
				})
				.populate({
					path: 'ownerInfo',
				});

			if (ownerDetails) {
				const { _id, ownerId, buildings, ownerInfo } = ownerDetails;
				const {
					accountName,
					accountNumber,
					ifsc,
					bankName,
					beneficiaryName,
				} = (ownerInfo as unknown) as IOwner;

				const tempbuildingArray: Array<IDashboardBuild> = [];
				for (let i = 0; i < buildings.length; i++) {
					const tempBuild: IDashboardBuild = findBuilding(buildings[i]);
					tempbuildingArray.push(tempBuild);
				}
				const ownerDashboardResult: OwnerDashboardDetail = {
					_id,
					ownerId,
					buildings: tempbuildingArray,
					accountName,
					accountNumber,
					ifsc,
					bankName,
					beneficiaryName,
				};
				return res.status(200).json({ ownerDashboardResult });
			} else {
				const { _id, name, email, phoneNumber, userType } = owner;
				const ownerInfo = { _id, email, name, phoneNumber, userType, buildings: [] };
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
