import { Schema, model } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import { IOwner } from './interface';

const validateIfsc = (ifsc: any) => {
	const regex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
	return regex.test(ifsc);
};

const validateBankAccountNumber = (accountNumber: any) => {
	const regex = /[0-9]{9,18}/;
	return regex.test(accountNumber);
};

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
	},
	{ timestamps: true }
);

const Owner = model<IOwner>('Owner', ownerInfoSchema);

ownerInfoSchema.plugin(uniqueValidator, { message: '{PATH} already exist' });

export default Owner;
