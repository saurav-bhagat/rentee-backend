import { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { IUser } from '../models/user/interface';

export default (req: Request, res: Response, next: NextFunction) => {
	const authHeader = req.get('Authorization');
	let decodedToken: IUser;

	if (!authHeader) {
		req.isAuth = false;
		return next();
	}
	const token = authHeader.split(' ')[1];

	if (!token || token === '') {
		req.isAuth = false;
		return next();
	}

	try {
		decodedToken = <IUser>jwt.verify(token, process.env.JWT_ACCESS_SECRET as string);
		console.log('Decoded token is: ', decodedToken);
	} catch (err) {
		console.log(err);
		req.isAuth = false;
		req.tokenError = err.message;
		if (err.message === 'jwt expired') {
			return res.status(403).json({ err: 'jwt expired' });
		}
		return res.status(403).json({ err: 'Not Authorized' });
	}
	if (!decodedToken) {
		req.isAuth = false;
		return next();
	}
	req.isAuth = true;
	req.user = decodedToken;
	return next();
};
