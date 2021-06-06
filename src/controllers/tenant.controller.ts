import { Request, Response } from 'express';
import validator from 'validator';

import bcrypt from 'bcrypt';
import User from '../models/user/User';

import Property from '../models/property/property';
import Tenant from '../models/tenant/tenant';

import { verifyObjectId } from '../utils/errorUtils';
import { IUser } from '../models/user/interface';

import { IRooms } from '../models/property/interface';

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

export class TenantController {
	// Password update on first login
	updateTenantPassword = async (req: Request, res: Response) => {
		const { email, password } = req.body;

		if (req.user) {
			if (!email || !password) {
				return res.json({ err: 'All fields are mandatory!' });
			}
			if (!validator.isEmail(email) || password.length < 6) {
				return res.json({ err: 'Either email/password incorrect' });
			}

			const tenant = await User.findOne({ email });
			if (tenant) {
				const salt = await bcrypt.genSalt();
				const newPassword = await bcrypt.hash(password, salt);

				const updatedUser = await tenant.updateOne({ password: newPassword });
				if (updatedUser) {
					return res.status(200).json({ msg: 'Password updated successfully' });
				}
				return res.status(400).json({ err: 'Password Update Failed' });
			}
			return res.status(400).json({ err: 'Tenant does not exit' });
		} else {
			return res.status(403).json({ err: 'Password Update Failed' });
		}
	};

	// Tenant dashboard details
	tenantInfo = async (req: Request, res: Response) => {
		const { userId, name: tenantName, email: tenantEmail, phoneNumber: tenantPhoneNumber } = req.body;

		if (!verifyObjectId([userId]) || !req.isAuth) {
			res.status(403).json({ err: 'Not Authorized' });
		}

		// finding a tenant with userId
		const tenantDocument = await Tenant.findOne({ userId })
			.populate({ path: 'ownerId' })
			.populate({ path: 'roomId' });

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
