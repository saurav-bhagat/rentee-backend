import { Request, Response } from 'express';
import validator from 'validator';

import bcrypt from 'bcrypt';
import { verifyObjectId } from '../../utils/errorUtils';

import User from '../../models/user/User';
import Tenant from '../../models/tenant/tenant';

export const updateTenantPassword = async (req: Request, res: Response) => {
	const { email, password } = req.body;

	if (req.user) {
		if (!email || !password) {
			return res.json({ err: 'All fields are mandatory!' });
		}
		if (!validator.isEmail(email) || password.length < 6) {
			return res.json({ err: 'Either email/password incorrect' });
		}

		const tenant = await User.findOne({ email });
		if (tenant) {
			const salt = await bcrypt.genSalt();
			const newPassword = await bcrypt.hash(password, salt);

			const updatedUser = await tenant.updateOne({ password: newPassword });
			if (updatedUser) {
				return res.status(200).json({ msg: 'Password updated successfully' });
			}
			return res.status(400).json({ err: 'Password Update Failed' });
		}
		return res.status(400).json({ err: 'Tenant does not exit' });
	} else {
		return res.status(403).json({ err: 'Password Update Failed' });
	}
};

export const updateTenantInfoUtil = async (userObject: any) => {
	const { name, email, _id, phoneNumber, securityAmount } = userObject;
	const userDetailObject: any = {};
	const tenantUserInfo: any = {};

	const tenantDetails: any = {};
	if (name) {
		tenantUserInfo['name'] = name;
		userDetailObject['name'] = name;
	}
	if (email) {
		tenantUserInfo['email'] = email;
		userDetailObject['email'] = email;
	}
	if (phoneNumber) {
		tenantUserInfo['phoneNumber'] = phoneNumber;
		userDetailObject['phoneNumber'] = phoneNumber;
	}
	if (securityAmount) {
		tenantDetails['securityAmount'] = securityAmount;
		userDetailObject['securityAmount'] = securityAmount;
	}
	if (!(Object.keys(userDetailObject).length == 0)) {
		if (!(Object.keys(tenantUserInfo).length == 0)) {
			const result = await User.findOneAndUpdate({ _id }, tenantUserInfo, {
				new: true,
				runValidators: true,
				context: 'query',
			});
			if (!result) {
				throw new Error('Invalid user detail');
			}
		}
		if (!(Object.keys(tenantDetails).length == 0)) {
			const result = await Tenant.findOneAndUpdate({ userId: _id }, tenantDetails, {
				new: true,
				runValidators: true,
				context: 'query',
			});
			if (!result) {
				throw new Error('Invalid user detail');
			}
		}

		return 'Update sucessfully';
	} else {
		throw new Error('Updating field mandatory');
	}
};

export const updateTenantInfo = (req: Request, res: Response) => {
	if (req.isAuth) {
		const { _id, name, email, phoneNumber, securityAmount } = req.body;
		if (!_id || !verifyObjectId([_id])) {
			return res.status(403).json({ err: 'Invalid user Details' });
		}

		if (email && !validator.isEmail(email)) {
			return res.status(400).json({ err: 'Invalid Email' });
		}
		if (phoneNumber && !validator.isMobilePhone(`91${phoneNumber}`, 'en-IN')) {
			return res.status(400).json({ err: 'Invalid phoneNumber' });
		}

		const userObject = { _id, name, email, phoneNumber, securityAmount };
		updateTenantInfoUtil(userObject)
			.then((responseMsg) => {
				return res.status(200).json({ msg: responseMsg });
			})
			.catch((err) => {
				return res.status(400).json({ err: err.message });
			});
	} else {
		return res.status(403).json({ err: 'Not Authorized' });
	}
};
