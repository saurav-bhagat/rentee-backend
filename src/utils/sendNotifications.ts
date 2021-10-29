import { Expo } from 'expo-server-sdk';
import { ObjectId } from 'mongoose';
const expo = new Expo();

const sendNotifications = (title: string, body: string, userId: ObjectId, token: string) => {
	return new Promise((resolve, reject) => {
		const notifications: Array<any> = [];

		if (!Expo.isExpoPushToken(token)) {
			reject(`Push token ${token} is not a valid Expo push token`);
		}

		notifications.push({
			to: token,
			sound: 'default',
			title: title,
			body: body,
			data: { body },
		});

		const chunks = expo.chunkPushNotifications(notifications);
		const tickets: Array<any> = [];

		(async () => {
			for (const chunk of chunks) {
				try {
					const receipts = await expo.sendPushNotificationsAsync(chunk);
					tickets.push(...receipts);
				} catch (error) {
					reject(error);
				}
			}
		})();

		const receiptIds: Array<any> = [];
		for (const ticket of tickets) {
			if (ticket.id) {
				receiptIds.push(ticket.id);
			}
		}

		const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
		(async () => {
			for (const chunk of receiptIdChunks) {
				try {
					const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
					console.log(receipts);

					for (const receiptId in receipts) {
						const { status } = receipts[receiptId];
						if (status === 'ok') {
							continue;
						} else if (status === 'error') {
							reject('There was an error sending a notification');
						}
					}
				} catch (error) {
					reject(error);
				}
			}
		})();

		resolve('Notifications Sent');
	});
};

export default sendNotifications;
