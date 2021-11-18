import { Request, Response } from 'express';
import { ExpoPushToken } from 'expo-server-sdk';
import User from '../../models/user/User';
import sendNotifications from '../../utils/sendNotifications';

export const notificationsToSpecificUserType = async (req: Request, res: Response) => {
	if (req.isAuth) {
		const { userType, title, messageBody } = req.body;

		if (!title || !messageBody) return res.json({ err: 'Enter both title and body of notification.' });

		let users: Array<any>;

		if (userType === 'user') {
			users = await User.find({});
		} else if (userType === 'owner') {
			users = await User.find({ userType: 'Owner' });
		} else if (userType === 'tenant') {
			users = await User.find({ userType: 'Tenant' });
		} else if (userType === 'maintainer') {
			users = await User.find({ userType: 'Maintainer' });
		} else {
			return res.json({ err: 'No users selected' });
		}

		if (users.length) {
			const allExpoTokens: Array<ExpoPushToken> = users.reduce((tokens, item) => {
				if (item.expoPushToken !== undefined) tokens.push(item.expoPushToken);
				return tokens;
			}, []);

			sendNotifications(title, messageBody, allExpoTokens)
				.then((response) => {
					return res.json({ response });
				})
				.catch((error) => {
					return res.status(400).json({ error });
				});
		} else {
			return res.status(400).json({ err: 'Users dont exist.' });
		}
	} else {
		return res.status(403).json({ err: 'Not authorized' });
	}
};
