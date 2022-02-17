import { Schema, model } from 'mongoose';
import { ITenant } from './interface';

const tenantSchema = new Schema(
	{
		userId: { type: Schema.Types.ObjectId, ref: 'user' },
		rent: [],
		joinDate: Date,
		rentDueDate: Date,
		securityAmount: Number,
		ownerId: { type: Schema.Types.ObjectId, ref: 'user' },
		roomId: { type: Schema.Types.ObjectId, ref: 'room' },
		buildId: { type: Schema.Types.ObjectId },
		receipts: [{ type: Schema.Types.ObjectId, ref: 'receipt' }],
		payments: [{ type: Schema.Types.ObjectId, ref: 'payment' }],
		lastMonthDate: Date,
		actualTenantRent: Number,
	},
	{ timestamps: true }
);

const Tenant = model<ITenant>('tenant', tenantSchema);

export default Tenant;
