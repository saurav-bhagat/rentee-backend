import { Schema, Document } from "mongoose";

export interface ITenant extends Document {
	_id: Schema.Types.ObjectId;
	userId: Schema.Types.ObjectId;
	joinDate: Date;
	rentDueDate: String;
	securityAmount: Number;
	ownerId: Schema.Types.ObjectId;
	roomId: Schema.Types.ObjectId;
	buildId: Schema.Types.ObjectId;
}
