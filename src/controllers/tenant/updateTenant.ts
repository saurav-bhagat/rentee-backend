import { Request, Response } from 'express';
import validator from 'validator';

import bcrypt from 'bcrypt';
import User from '../../models/user/User';

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
