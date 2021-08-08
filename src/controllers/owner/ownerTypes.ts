import { ObjectId } from 'mongoose';

export interface BasicUser {
	_id?: ObjectId;
	name?: string;
	email?: string;
	phoneNumber?: string;
	userType?: string;
}

export interface OwnerDashboardDetail {
	_id: ObjectId;
	ownerId: ObjectId;
	buildings?: Array<IDashboardBuild>;
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
	joinDate: string;
	rentDueDate: string;
	securityAmount: number;
}

export interface IDashboardMaintainer {
	_id?: ObjectId;
	name?: string;
	email?: string;
	phoneNumber?: string;
	joinDate?: string;
}
