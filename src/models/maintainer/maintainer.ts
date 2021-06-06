import { Schema, model } from 'mongoose';
import { IMaintainer } from './interface';

const maintainerSchema = new Schema(
	{
		ownerId: { type: Schema.Types.ObjectId, ref: 'user' },
		userId: { type: Schema.Types.ObjectId, ref: 'user' },
		joinDate: String,
		buildings: [{ type: Schema.Types.ObjectId }],
	},
	{ timestamps: true }
);

const maintainer = model<IMaintainer>('maintainer', maintainerSchema);

export default maintainer;
