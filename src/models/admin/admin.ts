import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';
import { IAdmin, IModel } from './interface';

const adminSchema = new Schema(
	{
		userName: {
			type: String,
			required: [true, 'Please enter  userName'],
		},
		password: {
			type: String,
			required: [true, 'Please enter  password'],
			minlength: [6, 'Minimum password length is 6 characters'],
		},
	},
	{ timestamps: true }
);

// this method fire before doc save to db
adminSchema.pre<IAdmin>('save', async function (next) {
	const salt = await bcrypt.genSalt();
	const plainText = this.get('password');
	this.set('password', await bcrypt.hash(plainText, salt));
	next();
});

// static method to login user
adminSchema.statics.login = async function (userName: string, password: string) {
	const user = await this.findOne({ userName });
	if (user) {
		const auth = await bcrypt.compare(password, user.password);
		if (auth) {
			return user;
		}
		throw Error('Incorrect password');
	} else {
		throw Error('Incorrect userName');
	}
};

const Admin = model<IAdmin, IModel>('admin', adminSchema);

export default Admin;
