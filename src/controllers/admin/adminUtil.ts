import { ObjectId } from 'mongoose';
import { IMaintainer } from '../../models/maintainer/interface';
import { IOwner } from '../../models/owner/interface';
import { IPayment } from '../../models/payment/interface';
import { IBuilding, IProperty, IRooms } from '../../models/property/interface';
import { IReceipt } from '../../models/receipt/interface';
import { ITenant } from '../../models/tenant/interface';
import { IUser } from '../../models/user/interface';
import {
	IBuildingInfoForAdmin,
	IMaintainerInfoForAdmin,
	IOwnerForAdmin,
	IOwnerInfoForAdmin,
	IPaymentForAdmin,
	IReceiptForAdmin,
	IRoomInfoForAdmin,
	ITenantInfoForAdmin,
} from './adminType';

export const findReceipts = (receipts: ObjectId[]) => {
	const receiptInfoArray: Array<IReceiptForAdmin> = [];
	if (receipts && receipts.length) {
		for (let receipt = 0; receipt < receipts.length; receipt++) {
			const { _id, amount, month, mode } = (receipts[receipt] as unknown) as IReceipt;
			receiptInfoArray.push({ _id, amount, month, mode });
		}
	}
	return receiptInfoArray;
};

export const findPayments = (payments: ObjectId[]) => {
	const paymentInfoArray: Array<IPaymentForAdmin> = [];
	if (payments && payments.length) {
		for (let payment = 0; payment < payments.length; payment++) {
			const {
				_id,
				currency,
				gatewayName,
				respCode,
				respMsg,
				bankName,
				status,
				bankTxnId,
				orderId,
				txnAmount,
				txnDate,
				txnId,
				paymentMode,
			} = (payments[payment] as unknown) as IPayment;
			paymentInfoArray.push({
				_id,
				currency,
				gatewayName,
				respCode,
				respMsg,
				status,
				bankName,
				bankTxnId,
				orderId,
				txnAmount,
				txnDate,
				txnId,
				paymentMode,
			});
		}
	}
	return paymentInfoArray;
};

export const findTenants = (tenants: ObjectId[]) => {
	const ITenantInfoForAdminArray: Array<ITenantInfoForAdmin> = [];
	if (tenants && tenants.length) {
		for (let tenant = 0; tenant < tenants.length; tenant++) {
			const { receipts, payments, _id, userId, joinDate, rentDueDate, securityAmount } = (tenants[
				tenant
			] as unknown) as ITenant;
			const receiptInfoArray: Array<IReceiptForAdmin> = findReceipts(receipts);

			const paymentInfoArray: Array<IPaymentForAdmin> = findPayments(payments);

			const { name, email, phoneNumber } = (userId as unknown) as IUser;

			ITenantInfoForAdminArray.push({
				_id,
				name,
				email,
				phoneNumber,
				joinDate,
				rentDueDate,
				securityAmount,
				receipts: receiptInfoArray,
				payments: paymentInfoArray,
			});
		}
	}
	return ITenantInfoForAdminArray;
};

export const findRooms = (rooms: ObjectId[]) => {
	const IRoomInfoForAdminArray: Array<IRoomInfoForAdmin> = [];
	if (rooms && rooms.length) {
		for (let room = 0; room < rooms.length; room++) {
			const { tenants, _id, rent, type, floor, roomNo } = (rooms[room] as unknown) as IRooms;
			const ITenantInfoForAdminArray: Array<ITenantInfoForAdmin> = findTenants(tenants);
			IRoomInfoForAdminArray.push({ _id, rent, type, floor, roomNo, tenants: ITenantInfoForAdminArray });
		}
	}
	return IRoomInfoForAdminArray;
};

export const findBuildings = (buildings: IBuilding[]): IBuildingInfoForAdmin[] => {
	const IBuildingInfoForAdminArray: Array<IBuildingInfoForAdmin> = [];
	if (buildings && buildings.length) {
		for (let building = 0; building < buildings.length; building++) {
			const { _id, name, address, maintainerId, rooms } = buildings[building];
			let maintainerDetails: IMaintainerInfoForAdmin = {};
			if (maintainerId) {
				const { _id, userId, joinDate } = (maintainerId as unknown) as IMaintainer;
				const { name, email, phoneNumber } = (userId as unknown) as IUser;
				maintainerDetails = { _id, joinDate, name, email, phoneNumber };
			}
			const IRoomInfoForAdminArray: Array<IRoomInfoForAdmin> = findRooms(rooms);

			IBuildingInfoForAdminArray.push({
				_id,
				name,
				address,
				mainTainerInfo: maintainerDetails,
				rooms: IRoomInfoForAdminArray,
			});
		}
	}
	return IBuildingInfoForAdminArray;
};

export const findAllOwner = (propertyDoc: IProperty): IOwnerForAdmin => {
	let ownerInfoObject: IOwnerForAdmin = {};
	const { _id, ownerId, ownerInfo, buildings } = propertyDoc;
	const { _id: ownerUserId, name, email, phoneNumber } = (ownerId as unknown) as IUser;

	let ownerDetail: IOwnerInfoForAdmin = { _id: ownerUserId, name, email, phoneNumber };
	if (ownerInfo) {
		const { accountName, accountNumber, ifsc, bankName, beneficiaryName } = (ownerInfo as unknown) as IOwner;
		ownerDetail = { ...ownerDetail, accountName, accountNumber, ifsc, bankName, beneficiaryName };
	}
	const IBuildingInfoForAdminArray: Array<IBuildingInfoForAdmin> = findBuildings(buildings);

	ownerInfoObject = { _id, ownerInfo: ownerDetail, buildings: IBuildingInfoForAdminArray };
	return ownerInfoObject;
};
