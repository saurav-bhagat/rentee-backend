import { Document, Schema } from 'mongoose';

export interface IOwner extends Document {
	_id: Schema.Types.ObjectId;
	accountName: string;
	accountNumber: string;
	ifsc: string;
	bankName: string;
	beneficiaryName: string;
	vendorId: string;
	ownerUserId: string;
}
