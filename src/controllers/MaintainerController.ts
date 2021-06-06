import Maintainer from '../models/maintainer/maintainer';
import Property from '../models/property/property';

import Rooms from '../models/property/rooms';
import { IUser } from '../models/user/interface';

import { ITenant } from '../models/tenant/interface';
import { IBuilding } from '../models/property/interface';

export interface maintainerObject {
	ownerName?: string;
	ownerEmail?: string;
	ownerPhoneNumber?: string;
	maintainerName?: string;
	maintainerEmail?: string;
	maintainerPhoneNumber?: string;
	build?: Array<buildingObject>;
}

export interface buildingObject {
	buildingName?: string;
	buildingAddress?: string;
	rooms?: Array<roomObject>;
}

export interface roomObject {
	roomType?: string;
	floor?: string;
	roomNo?: number;
	tenants?: Array<tenantObject>;
}

export interface tenantObject {
	tenantName?: string;
	tenantEmail?: string;
	tenantPhoneNumber?: string;
}

export class MaintainerController {
	findMaintainer = async (userDocument: IUser): Promise<any> => {
		const maintainerDoc = await Maintainer.findOne({ userId: userDocument._id })
			.populate({
				path: 'userId',
			})
			.populate({
				path: 'ownerId',
			});

		if (maintainerDoc == null) {
			throw new Error('Maintainer doc not found!');
		}
		const ownerId = ((maintainerDoc?.ownerId as unknown) as IUser)._id;
		const property = await Property.findOne({ ownerId: ownerId });

		const builds: Array<IBuilding> = [];
		let maintainerResObj: maintainerObject = {};

		if (property && maintainerDoc) {
			const buildings = property.buildings;

			for (let i = 0; i < buildings.length; i++) {
				const build = buildings[i];

				if (build.maintainerId.toString() == userDocument._id.toString()) {
					builds.push(build);
				}
			}

			const ownerDetails = (maintainerDoc.ownerId as unknown) as IUser;
			const { name: ownerName, email: ownerEmail, phoneNumber: ownerPhoneNumber } = ownerDetails;

			const maintainerDetails = (maintainerDoc.userId as unknown) as IUser;
			const {
				name: maintainerName,
				email: maintainerEmail,
				phoneNumber: maintainerPhoneNumber,
			} = maintainerDetails;

			const buildingInfoForMaintainer: Array<buildingObject> = [];

			for (let i = 0; i < builds.length; i++) {
				let buildingInfo: buildingObject = {};
				const roomInfoArray: Array<roomObject> = [];

				const b = builds[i];
				const { name: buildingName, address: buildingAddress } = builds[i];

				const roomArray = b.rooms;
				for (let j = 0; j < roomArray.length; j++) {
					let roomInfo: roomObject = {};
					const _id = roomArray[j];

					const result = await Rooms.findOne(_id).populate({
						path: 'tenants',
						populate: {
							path: 'userId',
						},
					});

					if (result) {
						const { type: roomType, floor, roomNo } = result;

						const tenantsTempObj = (result.tenants as unknown) as Array<ITenant>;
						const tenantInfoArray: Array<tenantObject> = [];

						if (tenantsTempObj.length) {
							for (let k = 0; k < tenantsTempObj.length; k++) {
								const userInfoInTenantAsUserId = (tenantsTempObj[i].userId as unknown) as IUser;
								let tenantInfo: tenantObject = {};

								const {
									name: tenantName,
									email: tenantEmail,
									phoneNumber: tenantPhoneNumber,
								} = userInfoInTenantAsUserId;

								tenantInfo = {
									tenantName,
									tenantEmail,
									tenantPhoneNumber,
								};

								tenantInfoArray.push(tenantInfo);
							}
						}

						roomInfo = {
							roomType,
							floor,
							roomNo,
							tenants: tenantInfoArray,
						};

						roomInfoArray.push(roomInfo);
					}
				}

				buildingInfo = {
					buildingAddress,
					buildingName,
					rooms: roomInfoArray,
				};

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

		return new Promise((resolve) => {
			resolve({
				maintainerResObj,
			});
		});
	};
}
