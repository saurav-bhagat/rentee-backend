import { Schema, model } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import { validateBankAccountNumber, validateIfsc } from '../../controllers/owner';
import { IOwner } from './interface';

const ownerInfoSchema = new Schema(
	{
		accountName: {
			type: String,
			required: [true, 'Please enter account name'],
		},
		accountNumber: {
			type: String,
			required: [true, 'Please enter account number'],
			unique: [true, 'Account number is already registered'],
			validate: [validateBankAccountNumber, 'Please enter valid account number'],
		},
		ifsc: {
			type: String,
			required: [true, 'Please enter banck IFSC code'],
			validate: [validateIfsc, 'Please enter valid ifsc code'],
		},
		bankName: {
			type: String,
			required: [true, 'Please enter bank name'],
		},
		beneficiaryName: String,
		vendorId: String,
		ownerUserId: {
			type: String,
			required: [true, 'Please enter owner User id'],
		},
	},
	{ timestamps: true }
);

const Owner = model<IOwner>('Owner', ownerInfoSchema);

ownerInfoSchema.plugin(uniqueValidator, { message: '{PATH} already exist' });

export default Owner;
