import { Request, Response } from 'express';
import { ExpoPushToken } from 'expo-server-sdk';
import User from '../../models/user/User';
import sendNotifications from '../../utils/sendNotifications';

export const notificationsToSpecificUserType = async (req: Request, res: Response) => {
	if (req.isAuth) {
		const { userType, title, messageBody } = req.body;
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
			users = await User.find({});
		}

		const allExpoTokens: Array<ExpoPushToken> = [];
		if (users.length) {
			for (let user = 0; user < users.length; user++) {
				const { expoPushToken } = users[user];
				if (expoPushToken) {
					allExpoTokens.push(expoPushToken);
				}
			}

			const titleForNotification = title ? title : 'This is a random title';
			const body = messageBody ? messageBody : 'This is a random body.';

			sendNotifications(titleForNotification, body, allExpoTokens)
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
