import { Request, Response } from 'express';
import getJwtToken, { verifyRefreshToken } from '../utils/token';

import User from '../models/user/User';
import { IUser } from '../models/user/interface';

// import { sendOTP, verifyPhoneOtp } from '../utils/phoneNumberVerification';
import { formatDbError, isEmptyFields, verifyObjectId } from '../utils/errorUtils';

import NodeMailer from '../config/nodemailer';
import validator from 'validator';

import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

import { ITenant } from '../models/tenant/interface';
import { IProperty } from '../models/property/interface';

import { findTenant } from './tenant';
import { IMaintainer } from '../models/maintainer/interface';

import { findMaintainer } from '../controllers/maintainer';
import { findOwner } from '../controllers/owner';
import { BasicUser, OwnerDashoardDetail } from './owner/ownerTypes';

export class AuthController {
	// Not using this functionality for now
	signUp = async (req: Request, res: Response): Promise<Response<void>> => {
		const { name, email, password, phoneNumber, userType } = req.body;
		const userData = { name, email, password, phoneNumber, userType };
		if (isEmptyFields(userData)) {
			return res.status(400).json({ err: 'All fields are mandatory!' });
		}

		if (!validator.isEmail(email) || password.length < 6 || !validator.isMobilePhone(phoneNumber)) {
			return res.status(400).json({ err: 'Either email/password/phonenumber is not valid' });
		}

		try {
			const userdoc = await User.create(userData);

			const accessToken = await getJwtToken(userdoc, process.env.JWT_ACCESS_SECRET as string, '10m');
			const refreshToken = await getJwtToken(userdoc, process.env.JWT_REFRESH_SECRET as string, '1d');

			const user = await User.addRefreshToken(userdoc._id, refreshToken);

			return res.status(200).json({ user, accessToken });
		} catch (error) {
			return res.status(400).json({ err: formatDbError(error) });
		}
	};

	// Not using this functionality for now
	authenticate = async (req: Request, res: Response) => {
		const { email, password } = req.body;
		const userData = { email, password };

		if (isEmptyFields(userData)) {
			return res.status(400).json({ err: 'All fields are mandatory!' });
		}

		if (!validator.isEmail(email) || password.length < 6) {
			return res.status(400).json({ err: 'Either email/password is not valid' });
		}

		try {
			const userdoc: IUser = await User.login(email, password);

			// For generating tokens
			const accessToken = await getJwtToken(userdoc, process.env.JWT_ACCESS_SECRET as string, '10m');
			const refreshToken = await getJwtToken(userdoc, process.env.JWT_REFRESH_SECRET as string, '1d');

			const user = await User.addRefreshToken(userdoc._id, refreshToken);

			return res.status(200).json({
				user,
				accessToken: accessToken,
			});
		} catch (error: any) {
			return res.status(400).json({ err: formatDbError(error) });
		}
	};

	handleRefreshToken = async (req: Request, res: Response) => {
		const { refreshToken } = req.body;
		if (!refreshToken || !refreshToken.length) {
			return res.status(400).json({ err: 'Refresh token is  missing!' });
		}
		try {
			// verifyrefresh token method verify token and give us the payload inside it
			const userData = await verifyRefreshToken(refreshToken, <string>process.env.JWT_REFRESH_SECRET);

			await User.findUserForRefreshToken(userData._id, refreshToken);

			const { user, accessToken, refreshToken: newRefreshToken } = await this.generateTokensForUser(userData);
			const { _id, phoneNumber, userType, name } = user;
			const userDetails = { _id, phoneNumber, userType, name };
			return res.status(200).json({
				userDetails,
				accessToken: accessToken,
				refreshToken: newRefreshToken,
			});
		} catch (error) {
			console.log('error is: ', error);
			return res.status(403).json({ err: error.message });
		}
	};

	forgotPassword = async (req: Request, res: Response) => {
		const { email } = req.body;
		if (!email) return res.status(400).json({ err: 'Email is  mandatory!' });
		if (!validator.isEmail(email)) {
			return res.json({ err: 'Email is not valid' });
		}
		const nodeMailer = new NodeMailer();
		try {
			const user = await User.findOne({ email });
			// not finding a user in DB is not an error, so it will not go inside catch block, it needs to be handled here
			if (user) {
				const token = await getJwtToken(user, process.env.JWT_RESET_SECRET as string, '20m');

				const updatedUser = await user?.updateOne({ resetLink: token });

				const mailData = {
					to: user?.email,
					subject: 'Reset Password',
					html: `
                        <h2>Reset Password using this link:</h2>
                        <p><a href="${process.env.CLIENT_URL}/resetpassword/${token}">Rest Password Link</a></p>
                    `,
				};
				if (nodeMailer.sendMail(mailData))
					return res.status(200).json({ msg: 'Please check your registered Email ID', token, updatedUser });
			} else {
				return res.status(400).json({ err: 'Email Does not exist' });
			}
		} catch (err) {
			return res.status(400).json({ err: 'Password reset Failed, try again' });
		}
	};

	resetPassword = async (req: Request, res: Response) => {
		const { newPassword, token } = req.body;

		if (!newPassword || !token) {
			return res.status(400).json({ err: 'All fields are mandatory!' });
		}
		if (newPassword.length < 6) {
			return res.json({ err: 'Minimum password length is 6 characters' });
		}
		try {
			await verifyRefreshToken(token, <string>process.env.JWT_RESET_SECRET);

			const salt = await bcrypt.genSalt();
			const password = await bcrypt.hash(newPassword, salt);

			await User.findOneAndUpdate(
				{
					resetLink: token,
				},
				{
					password,
					resetLink: '',
				},
				{
					new: true,
					runValidators: true,
					context: 'query',
				},
				(err, doc) => {
					if (err || !doc) {
						console.log(err, doc);
						return res.status(400).json({ err: 'Password update failed, try again!!' });
					}
					return res.status(200).json({ msg: 'Password Updated Successfuly' });
				}
			);
		} catch (err) {
			return res.status(400).json({ err: 'Incorrect token sent - Authorization error' });
		}
	};

	sendOtpOnLogin = (req: Request, res: Response): void => {
		// console.log('receiving phone number for opt', req, res);
		res.json({ msg: 'req receive successfully' });
		// For development purposes we need to comment the below function
		// sendOTP(req, res);
	};

	// if correct userDocument arrives then no promise rejection occurs so
	// before using thid mehtod handle userdoc null promise rejection method before call this one
	generateTokensForUser = async (userDocument: IUser): Promise<any> => {
		const accessToken = await getJwtToken(userDocument, process.env.JWT_ACCESS_SECRET as string, '10m');
		const refreshToken = await getJwtToken(userDocument, process.env.JWT_REFRESH_SECRET as string, '1d');
		const user: BasicUser = await User.addRefreshToken(userDocument._id, refreshToken);
		console.log('User inside genereateToken: ', user);
		return new Promise((resolve) => {
			resolve({
				accessToken,
				refreshToken,
				user,
			});
		});
	};

	findDashboardForUser = async (
		userDocument: IUser
	): Promise<ITenant | IProperty | IMaintainer | OwnerDashoardDetail | null | IUser | BasicUser> => {
		if (userDocument.userType == 'Owner') {
			const ownerDetails = await findOwner(userDocument);
			return ownerDetails;
		} else if (userDocument.userType == 'Tenant') {
			const tenantDetails = await findTenant(userDocument);
			return tenantDetails;
		} else if (userDocument.userType == 'Maintainer') {
			const maintainerDetails = await findMaintainer(userDocument);
			return maintainerDetails;
		}
		return null;
	};

	registerUser = async (phoneNumber: string): Promise<any> => {
		const user = await User.collection.insertOne({
			_id: new mongoose.Types.ObjectId(),
			phoneNumber,
			userType: 'Owner',
		});
		if (user == null) {
			throw new Error('Unable to register ');
		}
		// user.ops[0] is same doc when we create a user with User.create method
		// but here we use insertOne which return doc with additional info
		// but we want only user.ops[0] that's why use
		// Note: if we don't use user.ops[0]
		// our generateTokensForUser is no longer able to genrate a token
		// because it expect a doc structure like User.create method create
		const { accessToken, refreshToken, user: registeredUser } = await this.generateTokensForUser(user.ops[0]);
		const { _id, userType, phoneNumber: ownerPhoneNumber } = registeredUser;
		const ownerBasicDetails = { _id, userType, ownerPhoneNumber };
		return new Promise((resolve) => {
			resolve({
				ownerBasicDetails,
				accessToken,
				refreshToken,
				firstLogin: true,
			});
		});
	};

	findUser = async (phoneNumber: string, code: string) => {
		console.log(code);
		// for production it comment
		// await verifyPhoneOtp(phoneNumber,code);
		const userDocument = await User.findOne({ phoneNumber });
		if (userDocument == null) {
			const user = await this.registerUser(phoneNumber);
			return user;
		}

		const userDetails = await this.findDashboardForUser(userDocument);
		const { accessToken, refreshToken } = await this.generateTokensForUser(userDocument);
		return new Promise((resolve) => {
			resolve({
				userDetails,
				accessToken,
				refreshToken,
			});
		});
	};

	phoneAuthenticate = (req: Request, res: Response) => {
		const { phoneNumber, code } = req.body;
		if (
			phoneNumber &&
			phoneNumber.length === 10 &&
			validator.isMobilePhone(`+91${phoneNumber}`, 'en-IN') &&
			code &&
			code.length === 6
		) {
			this.findUser(phoneNumber, code)
				.then((userDocument) => {
					return res.status(200).json({ userDocument });
				})
				.catch((err) => {
					console.log(err);
					return res.status(400).json({ err: err.message });
				});
		} else {
			return res.status(400).json({ err: 'Invalid details' });
		}
	};

	updateUserBasicInfoUtil = async (userObject: any) => {
		const { name, email, _id, phoneNumber } = userObject;
		const data: any = {};
		if (name) data['name'] = name;
		if (email) data['email'] = email;
		if (phoneNumber) data['phoneNumber'] = phoneNumber;
		if (!(Object.keys(data).length == 0)) {
			const result = await User.findOneAndUpdate({ _id }, data, {
				new: true,
				runValidators: true,
				context: 'query',
			});
			if (!result) {
				throw new Error('Invalid user detail');
			}
			return result;
		} else {
			throw new Error('Updating field mandatory');
		}
	};

	// TODO: check for isAuth
	updateUserBasicInfo = (req: Request, res: Response) => {
		const { _id, name, email, phoneNumber } = req.body;

		if (!_id || !verifyObjectId([_id])) {
			res.status(403).json({ err: 'Invalid user Details' });
		}

		if (email && !validator.isEmail(email)) {
			res.status(400).json({ err: 'email is not valid!' });
		}
		if (phoneNumber && !validator.isMobilePhone(`91${phoneNumber}`, 'en-IN')) {
			res.status(400).json({ err: 'Phone number is not valid!' });
		}
		const userObject = { _id, name, email, phoneNumber };
		this.updateUserBasicInfoUtil(userObject)
			.then((data) => {
				const { _id, name, email, phoneNumber, userType } = data;
				const updatedUserInfo: BasicUser = { _id, name, email, phoneNumber, userType };
				res.status(200).json({ updatedUserInfo });
			})
			.catch((err) => {
				res.status(400).json({ err: err.message });
			});
	};
}
