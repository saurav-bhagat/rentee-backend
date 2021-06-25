import { Request, Response } from 'express';
import Room from '../../models/property/rooms';

import Property from '../../models/property/property';
import User from '../../models/user/User';

import Maintainer from '../../models/maintainer/maintainer';
import { formatDbError, isEmptyFields, verifyObjectId } from '../../utils/errorUtils';

import randomstring from 'randomstring';
import bcrypt from 'bcrypt';

import validator from 'validator';
import { ObjectId } from 'mongoose';
import { BasicUser } from './ownerTypes';

// owner add properties after signup
export const addOwnerProperty = async (req: Request, res: Response) => {
	if (req.isAuth) {
		const { ownerId, buildingsObj, name, email, password } = req.body;
		const userData = { name, email, password };
		if (!ownerId || !verifyObjectId([ownerId])) {
			return res.status(400).json({ err: 'Incorrect owner detail' });
		}

		if (isEmptyFields(userData)) {
			return res.status(400).json({ err: 'Either name/email/password is missing' });
		}

		if (!validator.isEmail(email) || password.length < 6) {
			return res.status(400).json({ err: 'Either email/password is not valid' });
		}

		// Updating Onwer basic info
		try {
			const salt = await bcrypt.genSalt();
			const hashedPassword = await bcrypt.hash(password, salt);

			const ownerBasicInfo = await User.findByIdAndUpdate(
				{ _id: ownerId },
				{
					name,
					email,
					password: hashedPassword,
				},
				{
					new: true,
					runValidators: true,
					context: 'query',
				}
			);
			if (!ownerBasicInfo) return res.status(400).json({ err: 'Invalid owner detail' });

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
							if (email && !validator.isEmail(email)) {
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

				const builidingForMaintainer = properties.buildings;

				for (let i = 0; i < builidingForMaintainer.length; i++) {
					const builiding = builidingForMaintainer[i];
					if (builiding.maintainerId) {
						const maintainerIdInBuilding = builiding.maintainerId;

						// maintainer model getting updated with maintainer-specific details if present.
						const isMaintainer = await Maintainer.findOneAndUpdate(
							{ userId: maintainerIdInBuilding },
							{ $push: { buildings: builiding._id } }
						);

						// maintainer model getting saved for the first time with maintainer-specific details.
						if (!isMaintainer) {
							const buildingIdArray: Array<ObjectId> = [];
							buildingIdArray.push(builiding._id);
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

					return res.status(200).json({ propertyDetails: result });
				}
			}
			if (ownerBasicInfo) {
				const { _id, name, email, phoneNumber, userType } = ownerBasicInfo;
				const updatedUserInfo: BasicUser = { _id, name, email, phoneNumber, userType };
				return res.status(200).json({ updatedUserInfo });
			}
		} catch (error) {
			return res.status(400).json({ err: formatDbError(error) });
		}
	} else {
		return res.status(403).json({ err: 'Not Authorized' });
	}
};
