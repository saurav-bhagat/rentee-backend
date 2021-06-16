import { Request, Response } from 'express';
import { IProperty } from '../../models/property/interface';

import { IUser } from '../../models/user/interface';
import Property from '../../models/property/property';
import Maintainer from '../../models/maintainer/maintainer';
import mongoose, { ObjectId } from 'mongoose';
import { formatDbError, isEmptyFields, verifyObjectId } from '../../utils/errorUtils';

import randomstring from 'randomstring';
import User from '../../models/user/User';

import Tenant from '../../models/tenant/tenant';
import Rooms from '../../models/property/rooms';

export const findOwner = async (userDocument: IUser): Promise<IProperty | null | IUser> => {
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
		});
	if (propertyDetails == null) {
		// throw new Error('Property details not added by owner yet');
		// TODO: return user details even if property is not added
		return userDocument;
	}
	return propertyDetails;
};

// owner add tenant to tenant array
export const tenantRegistration = async (req: Request, res: Response): Promise<Response<void>> => {
	const { name, email, phoneNumber, securityAmount, ownerId, buildId, roomId } = req.body;

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
		return res.status(400).json({ err: 'All fields are mandatory!' });
	}

	if (!verifyObjectId([ownerId, buildId, roomId])) {
		return res.status(400).json({ err: 'Incorrect details sent' });
	}
	// Finding building with ownerId and roomId
	// this is to ensure that ownerID is associated with buildId
	const building = await Property.aggregate([
		{ $match: { ownerId: new mongoose.Types.ObjectId(ownerId) } },
		{ $unwind: '$buildings' },
		{ $match: { 'buildings._id': new mongoose.Types.ObjectId(buildId) } },
	]);

	if (building.length == 0) {
		return res.status(400).json({ err: 'Invalid onwer/building' });
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
		// Creating a tenant User
		const userDoc = await User.create(userInfo);
		const userId = userDoc._id;

		const joinDate = new Date();
		const nextMonthDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
		// keep consistent date format
		const rentDueDate = nextMonthDate.toString();

		const tenantInfo = {
			userId,
			joinDate,
			rentDueDate,
			securityAmount,
			roomId,
			buildId,
			ownerId,
		};

		const tenantDoc = await Tenant.create(tenantInfo);
		const tenantId = tenantDoc._id;

		const roomDocument = await Rooms.findOne({ _id: roomId });

		if (roomDocument && roomDocument._id.toString() == roomId.toString()) {
			roomDocument.tenants.push(tenantId);
			await roomDocument.save();
			return res.status(200).json({ password, msg: 'Tenant added successfully' });
		} else {
			return res.status(400).json({ err: 'Room not found!' });
		}
	} catch (error) {
		return res.status(400).json({ err: formatDbError(error) });
	}
};

export const addBuildingsUtil = async (addBuildigDetails: any) => {
	const { ownerId, buildings } = addBuildigDetails;

	let propertyDoc = await Property.findOneAndUpdate(
		{ ownerId },
		{
			$push: { buildings: { $each: buildings } },
		},
		{ new: true }
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
};

export const addRoomsUtil = async (addRoomDetail: any) => {
	const { ownerId, buildingId, rooms } = addRoomDetail;

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
		{
			new: true,
		}
	);
	if (!result) {
		return null;
	}
	return result;
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
