import { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
	_id: Schema.Types.ObjectId;
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

export interface IPaymentDetail {
	txnAmount: string;
	txnDate: Date;
	paymentMode: string;
}
