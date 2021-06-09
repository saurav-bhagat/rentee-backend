import { Request, Response } from 'express';
import { IProperty } from '../../models/property/interface';

import { IUser } from '../../models/user/interface';
import Property from '../../models/property/property';

import mongoose from 'mongoose';
import { formatDbError, isEmptyFields, verifyObjectId } from '../../utils/errorUtils';

import randomstring from 'randomstring';
import User from '../../models/user/User';

import Tenant from '../../models/tenant/tenant';
import Room from '../../models/property/rooms';

export const findOwner = async (userDocument: IUser): Promise<IProperty | null> => {
	const propertyDetails = await Property.findOne({ ownerId: userDocument._id }).populate({
		path: 'buildings.rooms',
		populate: {
			path: 'tenants',
			populate: {
				path: 'userId',
			},
		},
	});
	if (propertyDetails == null) {
		throw new Error('Property details not added by owner yet');
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
	const building = await Property.aggregate([
		{ $match: { ownerId: new mongoose.Types.ObjectId(ownerId) } },
		{ $unwind: '$buildings' },
		{ $match: { 'buildings._id': new mongoose.Types.ObjectId(buildId) } },
	]);

	if (building.length == 0) {
		return res.status(400).json({ err: 'Unable to register tenant' });
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

		const roomDocument = await Room.findOne({ _id: roomId });

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
