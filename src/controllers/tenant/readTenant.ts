import { Request, Response } from 'express';
import Property from '../../models/property/property';

import Tenant from '../../models/tenant/tenant';
import { verifyObjectId } from '../../utils/errorUtils';

import { IUser } from '../../models/user/interface';
import { IRooms } from '../../models/property/interface';

export interface TenantObj {
	tenantEmail?: string;
	tenantName?: string;
	tenantPhoneNumber?: string;
	roomNumber?: number;
	roomType?: string;
	rent?: number;
	floor?: string;
	joinDate?: string;
	rentDueDate?: string;
	security?: number;
	buildingName?: string;
	buildingAddress?: string;
	ownerName?: string;
	ownerEmail?: string;
	ownerPhoneNumber?: string;
}

// Tenant dashboard details
export const tenantInfo = async (req: Request, res: Response) => {
	const { userId, name: tenantName, email: tenantEmail, phoneNumber: tenantPhoneNumber } = req.body;

	// exception case for email,phoneNumber because it safely come from on user login

	if (!verifyObjectId([userId]) || !req.isAuth) {
		res.status(403).json({ err: 'Invalid Tenant' });
	}

	// finding a tenant with userId
	const tenantDocument = await Tenant.findOne({ userId }).populate({ path: 'ownerId' }).populate({ path: 'roomId' });

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
