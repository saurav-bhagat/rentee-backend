import { Schema, Document } from 'mongoose';

export interface ITenant extends Document {
	_id: Schema.Types.ObjectId;
	rent: number;
	userId: Schema.Types.ObjectId;
	joinDate: Date;
	rentDueDate: Date;
	securityAmount: number;
	ownerId: Schema.Types.ObjectId;
	roomId: Schema.Types.ObjectId;
	buildId: Schema.Types.ObjectId;
	receipts: Array<Schema.Types.ObjectId>;
	payments: Array<Schema.Types.ObjectId>;
}
