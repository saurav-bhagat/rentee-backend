import { Request, Response } from "express";
import Room from "../models/property/rooms";

import Property from "../models/property/property";
import User from "../models/user/User";

import Tenant from "../models/tenant/tenant";
import { formatDbError, isEmptyFields } from "../utils/errorUtils";

import randomstring from "randomstring";
import { verifyObjectId } from "../utils/errorUtils";
import bcrypt from "bcrypt";

import validator from "validator";
import mongoose from "mongoose";
export class OwnerController {
	pong = (req: Request, res: Response) => {
		res.status(200).send("pong");
	};

	// owner add properties after signup
	addOwnerProperty = async (req: Request, res: Response) => {
		if (req.isAuth) {
			const { ownerId, buildingsObj, name, email, password } = req.body;
			const userData = { name, email, password };
			if (!ownerId || !verifyObjectId([ownerId])) {
				return res.status(400).json({ err: "Incorrect owner detail" });
			}

			if (buildingsObj === undefined || buildingsObj.length === 0) {
				return res.status(400).json({ err: "Properties data is missing" });
			}

			if (isEmptyFields(userData)) {
				return res.status(400).json({ err: "All fields are mandatory!" });
			}

			if (!validator.isEmail(email) || password.length < 6) {
				return res.status(400).json({ err: "Either email/password/phonenumber is not valid" });
			}
			try {
				const salt = await bcrypt.genSalt();
				const hashedPassword = await bcrypt.hash(password, salt);

				const ownerUpdatedDoc = await User.findByIdAndUpdate(
					{ _id: ownerId },
					{ name, email, password: hashedPassword, userType: "Owner" },
					{
						new: true,
						runValidators: true,
						context: "query",
					}
				);
			} catch (error) {
				return res.status(400).json({ err: formatDbError(error) });
			}

			const property = new Property({ ownerId });

			try {
				for (let i = 0; i < buildingsObj.length; i += 1) {
					let tempRooms: Array<Object> = [];
					let building = buildingsObj[i];
					const { name: buildingName, address: buildingAddress } = building;

					for (let j = 0; j < building.rooms.length; j += 1) {
						const room = building.rooms[j];
						const roomDocument = await Room.create(room);
						tempRooms.push(roomDocument._id);
					}
					property.buildings.push({
						name: buildingName,
						address: buildingAddress,
						rooms: tempRooms,
					});
				}
				let properties = await property.save();
				return res.status(200).json({ properties });
			} catch (error) {
				return res.status(400).json({ err: formatDbError(error) });
			}
		} else {
			return res.status(403).json({ err: "Not Authorized" });
		}
	};

	// owner add tenant to tenant array
	tenantRegistration = async (req: Request, res: Response) => {
		let { name, email, phoneNumber, securityAmount, ownerId, buildId, roomId } = req.body;

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
			return res.status(400).json({ err: "All fields are mandatory!" });
		}

		if (!verifyObjectId([ownerId, buildId, roomId])) {
			return res.status(400).json({ err: "Incorrect details sent" });
		}
		//Finding building with ownerId and roomId
		const building = await Property.aggregate([
			{ $match: { ownerId: new mongoose.Types.ObjectId(ownerId) } },
			{ $unwind: "$buildings" },
			{ $match: { "buildings._id": new mongoose.Types.ObjectId(buildId) } },
		]);

		if (building.length == 0) {
			return res.status(400).json({ err: "Unable to register tenant" });
		}

		const password = randomstring.generate({ length: 6, charset: "abc" });

		const userInfo = {
			name,
			email,
			password,
			phoneNumber,
			userType: "Tenant",
		};

		try {
			// Creating a tenant User
			const userDoc = await User.create(userInfo);
			const userId = userDoc._id;

			const joinDate = new Date();
			let nextMonthDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
			//keep consistent date format
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
				const result = await roomDocument.save();
				return res.status(200).json({ password, msg: "Tenant added successfully" });
			} else {
				return res.status(400).json({ err: "Room not found!" });
			}
		} catch (error) {
			return res.status(400).json({ err: formatDbError(error) });
		}
	};

	// owner dashboard details
	getAllOwnerBuildings = (req: Request, res: Response) => {
		const { ownerId } = req.body;
		if (!ownerId || !verifyObjectId([ownerId])) {
			return res.status(400).json({ err: "Incorrect owner detail" });
		}
		if (req.isAuth) {
			Property.findOne({ ownerId })
				.populate({
					path: "buildings.rooms",
					populate: {
						path: "tenants",
						populate: {
							path: "userId",
						},
					},
				})
				.then(data => {
					return res.status(200).json({ ownerBuildingDetails: data });
				});
		} else {
			return res.status(403).json({ err: "Not Authorized" });
		}
	};
}
