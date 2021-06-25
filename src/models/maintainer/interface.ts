import mongoose, { Schema, Document } from 'mongoose';

export interface IMaintainer extends Document {
	_id: Schema.Types.ObjectId;
	ownerId: Schema.Types.ObjectId;
	userId: Schema.Types.ObjectId;
	joinDate: string;
	buildings: mongoose.Types.Array<Schema.Types.ObjectId>;
}
