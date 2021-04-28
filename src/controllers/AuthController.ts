import {Request, Response} from "express";
import getJwtToken, {verifyRefreshToken} from "../utils/token";
import {sendOTP, verifyOTP} from "../utils/phoneNumberVerification";
import User from "../models/User";
import handleAuthError from "../utils/authErrorHandler";

export interface UserPayload {
    user?: {
        id: number;
        username: string;
        email: string;
    };
    iat?: number;
    // _id?: string;
    // name:string;
    // email:string;
    // password:string;
    // phoneNumber:number;
    // isOwner:boolean;
    // token:string;
    // iat?: number;
}

export class AuthController {
    signUp = async (req: Request, res: Response) => {
        const {name, email, password, phoneNumber} = req.body;
        const userData = {name, email, password, phoneNumber};

        try {
            const userdoc = await User.create(userData);

            //  Genrating tokens
            const accessToken = await getJwtToken(userdoc, process.env.JWT_ACCESS_SECRET as string, "10s");
            const refreshToken = <string>await getJwtToken(userdoc, process.env.JWT_REFRESH_SECRET as string, "1d");

            //Providing token to user
            const user = await User.addRefreshToken(userdoc._id, refreshToken);
            console.log(user);

            res.status(200).json({user, accessToken});
        } catch (error) {
            console.log(error);
            res.status(400).json({err: handleAuthError(error)});
        }
    };

    // for login purposes
    authenticate = async (req: Request, res: Response) => {
        const {email, password} = req.body;
        if (!email || !password) res.status(400).json({err: "Invalid Email/Password"});

        try {
            const userdoc = await User.login(email, password);

            // For generating tokens
            const accessToken = await getJwtToken(userdoc, process.env.JWT_ACCESS_SECRET as string, "10s");
            const refreshToken = <string>await getJwtToken(userdoc, process.env.JWT_REFRESH_SECRET as string, "1d");

            //@ts-ignore
            const user = await User.addRefreshToken(userdoc._id, refreshToken);
            console.log(user);

            res.status(200).json({
                user,
                accessToken: accessToken,
            });
        } catch (error: any) {
            console.log(error);
            res.status(400).json({err: handleAuthError(error)});
        }
    };

    handleRefreshToken = async (req: any, res: any) => {
        const {refreshToken} = req.body;

        try {
            if (!refreshToken) throw Error("refresh token error");

            // token validation
            const userInToken = await verifyRefreshToken(refreshToken);

            //@ts-ignore
            const validUser = await User.findUserForRefreshToken(user.user._id, refreshToken);

            // Generating token
            const accessToken = await getJwtToken(userInToken, process.env.JWT_ACCESS_SECRET as string, "40s");
            const newRefreshToken = <string>(
                await getJwtToken(userInToken, process.env.JWT_REFRESH_SECRET as string, "1d")
            );

            //@ts-ignore
            const user = await User.addRefreshToken(validUser._id, newRefreshToken);
            console.log(user);

            res.status(200).json({
                user,
                accessToken: accessToken,
            });
        } catch (error) {
            res.status(400).json({err: error.message});
        }
    };

    sendSms = (req: Request, res: Response) => {
        sendOTP(req, res);
    };

    verifySms = (req: Request, res: Response) => {
        verifyOTP(req, res);
    };
}
