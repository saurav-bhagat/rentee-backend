import { Schema, model } from 'mongoose';
import { IRooms } from './interface';

const roomSchema = new Schema(
	{
		rent: { type: Number, default: 0 },
		type: { type: String, required: [true, 'Please enter room type'] },
		floor: { type: String, required: [true, 'Please enter floor number'] },
		roomNo: { type: String, required: [true, 'Please enter room number'] },
		roomSize: { type: String, required: [true, 'Please enter room size'] },
		isEmpty: { type: Boolean },
		tenants: [{ type: Schema.Types.ObjectId, ref: 'tenant' }],
		isMultipleTenant: { type: Boolean },
	},
	{ timestamps: true }
);

const room = model<IRooms>('room', roomSchema);

export default room;
