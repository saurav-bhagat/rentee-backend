import { ObjectId } from 'mongoose';

export interface BasicUser {
	_id: ObjectId;
	name: string;
	email: string;
	phoneNumber: string;
	userType: string;
	refreshToken: string;
}

export interface OwnerDashoardDetail {
	_id: ObjectId;
	ownerId: ObjectId;
	buildings?: Array<IDashbhoardBuild>;
}

export interface IDashbhoardBuild {
	_id: ObjectId;
	name: string;
	address: string;
	maintainer?: IDashoboardMaintainer;
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

export interface IDashoboardMaintainer {
	_id?: ObjectId;
	name?: string;
	email?: string;
	phoneNumber?: string;
	joinDate?: string;
}
