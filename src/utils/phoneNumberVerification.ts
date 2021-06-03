import { Request, Response } from 'express';
import client from '../config/twilio';

export const sendOTP = (req: Request, res: Response) => {
	// validation for phone and channel input?
	const { phoneNumber } = req.body;
	if (phoneNumber.length === 10) {
		client.verify
			.services(process.env.TWILIO_SERVICE_SID as string)
			.verifications.create({
				to: `+91${phoneNumber}`,
				channel: 'sms',
			})
			.then((data: any) => {
				return res.status(200).send(data);
			})
			.catch((err: any) => {
				console.log(err);
				return res.status(500).send('Internal server error');
			});
	}
	return res.status(400).json({ err: 'Try again!' });
};

export const verifyOTP = (req: Request, res: Response) => {
	const { phoneNumber, code } = req.body;
	if (phoneNumber.length === 10) {
		if (code.length === 6) {
			client.verify
				.services(process.env.TWILIO_SERVICE_SID as string)
				.verificationChecks.create({
					to: `+91${phoneNumber}`,
					code,
				})
				.then((data: any) => {
					return res.status(200).send(data);
				})
				.catch((err: any) => {
					console.log(err);
					return res.status(500).send('Internal server error');
				});
		}
	}
	return res.status(400).json({ err: 'OTP verification failed!' });
};

export const verifyPhoneOtp = async (phoneNumber: string, code: string): Promise<any> => {
	const data = await client.verify.services(process.env.TWILIO_SERVICE_SID as string).verificationChecks.create({
		to: `+91${phoneNumber}`,
		code,
	});
	if (data.valid == false) {
		throw new Error('Otp not valid');
	}
	return data;
};
