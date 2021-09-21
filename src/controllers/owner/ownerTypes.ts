import { ObjectId } from 'mongoose';

export interface BasicUser {
	_id?: ObjectId;
	ownerId?: ObjectId;
	name?: string;
	email?: string;
	phoneNumber?: string;
	userType?: string;
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
}

export interface IDashboardTenant {
	_id: ObjectId;
	name: string;
	email: string;
	phoneNumber: string;
	joinDate: Date;
	rentDueDate: Date;
	securityAmount: number;
}

export interface IDashboardMaintainer {
	_id?: ObjectId;
	name?: string;
	email?: string;
	phoneNumber?: string;
	joinDate?: string;
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
