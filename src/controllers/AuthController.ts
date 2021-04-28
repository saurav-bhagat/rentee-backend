import {Request, Response} from "express";
import getJwtToken, {verifyRefreshToken} from "../utils/token";
import User from "../models/User";
import handleAuthError from "../utils/authErrorHandler";
import NodeMailer from "../config/nodemailer";

export interface UserPayload {
    user?: {
        id: number;
        username: string;
        email: string;
        resetLink?: string;
    };
    iat?: number;
}

export class AuthController {
    signUp = async (req: Request, res: Response) => {
        const {name, email, password, phoneNumber} = req.body;
        const userData = {name, email, password, phoneNumber};

        try {
            const user = await User.create(userData);
            console.log(user);
            return res.status(200).json(user);
        } catch (error) {
            console.log(error);
            return res.status(400).json({err: handleAuthError(error)});
        }
    };

    // for login purposes
    authenticate = async (req: Request, res: Response) => {
        const {email, password} = req.body;
        if (!email || !password) res.status(400).json({err: "Invalid Email/Password"});

        try {
            //will verify user password
            const user = await User.login(email, password);

            const accessToken = await getJwtToken(user, process.env.JWT_ACCESS_SECRET as string, "10s");
            const refreshToken = await getJwtToken(user, process.env.JWT_REFRESH_SECRET as string, "1d");
            // Todo: store refreshtokens in db

            return res.status(200).json({
                user,
                accessToken: accessToken,
                refreshToken: refreshToken,
            });
        } catch (error: any) {
            console.log(error);
            return res.status(400).json({err: handleAuthError(error)});
        }
    };

    handleRefreshToken = async (req: any, res: any) => {
        const {refreshToken} = req.body;

        try {
            if (!refreshToken) throw Error("refresh token error");
            // verifyrefresh token method verify token and give us the payload inside it
            const user: UserPayload = await verifyRefreshToken(refreshToken, <string>process.env.JWT_REFRESH_SECRET);

            //Todo: we need to verify the refresh token provide by post req vs refresh token in db
            //       and user store in token vs user store in db

            const accessToken = await getJwtToken(user, process.env.JWT_ACCESS_SECRET as string, "40s");
            const newRefreshToken = await getJwtToken(user, process.env.JWT_REFRESH_SECRET as string, "1d");

            //Todo :
            // after verifying and generating token we need to store new refreshToken corresponds to user in db

            return res.status(200).json({
                user,
                accessToken: accessToken,
                refreshToken: newRefreshToken,
            });
        } catch (error) {
            return res.status(400).json({err: error.message});
        }
    };

    forgotPassword = async (req: any, res: any) => {
        const {email} = req.body;
        if (!email) res.status(400).json({err: "Please Enter your email"});

        const nodeMailer = new NodeMailer();
        try {
            const user = await User.findOne({email});
            //not finding a user in DB is not an error, so it will not go inside catch block, it needs to be handled here
            if (user) {
                const token = await getJwtToken(user, process.env.JWT_RESET_SECRET as string, "20m");
                //saving reset link as when frontend will send request to resetPassword, token should be verified
                //and password should be updated for that user
                const updatedUser = await user?.updateOne({resetLink: token});
                const mailData = {
                    to: user?.email,
                    subject: "Reset Password",
                    html: `
                        <h2>Reset Password using this link:</h2>
                        <p><a href="${process.env.CLIENT_URL}/resetpassword/${token}">Rest Password Link</a></p>
                    `,
                };
                if (nodeMailer.sendMail(mailData))
                    return res.status(200).json({msg: "Please check your registered Email ID", token, updatedUser});
            }
            return res.status(400).json({err: "Email Does not exist"});
        } catch (err) {
            return res.status(400).json({err: "Password reset Failed, try again"});
        }
    };

    resetPassword = async (req: any, res: any) => {
        const {newPassword, token} = req.body;
        console.log(newPassword, token);
        if (!newPassword || !token) {
            res.status(400).json({err: "Password reset failed, try again!"});
        }
        console.log("Going inside rty")
        try {
            const userData = await verifyRefreshToken(token, <string>process.env.JWT_RESET_SECRET);
            // console.log(userData, token);

            if (userData.user?.resetLink == token) {
                const updatedUser = await User.findOneAndUpdate(
                    {resetLink: token},
                    {
                        password: newPassword,
                    }
                );
                console.log("Password updated: ", updatedUser);
            } else {
                console.log("RestLink coming from jwt decode and token coming from frontend are not equal");
            }
        } catch (err) {
            console.log(err);
        }
    };
}
