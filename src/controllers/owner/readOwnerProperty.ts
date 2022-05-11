import { Request, Response } from 'express';
import { IOwner } from '../../models/owner/interface';
import Property from '../../models/property/property';
import Tenant from '../../models/tenant/tenant';
import { addMonths, compareAsc, format, getDaysInMonth, intervalToDuration, setDate } from 'date-fns';
import { v4 as uuid4 } from 'uuid';
import User from '../../models/user/User';
import { verifyObjectId } from '../../utils/errorUtils';

import { OwnerDashboardDetail, IDashboardBuild } from './ownerTypes';

import { findBuilding } from './ownerUtils';

const pushNewMonthRentInTenantRentArray = async () => {
	const tenants = await Tenant.find({});
	for (let tenant = 0; tenant < tenants.length; tenant++) {
		const { userId, lastMonthDate, actualTenantRent, rent, rentDueDate } = tenants[tenant];
		// if currentDate crosses the lastMonthDate then we have to push new ( month rent ) in rent array
		const isLastMonthDateCrossCurrentDate = compareAsc(new Date(), lastMonthDate);
		if (isLastMonthDateCrossCurrentDate === 1) {
			// find tenant push new rent in rent array and also update lastMonthDate for keeping this
			// thing consistent

			// calulate duration between two dates
			const duration: any = intervalToDuration({ start: new Date(rentDueDate), end: new Date() });

			if (duration) {
				let monthsDiff: any;

				monthsDiff = duration.years * 12 + duration.months + 1;

				const tempRentArray = [...rent];
				let tempRentDueDate = rentDueDate;
				while (monthsDiff--) {
					const month = format(new Date(tempRentDueDate), 'MMMM');
					tempRentArray.push({
						_id: uuid4(),
						month,
						amount: actualTenantRent,
						isPaid: false,
						rentDueDate: addMonths(tempRentDueDate, 1),
					});
					tempRentDueDate = addMonths(tempRentDueDate, 1);
				}
				// const noOfDayInMonth = getDaysInMonth(new Date(tempRentDueDate));
				// const newLastDateMonth = setDate(new Date(tempRentDueDate), noOfDayInMonth);
				const data = {
					rentDueDate: tempRentDueDate,
					rent: tempRentArray,
					lastMonthDate: tempRentDueDate,
				};
				await Tenant.findOneAndUpdate({ userId }, data, { new: true });
			}
		}
	}
};

// owner dashboard details
export const getAllOwnerBuildings = async (req: Request, res: Response) => {
	if (req.isAuth) {
		const { ownerId } = req.body;
		await pushNewMonthRentInTenantRentArray();
		if (!ownerId || !verifyObjectId([ownerId])) {
			return res.status(400).json({ err: 'Invalid owner' });
		}

		const owner = await User.findOne({ _id: ownerId, userType: 'Owner' });
		if (owner) {
			const ownerDetails = await Property.findOne({ ownerId })
				.populate({
					path: 'buildings.rooms',
					populate: {
						path: 'tenants',
						populate: {
							path: 'userId payments',
						},
					},
				})
				.populate({
					path: 'buildings.maintainerId',
					populate: {
						path: 'userId',
					},
				})
				.populate({
					path: 'ownerInfo',
				});
			if (ownerDetails) {
				const { _id, ownerId, buildings, ownerInfo } = ownerDetails;

				const tempbuildingArray: Array<IDashboardBuild> = [];
				for (let i = 0; i < buildings.length; i++) {
					const tempBuild: IDashboardBuild = findBuilding(buildings[i]);
					tempbuildingArray.push(tempBuild);
				}

				let ownerDashboardResult: OwnerDashboardDetail = {};
				if (ownerInfo) {
					const {
						accountName,
						accountNumber,
						ifsc,
						bankName,
						beneficiaryName,
						vendorId,
					} = (ownerInfo as unknown) as IOwner;

					ownerDashboardResult = {
						_id,
						ownerId,
						buildings: tempbuildingArray,
						accountName,
						accountNumber,
						ifsc,
						bankName,
						beneficiaryName,
						vendorId,
					};
					return res.status(200).json({ ownerDashboardResult });
				}
				ownerDashboardResult = {
					_id,
					ownerId,
					buildings: tempbuildingArray,
				};
				return res.status(200).json({ ownerDashboardResult });
			} else {
				const { _id, name, email, phoneNumber, userType, address } = owner;
				const ownerDashboardResult = {
					ownerId: _id,
					email,
					name,
					phoneNumber,
					userType,
					address,
					buildings: [],
				};
				// TODO:  send userID for the tenants
				return res.status(200).json({ ownerDashboardResult });
			}
		} else {
			return res.status(400).json({ err: 'Invalid Owner' });
		}
	} else {
		return res.status(403).json({ err: 'Not Authorized' });
	}
};
