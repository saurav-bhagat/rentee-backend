import { ObjectId } from 'mongoose';

export interface IOwnerForAdmin {
	_id?: ObjectId;
	name?: string;
	email?: string;
	phoneNumber?: string;
	accountName?: string;
	accountNumber?: string;
	ifsc?: string;
	bankName?: string;
	beneficiaryName?: string;
	ownerInfo?: IOwnerInfoForAdmin;
	buildings?: Array<IBuildingInfoForAdmin>;
}

export interface IOwnerInfoForAdmin {
	_id?: ObjectId;
	name?: string;
	email?: string;
	phoneNumber?: string;
	accountName?: string;
	accountNumber?: string;
	ifsc?: string;
	bankName?: string;
	beneficiaryName?: string;
}

export interface IBuildingInfoForAdmin {
	_id: ObjectId;
	name: string;
	address: string;
	mainTainerInfo?: IMaintainerInfoForAdmin;
	rooms: Array<IRoomInfoForAdmin>;
}

export interface IMaintainerInfoForAdmin {
	_id?: ObjectId;
	name?: string;
	email?: string;
	phoneNumber?: string;
	joinDate?: Date;
}

export interface IRoomInfoForAdmin {
	_id: ObjectId;
	rent: number;
	type: string;
	floor: string;
	roomNo: number;
	tenants?: Array<ITenantInfoForAdmin>;
}

export interface ITenantInfoForAdmin {
	_id: ObjectId;
	name?: string;
	email?: string;
	phoneNumber?: string;
	joinDate: Date;
	rentDueDate: Date;
	securityAmount: number;
	receipts: Array<IReceiptForAdmin>;
	payments: Array<IPaymentForAdmin>;
}

export interface IReceiptForAdmin {
	_id: ObjectId;
	amount: number;
	month: string;
	mode: string;
}

export interface IPaymentForAdmin {
	_id: ObjectId;
	currency: string;
	gatewayName: string;
	respMsg: string;
	bankName: string;
	paymentMode: string;
	respCode: string;
	txnId: string;
	txnAmount: string;
	orderId: string;
	status: string;
	bankTxnId: string;
	txnDate: Date;
}
