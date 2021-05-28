import { Request, Response } from "express";
import client from "../config/twilio";

export const sendOTP = (req: Request, res: Response) => {
	//validation for phone and channel input?
	const { phoneNumber } = req.body;
	if (phoneNumber.length === 10) {
		client.verify
			.services(process.env.TWILIO_SERVICE_SID as string)
			.verifications.create({
				to: `+91${phoneNumber}`,
				channel: "sms",
			})
			.then((data: any) => {
				res.status(200).send(data);
			})
			.catch((err: any) => {
				console.log(err);
				res.status(500).send("Internal server error");
			});
	} else {
		res.status(500).json({ err: "Please enter valid phone number" });
	}
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
					res.status(200).send(data);
				})
				.catch((err: any) => {
					console.log(err);
					res.status(500).send("Internal server error");
				});
		} else {
			res.status(500).json({ err: "Please enter valid code" });
		}
	} else {
		res.status(500).json({ err: "Please enter valid phone number" });
	}
};

export const verifyPhoneOtp = async (phoneNumber: any, code: any) => {
	const data = await client.verify.services(process.env.TWILIO_SERVICE_SID as string).verificationChecks.create({
		to: `+91${phoneNumber}`,
		code,
	});
	if (data.valid == false) {
		throw new Error("Otp not valid");
	}
	return data;
};
