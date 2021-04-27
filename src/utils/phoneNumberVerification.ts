import {Request, Response} from "express";
import client from "../config/twilio";



export const sendOTP =(req: Request, res: Response) => {
    //validation for phone and channel input?
    const {phoneNumber}=req.body;

    client
        .verify
        .services(process.env.TWILIO_SERVICE_SID as string)
        .verifications
        .create({
            to: `+91${phoneNumber}`,
            channel: 'sms'
        })
        .then((data: any) => {
            res.status(200).send(data);
        })
        .catch((err: any) => {
            console.log(err);
            res.status(500).send("Internal server error");
        });
};

export const  verifyOTP =  (req: Request, res: Response) => {
    const {phoneNumber,code}=req.body;
    client
        .verify
        .services(process.env.TWILIO_SERVICE_SID as string)
        .verificationChecks
        .create({
            to: `+91${phoneNumber}`,
            code
        })
        .then((data: any) => {
            res.status(200).send(data);
        })
        .catch((err: any) => {
            console.log(err);
            res.status(500).send("Internal server error");
        });
}


