import { Schema, model } from 'mongoose';
import { IPayment } from './interface';

const paymentSchema = new Schema(
	{
		currency: String,
		gatewayName: String,
		respMsg: String,
		bankName: String,
		paymentMode: String,
		respCode: String,
		txnId: String,
		txnAmount: String,
		orderId: String,
		status: String,
		bankTxnId: String,
		txnDate: Date,
	},
	{ timestamps: true }
);

const Payment = model<IPayment>('payment', paymentSchema);

export default Payment;
