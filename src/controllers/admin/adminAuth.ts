import { Request, Response } from 'express';
import { sign } from 'jsonwebtoken';

import Admin from '../../models/admin/admin';
import { IAdmin } from '../../models/admin/interface';

import { formatDbError, isEmptyFields } from '../../utils/errorUtils';

export const createTokenForAdmin = (admin: IAdmin, jwtSecret: string, expireTime: string): Promise<string> => {
	return new Promise((resolve, reject) => {
		const payload = {
			_id: admin._id,
			userName: admin.userName,
			password: admin.password,
		};
		const options = {
			expiresIn: expireTime,
			issuer: 'rentee.com',
			// audience: userId,
		};
		sign(payload, jwtSecret, options, (err, token) => {
			if (err) {
				console.log('Error while signing token: ', err.message);
				reject(err);
			}
			// we use ! as we know at this line token can't be null
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			resolve(token!);
		});
	});
};

export const signUp = async (req: Request, res: Response) => {
	const { userName, password } = req.body;
	if (isEmptyFields({ userName, password })) {
		return res.status(400).json({ err: 'Fields are mandatory!' });
	}
	if (password.length < 6) {
		return res.status(400).json({ err: 'Password is not valid!' });
	}
	try {
		const adminDoc = await Admin.create({ userName, password });
		return res.status(200).json({ adminDoc });
	} catch (error) {
		return res.status(400).json({ err: formatDbError(error) });
	}
};

export const login = async (req: Request, res: Response) => {
	const { userName, password } = req.body;
	if (isEmptyFields({ userName, password })) {
		return res.status(400).json({ err: 'Fields are mandatory!' });
	}
	if (password.length < 6) {
		return res.status(400).json({ err: 'Password is not valid!' });
	}
	try {
		const adminDoc: IAdmin = await Admin.login(userName, password);
		const token = await createTokenForAdmin(adminDoc, process.env.JWT_ACCESS_SECRET as string, '10d');
		return res.status(200).json({
			adminDoc,
			accessToken: token,
		});
	} catch (error) {
		return res.status(400).json({ err: formatDbError(error) });
	}
};
