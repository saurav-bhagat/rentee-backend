import Maintainer from '../../models/maintainer/maintainer';
import Property from '../../models/property/property';

import Rooms from '../../models/property/rooms';
import { IUser } from '../../models/user/interface';

import { ITenant } from '../../models/tenant/interface';
import { IBuilding, IRooms } from '../../models/property/interface';

import { ObjectId } from 'mongoose';
import { ITenantObject, IRoomObject, IBuildingObject, IMaintainerObject } from './maintainerTypes';

export const getTenantInfo = (room: IRooms) => {
	const tenants = room.tenants as unknown as Array<ITenant>;
	const tenantInfoArray: Array<ITenantObject> = [];

	if (tenants.length) {
		for (let k = 0; k < tenants.length; k++) {
			const tenantAsUser = tenants[k].userId as unknown as IUser;
			let tenantInfo: ITenantObject = {};

			const { name: tenantName, email: tenantEmail, phoneNumber: tenantPhoneNumber } = tenantAsUser;

			tenantInfo = {
				tenantName,
				tenantEmail,
				tenantPhoneNumber,
			};

			tenantInfoArray.push(tenantInfo);
		}
	}

	return tenantInfoArray;
};
export const getRoomInfo = async (roomId: ObjectId) => {
	let roomInfo: IRoomObject = {};
	const _id = roomId;

	const room = await Rooms.findOne(_id).populate({
		path: 'tenants',
		populate: {
			path: 'userId',
		},
	});

	if (room) {
		const { type: roomType, floor, roomNo } = room;
		const tenantInfoArray = getTenantInfo(room);

		roomInfo = {
			roomType,
			floor,
			roomNo,
			tenants: tenantInfoArray,
		};
	}
	return roomInfo;
};
export const getBuildingInfo = async (building: IBuilding) => {
	let buildingInfo: IBuildingObject = {};
	const { name: buildingName, address: buildingAddress } = building;

	const roomInfoArray: Array<IRoomObject> = [];

	const roomArray = building.rooms;
	for (let j = 0; j < roomArray.length; j++) {
		const roomInfo = await getRoomInfo(roomArray[j]);
		roomInfoArray.push(roomInfo);
	}

	buildingInfo = {
		buildingAddress,
		buildingName,
		rooms: roomInfoArray,
	};
	return buildingInfo;
};
export const findMaintainer = async (userDocument: IUser): Promise<any> => {
	const maintainerDoc = await Maintainer.findOne({ userId: userDocument._id })
		.populate({ path: 'userId' })
		.populate({ path: 'ownerId' });

	if (maintainerDoc == null) {
		throw new Error('Maintainer doc not found!');
	}

	const ownerId = (maintainerDoc?.ownerId as unknown as IUser)._id;
	const property = await Property.findOne({ ownerId: ownerId });

	let maintainerResObj: IMaintainerObject = {};

	if (property && maintainerDoc) {
		let builds: Array<IBuilding> = [];
		builds = property.buildings.filter((building) =>
			building.maintainerId ? building.maintainerId.toString() === maintainerDoc._id.toString() : null
		);

		const ownerDetails = maintainerDoc.ownerId as unknown as IUser;

		const { name: ownerName, email: ownerEmail, phoneNumber: ownerPhoneNumber } = ownerDetails;
		const maintainerDetails = maintainerDoc.userId as unknown as IUser;

		const { name: maintainerName, email: maintainerEmail, phoneNumber: maintainerPhoneNumber } = maintainerDetails;
		const buildingInfoForMaintainer: Array<IBuildingObject> = [];

		for (let i = 0; i < builds.length; i++) {
			const buildingInfo = await getBuildingInfo(builds[i]);
			buildingInfoForMaintainer.push(buildingInfo);
		}

		maintainerResObj = {
			maintainerEmail,
			maintainerName,
			maintainerPhoneNumber,
			ownerEmail,
			ownerName,
			ownerPhoneNumber,
			build: buildingInfoForMaintainer,
		};
	} else {
		throw new Error('Property doc not found!');
	}
	const userType = userDocument.userType;
	return new Promise((resolve) => {
		resolve({
			maintainerResObj,
			userType,
		});
	});
};
