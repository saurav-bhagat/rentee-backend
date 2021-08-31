import { Schema, Document } from 'mongoose';

export interface IReceipt extends Document {
	_id: Schema.Types.ObjectId;
	amount: number;
	month: string;
	mode: string;
}
