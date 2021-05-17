import mongoose, { Schema, Document } from "mongoose";

export interface IRooms extends Document {
	_id: Schema.Types.ObjectId;
	rent: Number;
	type: String;
	floor: String;
	roomNo: Number;
	isEmpty: Boolean;
	tenants: mongoose.Types.Array<Schema.Types.ObjectId>;
}

export interface IBuilding extends Document {
	_id: Schema.Types.ObjectId;
	name: String;
	address: String;
	rooms: mongoose.Types.Array<Schema.Types.ObjectId>;
}

export interface IProperty extends Document {
	_id: Schema.Types.ObjectId;
	ownerId: Schema.Types.ObjectId;
	buildings: mongoose.Types.Array<IBuilding>;
}
