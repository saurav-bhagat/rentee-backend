import { Request, Response } from 'express';
import { ObjectId } from 'mongoose';

import Property from '../../models/property/property';
import Tenant from '../../models/tenant/tenant';

import { IUser } from '../../models/user/interface';
import { IRooms } from '../../models/property/interface';

import User from '../../models/user/User';
import { findTenant } from '.';

import { verifyObjectId } from '../../utils/errorUtils';

export interface TenantObj {
	tenantEmail?: string;
	tenantName?: string;
	tenantPhoneNumber?: string;
	roomNumber?: number;
	roomType?: string;
	rent?: number;
	floor?: string;
	joinDate?: Date;
	rentDueDate?: Date;
	security?: number;
	buildingName?: string;
	buildingAddress?: string;
	ownerName?: string;
	ownerEmail?: string;
	ownerPhoneNumber?: string;
	userType?: string;
	receipts?: Array<ObjectId>;
}

// Tenant dashboard details
export const getTenantDashboard = async (req: Request, res: Response) => {
	const { userId } = req.body;
	if (req.isAuth && verifyObjectId([userId])) {
		const userDocument = await User.findOne({ _id: userId });
		if (userDocument) {
			const tenantDetails = await findTenant(userDocument);
			return res.status(200).json({ tenantDetails });
		} else {
			return res.status(400).json({ err: 'Tenant not found' });
		}
	} else {
		return res.status(403).json({ err: 'Authorization error' });
	}
};

export const tenantInfo = async (req: Request, res: Response) => {
	const { userId, name: tenantName, email: tenantEmail, phoneNumber: tenantPhoneNumber } = req.body;

	// exception case for email,phoneNumber because it safely come from on user login

	if (!verifyObjectId([userId]) || !req.isAuth) {
		res.status(403).json({ err: 'Invalid Tenant' });
	}

	// finding a tenant with userId
	const tenantDocument = await Tenant.findOne({ userId })
		.populate({ path: 'ownerId' })
		.populate({ path: 'roomId' })
		.populate({ path: 'receipts' });

	if (tenantDocument) {
		const {
			ownerId: ownerObject,
			buildId,
			roomId: roomObject,
			joinDate,
			rentDueDate,
			securityAmount: security,
		} = tenantDocument;

		const {
			name: ownerName,
			email: ownerEmail,
			phoneNumber: ownerPhoneNumber,
			_id,
		} = (ownerObject as unknown) as IUser;
		const { rent, type: roomType, floor, roomNo: roomNumber } = (roomObject as unknown) as IRooms;

		const propertyDocument = await Property.findOne({ ownerId: _id });

		let result: TenantObj = {};

		if (propertyDocument) {
			for (let i = 0; i < propertyDocument.buildings.length; i += 1) {
				const building = propertyDocument.buildings[i];
				if (building._id.toString() == buildId.toString()) {
					const { name: buildingName, address: buildingAddress } = building;

					result = {
						userType: 'Tenant',
						tenantEmail,
						tenantName,
						tenantPhoneNumber,
						roomNumber,
						roomType,
						rent,
						floor,
						joinDate,
						rentDueDate,
						security,
						buildingName,
						buildingAddress,
						ownerName,
						ownerEmail,
						ownerPhoneNumber,
						receipts: tenantDocument.receipts,
					};
					return res.status(200).json({ result, msg: 'successfully fetch tenant' });
				} else {
					return res.status(400).json({ err: 'Building not found' });
				}
			}
		} else {
			return res.status(400).json({ err: 'Owner not found' });
		}
	} else {
		return res.status(400).json({ err: 'Tenant not registered' });
	}
};
