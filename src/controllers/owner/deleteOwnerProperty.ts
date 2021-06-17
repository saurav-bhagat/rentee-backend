import { Request, Response } from 'express';
import User from '../../models/user/User';
import Property from '../../models/property/property';
import Rooms from '../../models/property/rooms';

import { verifyObjectId } from '../../utils/errorUtils';
import Maintainer from '../../models/maintainer/maintainer';

import Tenant from '../../models/tenant/tenant';

export const pong = (req: Request, res: Response) => {
	res.status(200).send('pong');
};

// owner should be able to delete tenant
export const removeTenant = async (req: Request, res: Response) => {
	const { tenantId } = req.body;
	if (!tenantId || !verifyObjectId([tenantId])) {
		return res.status(403).json({ err: 'Not authorized' });
	}
	// step-1 remove tenant from user model
	const userdoc = await User.findById({ _id: tenantId });
	if (userdoc) {
		// step-2 remove tenant reference using pre remove hook in user model
		// If u wondering about remove method see user model pre remove  hook
		await userdoc.remove();
		return res.status(200).json({ msg: 'Tenant removed successfully!' });
	} else {
		return res.status(400).json({ err: 'Invalid tenant detail ' });
	}
};

// owner should be able to remove  maintainer from specific building
export const removeMaintainer = async (req: Request, res: Response) => {
	const { maintainerId, buildingId, ownerId } = req.body;
	if (!maintainerId || !buildingId || !ownerId) {
		return res.status(400).json({ err: 'Not authorized' });
	}
	// step-1 Find  maintainer user
	const maintainerUser = await User.findOne({ _id: maintainerId });
	if (maintainerUser) {
		// step-2  clear building from builindgs array in maintainer
		const result = await Maintainer.findOneAndUpdate(
			{ userId: maintainerId },
			{
				$pull: { buildings: buildingId },
			}
		);
		if (!result) return res.status(400).json({ err: 'Invalid maintainer detail' });

		// step-3 clear maintainer from building
		const newResult = await Property.findOneAndUpdate(
			{ ownerId, 'buildings._id': buildingId },
			{ $unset: { 'buildings.$.maintainerId': 'undefined' } },
			{ new: true }
		);
		if (!newResult) {
			return res.status(400).json({ err: 'Invalid owner/building detail' });
		}
		return res.status(200).json({ msg: 'Maintainer removed successfully!' });
	} else {
		return res.status(400).json({ err: 'Invalid maintainer detail ' });
	}
};

// owner should be able to remove  building
export const removeBuilding = async (req: Request, res: Response) => {
	const { buildingId, ownerId } = req.body;
	if (!buildingId || !ownerId || !verifyObjectId([buildingId])) {
		return res.status(400).json({ err: 'Not authorized' });
	}
	const tenants = await Tenant.find({ buildId: buildingId });
	// step-1 make sure no tenenat present
	// find return array of objects
	if (tenants.length == 0) {
		// step-2 if maintainer there for building update it schema
		const buildingObject = await Property.find({ ownerId, 'buildings._id': buildingId }, { 'buildings.$': 1 });
		if (buildingObject && buildingObject.length) {
			const { buildings } = buildingObject[0];
			const building = buildings[0];
			if (building.maintainerId) {
				// if maintainer is there update its building array
				// and if not there method return null no need to
				// return error
				await Maintainer.findOneAndUpdate(
					{ _id: building.maintainerId },
					{
						$pull: { buildings: buildingId },
					}
				);
			}

			// step-3 delete building from db
			await Property.findOneAndUpdate({ ownerId }, { $pull: { buildings: { _id: buildingId } } });
			return res.status(200).json({ msg: 'Building remove successfully!' });
		} else {
			return res.status(400).json({ err: 'Invalid building' });
		}
	} else {
		return res.status(400).json({ err: 'tenant present ' });
	}
};

// owner should be able to remove room
export const removeRoom = async (req: Request, res: Response) => {
	const { ownerId, roomId, buildingId } = req.body;
	if (!roomId || !ownerId || !buildingId || !verifyObjectId([roomId, ownerId, buildingId])) {
		return res.status(403).json({ err: 'Not authorized' });
	}
	const roomDetails = await Rooms.findOne({ _id: roomId });
	if (!roomDetails) {
		return res.status(400).json({ err: 'Room not present' });
	}
	if (roomDetails && roomDetails.tenants.length) {
		return res.status(400).json({ err: 'Opps there are tenants in room ' });
	}
	if (roomDetails && roomDetails.tenants.length == 0) {
		const roomDocument = await Rooms.findOneAndDelete({ _id: roomId });
		if (roomDocument) {
			const result = await Property.findOneAndUpdate(
				{ ownerId, 'buildings._id': buildingId },
				{ $pull: { 'buildings.$.rooms': roomId } }
			);
			if (!result) {
				return res.status(400).json({ err: 'Invalid owner/building detail ' });
			}
			return res.status(200).json({ msg: 'Room removed successfully!' });
		} else {
			return res.status(400).json({ err: 'Invalid room detail' });
		}
	}
};
