import { Schema, model } from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcrypt';
import uniqueValidator from 'mongoose-unique-validator';
import { IUser, IModel } from './interface';
import Tenant from '../tenant/tenant';
import Rooms from '../property/rooms';

const userSchema = new Schema(
	{
		name: {
			type: String,
			required: [true, 'Please enter  name'],
		},
		email: {
			type: String,
			// required: [true, 'Please enter an email'],
			// unique: [true, 'Email is already registered'],
			lowercase: true,
			// validate: [validator.isEmail, 'Please enter an valid email'],
			// sparse: true, // https://stackoverflow.com/questions/24430220/e11000-duplicate-key-error-index-in-mongodb-mongoose
		},
		password: {
			type: String,
			minlength: [6, 'Minimum password length is 6 characters'],
		},
		phoneNumber: {
			type: String,
			required: [true, 'Please enter phone number'],
			validate: [validator.isMobilePhone, 'Please enter an valid phone number'],
			unique: [true, 'Phone number is already registered'],
		},
		userType: {
			type: String,
			enum: ['Owner', 'Tenant', 'Maintainer'],
		},
		resetLink: {
			type: String,
			default: '',
		},
		refreshToken: {
			type: String,
		},
		expoPushToken: {
			type: String,
		},
		address: { type: String },
	},
	{ timestamps: true }
);

// this method fire before doc save to db
userSchema.pre<IUser>('save', async function (next) {
	const salt = await bcrypt.genSalt();
	const plainText = this.get('password');
	this.set('password', await bcrypt.hash(plainText, salt));
	next();
});

// this method fire before doc remove
userSchema.pre<IUser>('remove', async function (next) {
	const tenantDetails = await Tenant.findOneAndDelete({ userId: this._id });
	if (tenantDetails) {
		const { roomId, _id } = tenantDetails;
		await Rooms.updateOne({ _id: roomId }, { $pull: { tenants: _id } });
	}
	next();
});

// static method to login user
userSchema.statics.login = async function (email: string, password: string) {
	const user = await this.findOne({ email });
	if (user) {
		const auth = await bcrypt.compare(password, user.password);
		if (auth) {
			return user;
		}
		throw Error('Incorrect password');
	} else {
		throw Error('Incorrect email');
	}
};

userSchema.statics.addRefreshToken = async function (id: string, refreshToken: string) {
	const response = await this.findByIdAndUpdate(id, { refreshToken, resetLink: '' }, { new: true }, (err, user) => {
		if (err) {
			return err;
		} else {
			return user;
		}
	});
	return response;
};

userSchema.statics.findUserForRefreshToken = async function (id: string, refreshToken: string) {
	const user = await this.findById(id);
	console.log(user);
	if (user && user.refreshToken === refreshToken) {
		return user;
	} else {
		throw Error('Invalid user');
	}
};

const User = model<IUser, IModel>('user', userSchema);

userSchema.plugin(uniqueValidator, { message: '{PATH} already exist' });

export default User;
