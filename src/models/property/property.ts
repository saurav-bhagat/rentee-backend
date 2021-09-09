import { Schema, model } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import { IProperty } from './interface';
import { buildingSchema } from './subSchema';

const propertySchema = new Schema(
	{
		ownerId: { type: Schema.Types.ObjectId, ref: 'user', unique: true },
		buildings: [buildingSchema],
		ownerInfo: { type: Schema.Types.ObjectId, ref: 'Owner', unique: true },
	},
	{ timestamps: true }
);

const property = model<IProperty>('property', propertySchema);

propertySchema.plugin(uniqueValidator, { message: '{PATH} already exist' });

export default property;
