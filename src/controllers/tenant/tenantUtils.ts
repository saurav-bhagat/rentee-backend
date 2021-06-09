import { Request, Response } from 'express';

import Property from '../../models/property/property';
import Tenant from '../../models/tenant/tenant';

import { IUser } from '../../models/user/interface';
import { IRooms } from '../../models/property/interface';

import { TenantObj } from './tenantTypes';

export class TenantUtils {
	pong = (req: Request, res: Response) => {
		res.status(200).send('pong');
	};
	findTenant = async (userDocument: IUser): Promise<any> => {
		const tenantDocument = await Tenant.findOne({ userId: userDocument._id })
			.populate({ path: 'ownerId' })
			.populate({ path: 'roomId' })
			.populate({ path: 'userId' });
		if (tenantDocument == null) {
			throw new Error('Unable to find User');
		}

		const {
			userId: userObject,
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
			_id: ownerId,
		} = (ownerObject as unknown) as IUser;
		const {
			name: tenantName,
			email: tenantEmail,
			phoneNumber: tenantPhoneNumber,
		} = (userObject as unknown) as IUser;
		const { rent, type: roomType, floor, roomNo: roomNumber } = (roomObject as unknown) as IRooms;

		// Finding building with ownerId and buildId
		const building = await Property.aggregate([
			{ $match: { ownerId: ownerId } },
			{ $unwind: '$buildings' },
			{ $match: { 'buildings._id': buildId } },
		]);

		if (building.length == 0) {
			throw new Error('Unable to find property for user');
		}

		let result: TenantObj = {};

		const { name: buildingName, address: buildingAddress } = <any>building;

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
		return new Promise((resolve, reject) => {
			if (result == null) {
				reject('Unable to find User');
			}
			resolve(result);
		});
	};
}
