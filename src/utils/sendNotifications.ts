import { Expo } from 'expo-server-sdk';
import { ObjectId } from 'mongoose';
const expo = new Expo();

const sendNotifications = (title: string, body: any, userId: ObjectId, token: any) => {
	const notifications: Array<any> = [];

	if (!Expo.isExpoPushToken(token)) {
		console.error(`Push token ${token} is not a valid Expo push token`);
	}

	notifications.push({
		to: token,
		sound: 'default',
		title: title,
		body: body,
		data: { body },
	});

	const chunks = expo.chunkPushNotifications(notifications);

	(async () => {
		for (const chunk of chunks) {
			try {
				const receipts = await expo.sendPushNotificationsAsync(chunk);
				console.log(receipts);
			} catch (error) {
				console.error(error);
			}
		}
	})();
};

export default sendNotifications;
