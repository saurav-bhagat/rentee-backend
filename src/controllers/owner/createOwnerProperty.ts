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

// owner add properties after signup
export const addOwnerProperty = async (req: Request, res: Response) => {
	if (req.isAuth) {
		const { ownerId, buildingsObj, name, email, password } = req.body;
		const userData = { name, email, password };
		if (!ownerId || !verifyObjectId([ownerId])) {
			return res.status(400).json({ err: 'Incorrect owner detail' });
		}

		if (buildingsObj === undefined || buildingsObj.length === 0) {
			return res.status(400).json({ err: 'Properties data is missing' });
		}

		if (isEmptyFields(userData)) {
			return res.status(400).json({ err: 'All fields are mandatory!' });
		}

		if (!validator.isEmail(email) || password.length < 6) {
			return res.status(400).json({ err: 'Either email/password/phonenumber is not valid' });
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
			if (!ownerBasicInfo) return res.status(400).json({ err: 'failed to update owner basic info' });
			const property = new Property({ ownerId });

			// loop over the buildings
			for (let i = 0; i < buildingsObj.length; i += 1) {
				const tempRooms: Array<ObjectId> = [];
				const building = buildingsObj[i];
				const { name: buildingName, address: buildingAddress } = building;

				// loop over rooms in a building
				for (let j = 0; j < building.rooms.length; j += 1) {
					const room = building.rooms[j];
					const roomDocument = await Room.create(room);
					tempRooms.push(roomDocument._id);
				}
				// if maintainer is there for building from frontend
				if (building.maintainerDetail) {
					let maintainerInfo = building.maintainerDetail;

					const isMaintainerPresent = await User.findOne({ phoneNumber: maintainerInfo.phoneNumber });
					// if maintainer is already registered then only store its id in building property
					if (isMaintainerPresent) {
						property.buildings.push({
							name: buildingName,
							address: buildingAddress,
							rooms: tempRooms,
							maintainerId: isMaintainerPresent._id,
						});
					} else {
						// create new maintainer
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

			return res.status(200).json({ properties });
		} catch (error) {
			return res.status(400).json({ err: formatDbError(error) });
		}
	} else {
		return res.status(403).json({ err: 'Not Authorized' });
	}
};
