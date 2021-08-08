import { Request, Response } from 'express';
import Room from '../../models/property/rooms';

import Property from '../../models/property/property';
import User from '../../models/user/User';

import Maintainer from '../../models/maintainer/maintainer';
import { formatDbError, verifyObjectId } from '../../utils/errorUtils';

import randomstring from 'randomstring';
import bcrypt from 'bcrypt';

import validator from 'validator';
import { ObjectId } from 'mongoose';
import { BasicUser } from './ownerTypes';

// owner add properties after signup
export const addOwnerProperty = async (req: Request, res: Response) => {
	if (req.isAuth) {
		const { ownerId, buildingsObj } = req.body;

		if (!ownerId || !verifyObjectId([ownerId])) {
			return res.status(400).json({ err: 'Incorrect owner detail' });
		}

		try {
			if (buildingsObj !== undefined && buildingsObj.length !== 0) {
				// Create property for owner
				const property = new Property({ ownerId });

				for (let i = 0; i < buildingsObj.length; i += 1) {
					const tempRooms: Array<ObjectId> = [];
					const building = buildingsObj[i];
					const { name: buildingName, address: buildingAddress } = building;

					// if room there
					if (building.rooms && building.rooms.length) {
						for (let j = 0; j < building.rooms.length; j += 1) {
							const room = building.rooms[j];
							const roomDocument = await Room.create(room);
							tempRooms.push(roomDocument._id);
						}
					}

					// if maintainer is there for building from frontend
					if (building.maintainerDetail && Object.keys(building.maintainerDetail).length !== 0) {
						let maintainerInfo = building.maintainerDetail;

						const { email: maintainerEmail, phoneNumber: maintainerPhone } = maintainerInfo;

						if (maintainerPhone && !validator.isMobilePhone(maintainerPhone)) {
							return res.status(400).json({ err: `Invalid maintainer phone number ${maintainerPhone}` });
						}
						const isMaintainerPresent = await User.findOne({
							phoneNumber: maintainerPhone,
							userType: 'Maintainer',
						});
						// if maintainer is already register then only assign the id of him/her in building
						if (isMaintainerPresent) {
							property.buildings.push({
								name: buildingName,
								address: buildingAddress,
								rooms: tempRooms,
								maintainerId: isMaintainerPresent._id,
							});
						} else {
							// create new maintainer
							if (maintainerEmail && !validator.isEmail(maintainerEmail)) {
								return res.status(400).json({ err: `Invalid maintainer email ${maintainerEmail}` });
							}
							const maintainerPassword = randomstring.generate({ length: 6, charset: 'abc' });
							const userType = 'Maintainer';
							const password = maintainerPassword;
							maintainerInfo = { ...maintainerInfo, userType, password };
							const userDocOfMaintainer = await User.create(maintainerInfo);
							property.buildings.push({
								name: buildingName,
								address: buildingAddress,
								rooms: tempRooms,
								maintainerId: userDocOfMaintainer._id,
							});
						}
					}
					// if maintainer is not there from frontend
					else {
						property.buildings.push({
							name: buildingName,
							address: buildingAddress,
							rooms: tempRooms,
						});
					}
				}
				const properties = await property.save();

				// maintainer model getting updated with maintainer-specific details

				const buildingForMaintainer = properties.buildings;

				for (let i = 0; i < buildingForMaintainer.length; i++) {
					const building = buildingForMaintainer[i];
					if (building.maintainerId) {
						const maintainerIdInBuilding = building.maintainerId;

						// maintainer model getting updated with maintainer-specific details if present.
						const isMaintainer = await Maintainer.findOneAndUpdate(
							{ userId: maintainerIdInBuilding },
							{ $push: { buildings: building._id } }
						);

						// maintainer model getting saved for the first time with maintainer-specific details.
						if (!isMaintainer) {
							const buildingIdArray: Array<ObjectId> = [];
							buildingIdArray.push(building._id);
							const doc = {
								ownerId,
								userId: maintainerIdInBuilding,
								joinDate: new Date(),
								buildings: buildingIdArray,
							};
							await Maintainer.create(doc);
						}
					}
				}
				// Replace maintainer id
				const propertydoc = await Property.findOne({ ownerId });
				if (propertydoc) {
					const { buildings } = propertydoc;
					for (let i = 0; i < buildings.length; i++) {
						const { maintainerId } = buildings[i];
						if (maintainerId) {
							const maintainerDoc = await Maintainer.findOne({ userId: maintainerId });
							if (maintainerDoc) {
								const { _id } = maintainerDoc;
								propertydoc.buildings[i].maintainerId = _id;
							}
						}
					}
					const result = await propertydoc.save();

					return res.status(200).json({ msg: 'Building details added successfully!' });
				}
			}
		} catch (error) {
			return res.status(400).json({ err: formatDbError(error) });
		}
	} else {
		return res.status(403).json({ err: 'Not Authorized' });
	}
};
