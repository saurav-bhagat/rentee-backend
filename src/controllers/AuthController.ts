import {Request, Response} from "express";
import getJwtToken, {verifyRefreshToken} from "../utils/token";
import User from "../models/User";
import handleAuthError from "../utils/authErrorHandler";

export interface UserPayload {
    user?: {
        id: number;
        username: string;
        email: string;
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
            res.status(200).json(user);
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
            //will verify user password
            const user = await User.login(email, password);

            const accessToken = await getJwtToken(user, process.env.JWT_ACCESS_SECRET as string, "10s");
            const refreshToken = await getJwtToken(user, process.env.JWT_REFRESH_SECRET as string, "1d");
            // Todo: store refreshtokens in db

            res.status(200).json({
                user,
                accessToken: accessToken,
                refreshToken: refreshToken,
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
            // verifyrefresh token method verify token and give us the payload inside it
            const user: UserPayload = (await verifyRefreshToken(refreshToken)) as UserPayload;
            console.log(user);

            //Todo: we need to verify the refresh token provide by post req vs refresh token in db
            //       and user store in token vs user store in db

            const accessToken = await getJwtToken(user, process.env.JWT_ACCESS_SECRET as string, "40s");
            const newRefreshToken = await getJwtToken(user, process.env.JWT_REFRESH_SECRET as string, "1d");

            //Todo :
            // after verifying and generating token we need to store new refreshToken corresponds to user in db

            res.status(200).json({
                user,
                accessToken: accessToken,
                refreshToken: newRefreshToken,
            });
        } catch (error) {
            res.status(400).json({err: error.message});
        }
    };
}
