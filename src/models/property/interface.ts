import mongoose, { Schema, Document } from 'mongoose';

export interface IRooms extends Document {
	_id: Schema.Types.ObjectId;
	rent: number;
	type: string;
	floor: string;
	roomNo: number;
	isEmpty: boolean;
	tenants: mongoose.Types.Array<Schema.Types.ObjectId>;
}

export interface IBuilding extends Document {
	_id: Schema.Types.ObjectId;
	name: string;
	address: string;
	rooms: mongoose.Types.Array<Schema.Types.ObjectId>;
}

export interface IProperty extends Document {
	_id: Schema.Types.ObjectId;
	ownerId: Schema.Types.ObjectId;
	buildings: mongoose.Types.Array<IBuilding>;
}
