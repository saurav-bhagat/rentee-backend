import { Expo, ExpoPushMessage, ExpoPushTicket, ExpoPushToken } from 'expo-server-sdk';

const expo = new Expo();
const sendNotifications = (title: string, body: string, tokens: Array<ExpoPushToken>) => {
	return new Promise((resolve, reject) => {
		console.log(tokens);
		const notifications: Array<any> = [];

		for (const token of tokens) {
			if (!Expo.isExpoPushToken(token)) {
				console.error(`Push token ${token} is not a valid Expo push token`);
				continue;
			}

			notifications.push({
				to: token,
				sound: 'default',
				title: title,
				body: body,
				data: { body },
			});
		}

		const chunks = expo.chunkPushNotifications(notifications);

		const tickets: Array<ExpoPushTicket> = [];
		const errorTickets: Array<ExpoPushTicket> = [];

		(async () => {
			for (const chunk of chunks) {
				const ticket = await expo.sendPushNotificationsAsync(chunk);
				tickets.push(...ticket);
			}
		})()
			.then(() => {
				for (const ticket of tickets) {
					if (ticket.status === 'error') {
						errorTickets.push(ticket);
					}
				}

				// if notification is not sent to even a single user
				if (tokens.length === errorTickets.length) {
					throw new Error('Error in sending notifications');
				}

				// if notification is sent to all the users
				if (errorTickets.length === 0) {
					return resolve(`Notfications sent to ${tokens.length - errorTickets.length} devices.`);
				}

				// if some devices have received the notifications and others donot
				return resolve({
					message: `Notfication sent to ${
						tokens.length - errorTickets.length
					} devices. Couldn't sent notification to ${errorTickets.length} devices.`,
					errorTickets,
				});
			})
			.catch((error) => reject({ error, errorTickets }));
	});
};

export default sendNotifications;
