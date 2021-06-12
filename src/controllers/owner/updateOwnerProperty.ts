import { Request, Response } from 'express';
import { ObjectId } from 'mongoose';

import validator from 'validator';
import Maintainer from '../../models/maintainer/maintainer';

import Property from '../../models/property/property';
import Rooms from '../../models/property/rooms';

import User from '../../models/user/User';
import { formatDbError, verifyObjectId } from '../../utils/errorUtils';

import randomstring from 'randomstring';

export const updateOnwerBuilding = async (req: Request, res: Response) => {
	const { ownerId, buildingId, name, address } = req.body;

	if (!ownerId || !buildingId || !verifyObjectId([ownerId, buildingId])) {
		return res.status(403).json({ err: 'Not Authorized' });
	}
	const data: any = {};
	if (name) data['buildings.$.name'] = name;
	if (address) data['buildings.$.address'] = address;

	if (!(Object.keys(data).length == 0)) {
		const result = await Property.findOneAndUpdate(
			{ ownerId, 'buildings._id': buildingId },
			{
				$set: data,
			},
			{
				new: true,
			}
		);
		if (!result) return res.status(400).json({ err: 'Invalid owner/building details' });
		return res.status(200).json({ result });
	} else {
		return res.status(400).json({ err: 'Updating field mandatory!' });
	}
};

export const updateRoomDetails = async (req: Request, res: Response) => {
	const { roomId, roomType: type, roomNo, floor, rent } = req.body;

	if (!roomId || !verifyObjectId([roomId])) {
		return res.status(403).json({ err: 'Not Authorized' });
	}
	const data: any = {};
	if (roomNo) data['roomNo'] = roomNo;
	if (type) data['type'] = type;

	if (floor) data['floor'] = floor;
	if (rent) data['rent'] = rent;

	if (!(Object.keys(data).length === 0)) {
		const result = await Rooms.findOneAndUpdate({ _id: roomId }, data, { new: true });
		if (!result) return res.status(400).json({ err: 'Invalid room detail' });
		return res.json({ result });
	} else {
		return res.json({ err: 'Updating field mandatory!' });
	}
};

export const addBuildings = async (req: Request, res: Response) => {
	const { ownerId, buildings } = req.body;

	if (!ownerId || !verifyObjectId([ownerId])) {
		return res.status(403).json({ err: 'Not Authorized' });
	}

	if (!buildings || buildings.length === 0) {
		return res.status(400).json({ err: 'Updating field mandatory!' });
	}

	const result = await Property.findOneAndUpdate(
		{ ownerId },
		{
			$push: { buildings: { $each: buildings } },
		},
		{ new: true }
	);
	if (!result) return res.status(400).json({ err: 'Invalid owner detail' });
	return res.status(200).json({ result });
};

export const addRooms = async (req: Request, res: Response) => {
	const { ownerId, buildingId, rooms } = req.body;
	if (!ownerId || !buildingId || !verifyObjectId([ownerId, buildingId])) {
		return res.status(403).json({ err: 'Not Authorized' });
	}
	if (!rooms || rooms.length == 0) {
		return res.status(400).json({ err: 'Updating field mandatory!' });
	}
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
		return res.status(400).json({ err: 'Invalid onwer/building details' });
	}
	return res.status(200).json({ result });
};

export const addMaintainer = async (req: Request, res: Response) => {
	const { ownerId, buildingId, email, phoneNumber, name } = req.body;
	if (!ownerId || !buildingId || !verifyObjectId([ownerId, buildingId])) {
		return res.status(403).json({ err: 'Not authorized' });
	}

	if (!validator.isEmail(email) || !validator.isMobilePhone(phoneNumber)) {
		return res.status(400).json({ err: 'Either email/phoneNumber not valid' });
	}
	const maintainerPassword = randomstring.generate({ length: 6, charset: 'abc' });
	const data = { name, email, phoneNumber, password: maintainerPassword };

	try {
		const maintainerDocument = await User.create(data);
		if (maintainerDocument) {
			const result = await Property.findOneAndUpdate(
				{ ownerId, 'buildings._id': buildingId },
				{ $set: { 'buildings.$.maintainerId': maintainerDocument._id } },
				{ new: true }
			);
			// role back (backlog )
			if (!result) {
				return res.status(400).json({ err: 'Invalid owner/building details' });
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
				return res.status(200).json({ maintainerDoc, maintainerPassword });
			}
		}
	} catch (err) {
		return res.status(400).json({ err: formatDbError(err) });
	}
};
