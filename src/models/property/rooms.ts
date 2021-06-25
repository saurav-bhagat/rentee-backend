import { Schema, model } from 'mongoose';
import { IRooms } from './interface';

const roomSchema = new Schema(
	{
		rent: { type: Number, required: [true, 'Please enter room rent'] },
		type: { type: String, required: [true, 'Please enter room type'] },
		floor: { type: String, required: [true, 'Please enter floor number'] },
		roomNo: { type: Number, required: [true, 'Please enter room number'] },
		isEmpty: { type: Boolean },
		tenants: [{ type: Schema.Types.ObjectId, ref: 'tenant' }],
	},
	{ timestamps: true }
);

const room = model<IRooms>('room', roomSchema);

export default room;
