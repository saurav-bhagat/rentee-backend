import { Request, Response } from 'express';
import mongoose, { ObjectId } from 'mongoose';

import randomstring from 'randomstring';
import validator from 'validator';

import { addMonths, setDate } from 'date-fns';

import { IUser } from '../../models/user/interface';
import Property from '../../models/property/property';

import Maintainer from '../../models/maintainer/maintainer';
import { formatDbError, isEmptyFields, verifyObjectId } from '../../utils/errorUtils';

import {
	BasicUser,
	OwnerDashboardDetail,
	IDashboardRoom,
	IDashboardTenant,
	IDashboardBuild,
	IDashboardMaintainer,
} from './ownerTypes';

import User from '../../models/user/User';
import Tenant from '../../models/tenant/tenant';

import Rooms from '../../models/property/rooms';
import { IMaintainer } from '../../models/maintainer/interface';

import { IBuilding, IRooms, IProperty } from '../../models/property/interface';
import { ITenant } from '../../models/tenant/interface';

import { IOwner } from '../../models/owner/interface';
import { IPayment, IPaymentDetail } from '../../models/payment/interface';

export const findOwner = async (
	userDocument: IUser
): Promise<IProperty | null | IUser | BasicUser | OwnerDashboardDetail> => {
	const propertyDetails = await Property.findOne({ ownerId: userDocument._id })
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
	if (propertyDetails == null) {
		// throw new Error('Property details not added by owner yet');
		// TODO: return user details even if property is not added
		const { _id, name, email, phoneNumber, userType } = userDocument;
		const userInfo: BasicUser = { ownerId: _id, name, email, phoneNumber, userType };

		return userInfo;
	}

	const { userType } = userDocument;
	const { _id, ownerId, buildings, ownerInfo } = propertyDetails;

	const tempbuildingArray: Array<IDashboardBuild> = [];
	for (let i = 0; i < buildings.length; i++) {
		const tempBuild: IDashboardBuild = findBuilding(buildings[i]);
		tempbuildingArray.push(tempBuild);
	}

	let ownerDashbhoardResult: OwnerDashboardDetail = {};
	if (ownerInfo) {
		const {
			accountName,
			accountNumber,
			ifsc,
			bankName,
			beneficiaryName,
			vendorId,
		} = (ownerInfo as unknown) as IOwner;

		ownerDashbhoardResult = {
			_id,
			ownerId,
			userType,
			buildings: tempbuildingArray,
			accountName,
			accountNumber,
			ifsc,
			bankName,
			beneficiaryName,
			vendorId,
		};
		return ownerDashbhoardResult;
	}

	ownerDashbhoardResult = {
		_id,
		ownerId,
		userType,
		buildings: tempbuildingArray,
	};
	return ownerDashbhoardResult;
};

// owner add tenant to tenant array
export const tenantRegistration = async (req: Request, res: Response): Promise<Response<void>> => {
	if (req.isAuth) {
		const { name, email, phoneNumber, securityAmount, ownerId, buildId, roomId, rent } = req.body;

		const tenantDetails = {
			name,
			email,
			phoneNumber,
			securityAmount,
			ownerId,
			buildId,
			roomId,
		};

		if (isEmptyFields(tenantDetails)) {
			return res.status(400).json({ err: 'Missing fields' });
		}

		if (!verifyObjectId([ownerId, buildId, roomId])) {
			return res.status(400).json({ err: 'Incorrect details sent' });
		}
		if (!validator.isEmail(email) || !validator.isMobilePhone(`91${phoneNumber}`, 'en-IN')) {
			return res.status(400).json({ err: 'Either email/phoneNumber invalid' });
		}
		// Finding building with ownerId and roomId
		// this is to ensure that ownerID is associated with buildId
		const building = await Property.aggregate([
			{ $match: { ownerId: new mongoose.Types.ObjectId(ownerId) } },
			{ $unwind: '$buildings' },
			{ $match: { 'buildings._id': new mongoose.Types.ObjectId(buildId) } },
		]);

		// Make sure owner has building
		if (building.length == 0) {
			return res.status(400).json({ err: 'Invalid owner/building' });
		}

		const password = randomstring.generate({ length: 6, charset: 'abc' });

		const userInfo = {
			name,
			email,
			password,
			phoneNumber,
			userType: 'Tenant',
		};

		try {
			// Make sure owner has room in building
			const roomDocument = await Rooms.findOne({ _id: roomId });

			if (roomDocument && roomDocument._id.toString() == roomId.toString()) {
				if (!roomDocument.isMultipleTenant && roomDocument.tenants.length >= 1) {
					return res.status(400).json({ err: 'You cant add tenant in single room' });
				}

				if (roomDocument.isMultipleTenant) {
					if (!rent) {
						return res.status(400).json({ err: 'Missing fields' });
					}
				}

				// Creating a tenant User
				const userDoc = await User.create(userInfo);
				const userId = userDoc._id;

				const joinDate = new Date();
				const nextMonthDate = setDate(addMonths(new Date(), 1), 5);
				// keep consistent date format
				const rentDueDate = nextMonthDate.toString();
				let tenantInfo: any;

				if (roomDocument.isMultipleTenant) {
					tenantInfo = {
						userId,
						joinDate,
						rentDueDate,
						securityAmount,
						roomId,
						buildId,
						ownerId,
						rent,
					};

					roomDocument.rent += parseInt(rent);
				} else {
					tenantInfo = {
						userId,
						joinDate,
						rentDueDate,
						securityAmount,
						roomId,
						buildId,
						ownerId,
					};
				}

				const tenantDoc = await Tenant.create(tenantInfo);
				const tenantId = tenantDoc._id;

				roomDocument.tenants.push(tenantId);

				await roomDocument.save();
				return res.status(200).json({ password, msg: 'Tenant added successfully' });
			} else {
				return res.status(400).json({ err: 'Room not found!' });
			}
		} catch (error) {
			// TODO: If tenant is not saved, delete the user
			// this case can be invoked by passing security: 20,000
			return res.status(400).json({ err: formatDbError(error) });
		}
	} else {
		return res.status(403).json({ err: 'Not Authorized' });
	}
};

export const addBuildingsUtil = async (addBuildigDetails: any) => {
	const { ownerId, buildings } = addBuildigDetails;
	try {
		let propertyDoc = await Property.findOneAndUpdate(
			{ ownerId },
			{
				$push: { buildings: { $each: buildings } },
			},
			{ new: true, runValidators: true, context: 'query' }
		);
		if (!propertyDoc) {
			const user = await User.findOne({ _id: ownerId, userType: 'Owner' });
			if (user) {
				const property = { ownerId, buildings };
				propertyDoc = await Property.create(property);
				if (propertyDoc) {
					return propertyDoc;
				}
			}
			return null;
		}
		return propertyDoc;
	} catch (err) {
		throw formatDbError(err);
	}
};

export const addRoomsUtil = async (addRoomDetail: any) => {
	const { ownerId, buildingId, rooms } = addRoomDetail;
	try {
		const roomIds: Array<ObjectId> = [];
		for (let i = 0; i < rooms.length; i++) {
			const room = rooms[i];
			const roomDocument = await Rooms.create(room);
			if (roomDocument) {
				roomIds.push(roomDocument._id);
			}
		}
		const result = await Property.findOneAndUpdate(
			{ ownerId, 'buildings._id': buildingId },
			{
				$push: {
					'buildings.$.rooms': roomIds,
				},
			},
			{ new: true, runValidators: true, context: 'query' }
		);
		if (!result) {
			return null;
		}
		return result;
	} catch (err) {
		throw formatDbError(err);
	}
};

export const addMaintainerUtil = async (addMaintainerDetails: any) => {
	const { ownerId, buildingId, email, phoneNumber, name } = addMaintainerDetails;

	const maintainerPassword = randomstring.generate({ length: 6, charset: 'abc' });
	const data = { name, email, phoneNumber, password: maintainerPassword, userType: 'Maintainer' };

	try {
		// find maintainer as user present or not
		let maintainerDocument = await User.findOne({ phoneNumber, userType: 'Maintainer' });
		if (!maintainerDocument) {
			maintainerDocument = await User.create(data);
		}

		if (maintainerDocument) {
			const result = await Property.findOneAndUpdate(
				{ ownerId, 'buildings._id': buildingId },
				{ $set: { 'buildings.$.maintainerId': maintainerDocument._id } },
				{ new: true }
			);

			if (!result) {
				throw new Error('Invalid owner/building details');
			}

			const maintainer = await Maintainer.findOneAndUpdate(
				{ userId: maintainerDocument._id },
				{ $push: { buildings: buildingId } }
			);
			const buildingIdArray: Array<ObjectId> = [];
			buildingIdArray.push(buildingId);
			if (!maintainer) {
				const doc = {
					ownerId,
					userId: maintainerDocument._id,
					joinDate: new Date(),
					buildings: buildingIdArray,
				};
				const maintainerDoc = await Maintainer.create(doc);

				if (maintainerDoc) {
					// Replacing maintainer id
					await Property.findOneAndUpdate(
						{ ownerId, 'buildings._id': buildingId },
						{ $set: { 'buildings.$.maintainerId': maintainerDoc._id } },
						{ new: true }
					);
				}
				const dummyObject = { result, maintainerPassword };
				return dummyObject;
			} else {
				const maintainerDocs = await Property.findOneAndUpdate(
					{ ownerId, 'buildings._id': buildingId },
					{ $set: { 'buildings.$.maintainerId': maintainer._id } },
					{ new: true }
				);
				return maintainerDocs;
			}
		}
	} catch (err) {
		throw formatDbError(err);
	}
};

export const findRoom = (room: IRooms) => {
	const { _id, rent, type, floor, roomNo, tenants, roomSize, isMultipleTenant } = room;
	const tenantsArray: Array<IDashboardTenant> = [];
	if (tenants && tenants.length) {
		for (let k = 0; k < tenants.length; k++) {
			const tenant = tenants[k];
			const { userId, joinDate, rentDueDate, securityAmount, payments, rent } = (tenant as unknown) as ITenant;
			const tenantRef = (userId as unknown) as IUser;
			const { _id, name, email, phoneNumber } = tenantRef;
			const paymentDetails: Array<IPaymentDetail> = [];
			if (payments && payments.length) {
				for (let paymentIndex = 0; paymentIndex < payments.length; paymentIndex++) {
					const payment = (payments[paymentIndex] as unknown) as IPayment;
					const { respCode } = payment;
					if (respCode === '01') {
						const { txnAmount, txnDate, paymentMode, _id } = payment;
						paymentDetails.push({ txnAmount, txnDate, paymentMode, _id });
					}
				}
			}
			const tempTenat: IDashboardTenant = {
				_id,
				name,
				email,
				phoneNumber,
				joinDate,
				rentDueDate,
				securityAmount,
				paymentDetails,
			};
			if (isMultipleTenant) {
				tempTenat['rent'] = rent;
			}
			tenantsArray.push(tempTenat);
		}
	}
	const roomDetails: IDashboardRoom = {
		_id,
		rent,
		type,
		floor,
		roomNo,
		roomSize,
		tenants: tenantsArray,
		isMultipleTenant,
	};
	return roomDetails;
};

export const findMaintainer = (maintainer: IMaintainer) => {
	const { joinDate, userId } = maintainer;
	const maintainerUser = (userId as unknown) as IUser;
	const { _id, name, email, phoneNumber } = maintainerUser;
	const maintainerDetail: IDashboardMaintainer = { _id, name, email, phoneNumber, joinDate };
	return maintainerDetail;
};

export const findBuilding = (building: IBuilding) => {
	const { _id, name, address } = building;
	const build = building;
	let buildingDetail: IDashboardBuild;
	const rooms: Array<IDashboardRoom> = [];
	for (let j = 0; j < build.rooms.length; j++) {
		const room: IDashboardRoom = findRoom((building.rooms[j] as unknown) as IRooms);
		rooms.push(room);
	}
	if (building.maintainerId) {
		const maintainerDetail: IDashboardMaintainer = findMaintainer(
			(building.maintainerId as unknown) as IMaintainer
		);
		buildingDetail = { _id, name, address, rooms, maintainer: maintainerDetail };
		return buildingDetail;
	}
	buildingDetail = { _id, name, address, rooms };
	return buildingDetail;
};

export const validateIfsc = (ifsc: any) => {
	const regex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
	return regex.test(ifsc);
};

export const validateBankAccountNumber = (accountNumber: any) => {
	const regex = /[0-9]{9,18}/;
	return regex.test(accountNumber);
};
