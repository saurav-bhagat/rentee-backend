import { ObjectId } from 'mongoose';
import { IPaymentDetail } from '../../models/payment/interface';

export interface BasicUser {
	_id?: ObjectId;
	ownerId?: ObjectId;
	name?: string;
	email?: string;
	phoneNumber?: string;
	userType?: string;
	expoPushToken?: string;
	address?: string;
}

export interface OwnerDashboardDetail {
	_id?: ObjectId;
	ownerId?: ObjectId;
	userType?: string;
	buildings?: Array<IDashboardBuild>;
	accountName?: string;
	accountNumber?: string;
	ifsc?: string;
	bankName?: string;
	beneficiaryName?: string;
	vendorId?: string;
}

export interface IDashboardBuild {
	_id: ObjectId;
	name: string;
	address: string;
	maintainer?: IDashboardMaintainer;
	rooms?: Array<IDashboardRoom>;
}

export interface IDashboardRoom {
	tenants?: Array<IDashboardTenant>;
	_id: ObjectId;
	rent: number;
	type: string;
	floor: string;
	roomNo: number;
	roomSize: string;
	isMultipleTenant: boolean;
}

export interface IDashboardTenant {
	_id: ObjectId;
	name: string;
	email: string;
	phoneNumber: string;
	joinDate: Date;
	rentDueDate: Date;
	securityAmount: number;
	paymentDetails?: Array<IPaymentDetail>;
	rent?: number;
}

export interface IDashboardMaintainer {
	_id?: ObjectId;
	name?: string;
	email?: string;
	phoneNumber?: string;
	joinDate?: Date;
}

export interface IBuildingObjectOwnerProperty {
	ownerId: ObjectId;
	buildings?: Array<IBuildingOwnerProperty>;
}

export interface IBuildingOwnerProperty {
	name?: string;
	address?: string;
	rooms?: Array<IRoomOwnerProperty>;
	maintainerDetail?: IMaintainerOwnerProperty;
}

export interface IRoomOwnerProperty {
	rent?: number;
	type?: string;
	floor?: string;
	roomNo?: number;
}

export interface IMaintainerOwnerProperty {
	email?: string;
	name?: string;
	phoneNumber?: string;
}
