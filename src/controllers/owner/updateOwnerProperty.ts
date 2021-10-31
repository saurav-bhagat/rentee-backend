import { Request, Response } from 'express';
import Property from '../../models/property/property';

import Rooms from '../../models/property/rooms';
import { verifyObjectId } from '../../utils/errorUtils';
import validator from 'validator';
import { addBuildingsUtil, addMaintainerUtil, addRoomsUtil } from './ownerUtils';

export const updateOwnerBuilding = async (req: Request, res: Response) => {
	const { ownerId, buildingId, name, address } = req.body;

	if (!req.isAuth || !ownerId || !buildingId || !verifyObjectId([ownerId, buildingId])) {
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
	if (req.isAuth) {
		const { roomId, roomType: type, roomNo, floor, rent, roomSize, isMultipleTenant } = req.body;

		if (!roomId || !verifyObjectId([roomId])) {
			return res.status(403).json({ err: 'Room Details Missing' });
		}
		const data: any = {};
		if (roomNo) data['roomNo'] = roomNo;
		if (type) data['type'] = type;

		if (floor) data['floor'] = floor;
		if (rent) data['rent'] = rent;
		if (roomSize) data['roomSize'] = roomSize;
		if (isMultipleTenant === true || isMultipleTenant === false) data['isMultipleTenant'] = isMultipleTenant;
		if (!(Object.keys(data).length === 0)) {
			const result = await Rooms.findOneAndUpdate({ _id: roomId }, data, { new: true });
			if (!result) return res.status(400).json({ err: 'Invalid room detail' });
			return res.status(200).json({ result, msg: 'Room detail updated successfully!' });
		} else {
			return res.status(400).json({ err: 'Updating field mandatory!' });
		}
	} else {
		return res.status(403).json({ err: 'Not Authorized' });
	}
};

export const addBuildings = (req: Request, res: Response) => {
	const { ownerId, buildings } = req.body;
	if (!req.isAuth || !ownerId || !verifyObjectId([ownerId])) {
		return res.status(403).json({ err: 'Not Authorized' });
	}

	if (!buildings || buildings.length === 0) {
		return res.status(400).json({ err: 'Updating field mandatory!' });
	}

	const addBuildigDetails = { ownerId, buildings };

	addBuildingsUtil(addBuildigDetails)
		.then((data) => {
			if (data) {
				return res.status(200).json({ data });
			}
			return res.status(400).json({ err: 'Invalid owner detail' });
		})
		.catch((err) => {
			return res.status(400).json({ err });
		});
};

export const addRooms = (req: Request, res: Response) => {
	if (req.isAuth) {
		const { ownerId, buildingId, rooms } = req.body;
		if (!ownerId || !buildingId || !verifyObjectId([ownerId, buildingId])) {
			return res.status(403).json({ err: 'Owner/Building details missing' });
		}
		if (!rooms || rooms.length == 0) {
			return res.status(400).json({ err: 'Missing fields to update' });
		}
		const addRoomDetail = { ownerId, buildingId, rooms };
		addRoomsUtil(addRoomDetail)
			.then((data) => {
				if (data) {
					return res.status(200).json({ msg: 'Room added succesfully!' });
				}
				return res.status(400).json({ err: 'Invalid owner/building detail' });
			})
			.catch((err) => {
				return res.status(400).json({ err });
			});
	} else {
		return res.status(403).json({ err: 'Not Authorized' });
	}
};

export const addMaintainer = (req: Request, res: Response) => {
	const { ownerId, buildingId, email, phoneNumber, name } = req.body;
	if (!req.isAuth || !ownerId || !buildingId || !verifyObjectId([ownerId, buildingId])) {
		res.status(403).json({ err: 'Not authorized' });
	}

	if (!validator.isEmail(email) || !validator.isMobilePhone(`+91${phoneNumber}`, 'en-IN')) {
		res.status(400).json({ err: 'Either email/phoneNumber not valid' });
	}
	const addMaintainerDetails = { ownerId, buildingId, email, phoneNumber, name };
	addMaintainerUtil(addMaintainerDetails)
		.then((data) => {
			res.status(200).json({ msg: 'Maintainer added successfully!' });
		})
		.catch((err) => {
			res.status(400).json({ err });
		});
};
