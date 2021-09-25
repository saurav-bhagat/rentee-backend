import { Document, Schema, Model } from 'mongoose';

export interface IAdmin extends Document {
	_id: Schema.Types.ObjectId;
	userName: string;
	password: string;
}

export interface IModel extends Model<IAdmin> {
	login: (userName: Schema.Types.ObjectId, password: string) => IAdmin;
}
