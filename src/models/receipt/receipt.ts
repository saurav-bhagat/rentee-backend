import { Schema, model } from 'mongoose';
import { IReceipt } from './interface';

const receiptSchema = new Schema(
	{
		amount: Number,
		month: String,
		mode: String,
	},
	{ timestamps: true }
);

const Receipt = model<IReceipt>('receipt', receiptSchema);

export default Receipt;
