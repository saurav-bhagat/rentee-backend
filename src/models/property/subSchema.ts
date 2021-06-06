import { Schema } from 'mongoose';

export const buildingSchema = new Schema({
	name: { type: String, required: [true, 'Please enter building name'] },
	address: { type: String, required: [true, 'Please enter building address'] },
	rooms: [{ type: Schema.Types.ObjectId, ref: 'room' }],
	maintainerId: { type: Schema.Types.ObjectId, ref: 'maintainer' },
});
