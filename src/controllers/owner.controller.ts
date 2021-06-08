import { Request, Response } from 'express';
import Room from '../models/property/rooms';

import Property from '../models/property/property';
import User from '../models/user/User';

import Tenant from '../models/tenant/tenant';
import Maintainer from '../models/maintainer/maintainer';

import { formatDbError, isEmptyFields, verifyObjectId } from '../utils/errorUtils';
import randomstring from 'randomstring';

import bcrypt from 'bcrypt';
import validator from 'validator';

import mongoose, { ObjectId } from 'mongoose';
import { IProperty } from '../models/property/interface';

import { IUser } from '../models/user/interface';

export class OwnerController {
	pong = (_req: Request, res: Response): void => {
		res.status(200).send('pong');
	};

	// owner add properties after signup
	addOwnerProperty = async (req: Request, res: Response) => {
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

				await User.findByIdAndUpdate(
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

				const property = new Property({ ownerId });

				for (let i = 0; i < buildingsObj.length; i += 1) {
					const tempRooms: Array<ObjectId> = [];
					const building = buildingsObj[i];
					const { name: buildingName, address: buildingAddress } = building;

					for (let j = 0; j < building.rooms.length; j += 1) {
						const room = building.rooms[j];
						const roomDocument = await Room.create(room);
						tempRooms.push(roomDocument._id);
					}
					// if maintainer is there for building from frontend
					if (building.maintainerDetail) {
						let maintainerInfo = building.maintainerDetail;

						const isMaintainerPresent = await User.findOne({ phoneNumber: maintainerInfo.phoneNumber });
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
							const maintainerDoc = await Maintainer.create(doc);
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

	// owner add tenant to tenant array
	tenantRegistration = async (req: Request, res: Response): Promise<Response<void>> => {
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

	// owner dashboard details
	getAllOwnerBuildings = (req: Request, res: Response) => {
		const { ownerId } = req.body;
		if (!ownerId || !verifyObjectId([ownerId])) {
			return res.status(400).json({ err: 'Incorrect owner detail' });
		}
		if (req.isAuth) {
			Property.findOne({ ownerId })
				.populate({
					path: 'buildings.rooms',
					populate: {
						path: 'tenants',
						populate: {
							path: 'userId',
						},
					},
				})
				.then((data) => {
					return res.status(200).json({ ownerBuildingDetails: data });
				});
		} else {
			return res.status(403).json({ err: 'Not Authorized' });
		}
	};

	findOwner = async (userDocument: IUser): Promise<IProperty | null> => {
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
}
