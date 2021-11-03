import { Expo } from 'expo-server-sdk';
import { ObjectId } from 'mongoose';
const expo = new Expo();
const sendNotifications = (title: string, body: string, userId: ObjectId, token: string) => {
	return new Promise((resolve, reject) => {
		const notifications: Array<any> = [];

		if (!Expo.isExpoPushToken(token)) {
			return reject(`Push token ${token} is not a valid Expo push token`);
		}

		notifications.push({
			to: token,
			sound: 'default',
			title: title,
			body: body,
			data: { body },
		});

		const chunks = expo.chunkPushNotifications(notifications);
		const chunk = chunks[0];
		(async () => {
			const ticket = await expo.sendPushNotificationsAsync(chunk);
			if (ticket[0].status === 'error') {
				throw new Error(ticket[0].message);
			}
		})()
			.then(() => {
				return resolve('Notifications Sent');
			})
			.catch((error) => reject(error));
	});
};

export default sendNotifications;
