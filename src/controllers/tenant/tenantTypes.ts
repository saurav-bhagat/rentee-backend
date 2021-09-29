import { ObjectId } from 'mongoose';

export interface TenantObj {
	_id?: ObjectId;
	tenantEmail?: string;
	tenantName?: string;
	tenantPhoneNumber?: string;
	roomNumber?: number;
	roomType?: string;
	rent?: number;
	floor?: string;
	joinDate?: Date;
	rentDueDate?: Date;
	security?: number;
	buildingName?: string;
	buildingAddress?: string;
	ownerName?: string;
	ownerEmail?: string;
	ownerPhoneNumber?: string;
	userType?: string;
	receipts?: Array<ObjectId>;
	payments?: Array<ObjectId>;
}
