import { Request, Response } from 'express';
import Property from '../../models/property/property';

import Rooms from '../../models/property/rooms';
import { verifyObjectId } from '../../utils/errorUtils';
import validator from 'validator';
import { addBuildingsUtil, addMaintainerUtil, addRoomsUtil } from './ownerUtils';

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
		return res.status(200).json({ result, msg: 'Building detail updated successfully!' });
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
		return res.status(200).json({ result, msg: 'Room detail updated successfully!' });
	} else {
		return res.status(400).json({ err: 'Updating field mandatory!' });
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

	const addBuildigDetails = { ownerId, buildings };

	const result = await addBuildingsUtil(addBuildigDetails);
	if (result) {
		return res.status(200).json({ msg: 'Building added successfully!' });
	}
	return res.status(400).json({ err: 'Invalid owner' });
};

export const addRooms = async (req: Request, res: Response) => {
	const { ownerId, buildingId, rooms } = req.body;
	if (!ownerId || !buildingId || !verifyObjectId([ownerId, buildingId])) {
		return res.status(403).json({ err: 'Not Authorized' });
	}
	if (!rooms || rooms.length == 0) {
		return res.status(400).json({ err: 'Updating field mandatory!' });
	}
	const addRoomDetail = { ownerId, buildingId, rooms };
	const result = await addRoomsUtil(addRoomDetail);
	if (result) {
		return res.status(200).json({ msg: 'Room added succesfully!' });
	}
	return res.status(400).json({ err: 'Invalid owner/building detail' });
};

export const addMaintainer = (req: Request, res: Response) => {
	const { ownerId, buildingId, email, phoneNumber, name } = req.body;
	if (!ownerId || !buildingId || !verifyObjectId([ownerId, buildingId])) {
		res.status(403).json({ err: 'Not authorized' });
	}

	if (!validator.isEmail(email) || !validator.isMobilePhone(phoneNumber)) {
		res.status(400).json({ err: 'Either email/phoneNumber not valid' });
	}
	const addMaintainerDetails = { ownerId, buildingId, email, phoneNumber, name };
	addMaintainerUtil(addMaintainerDetails)
		.then((data) => {
			res.status(200).json({ msg: 'Mainter added successfully!' });
		})
		.catch((err) => {
			res.status(400).json({ err });
		});
};
