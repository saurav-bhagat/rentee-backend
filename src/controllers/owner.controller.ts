import { Request, Response } from "express";
import Room from "../models/property/rooms";

import Property from "../models/property/property";
import User from "../models/user/User";

import Tenant from "../models/tenant/tenant";
import { formatDbError, isEmptyFields } from "../utils/errorUtils";

import randomstring from "randomstring";
import { verifyObjectId } from "../utils/errorUtils";

export class OwnerController {
	pong = (req: Request, res: Response) => {
		res.status(200).send("pong");
	};

	// owner add properties after signup
	addOwnerProperty = async (req: Request, res: Response) => {
		if (req.isAuth) {
			const { ownerId, buildingsObj } = req.body;

			if (!ownerId || !verifyObjectId([ownerId])) {
				return res.status(400).json({ err: "Incorrect owner detail" });
			}

			if (buildingsObj === undefined || buildingsObj.length === 0) {
				return res.status(400).json({ err: "Properties data is missing" });
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

		const propertyDoc = await Property.findOne({ ownerId });

		if (propertyDoc) {
			const password = randomstring.generate({ length: 6, charset: "abc" });

			const userInfo = {
				name,
				email,
				password,
				phoneNumber,
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

				for (let i = 0; i < propertyDoc.buildings.length; i += 1) {
					let building = propertyDoc.buildings[i];

					if (building._id == buildId) {
						const roomDocument = await Room.findOne({ _id: roomId });

						if (roomDocument && roomDocument._id.toString() == roomId.toString()) {
							roomDocument.tenants.push(tenantId);
							const result = await roomDocument.save();
							return res.status(200).json({ password, msg: "Tenant added successfully" });
						} else {
							return res.status(400).json({ err: "Room not found!" });
						}
					}
				}
			} catch (error) {
				return res.status(400).json({ err: formatDbError(error) });
			}
		} else {
			return res.status(400).json({ err: "Onwer not found" });
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
