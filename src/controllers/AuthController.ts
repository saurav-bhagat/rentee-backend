import {Request, Response} from "express";
import getJwtToken, {verifyRefreshToken} from "../utils/token";
import User from "../models/User";
import handleAuthError from "../utils/auth-error-handler";

export interface UserPayload {
    user?: {
        id: number;
        username: string;
        email: string;
    };
    iat?: number; //
}

export class AuthController {
    signUp = async (req: Request, res: Response) => {
        const {name, email, password, phoneNumber} = req.body;
        try {
            const user = await User.create({name, email, password, phoneNumber});
            console.log(user);
            res.json(user);
        } catch (error) {
            console.log(error);
            const err = handleAuthError(error);
            // @ts-ignore
            res.json({err});
        }
    };
    // for login purposes
    authenticate = async (req: Request, res: Response) => {
        const {email, password} = req.body;
        try {
            const user = await User.login(email, password);
            // let user = userData.user;

            const accessToken = await getJwtToken(user, process.env.JWT_ACCESS_SECRET as string, "10s");
            const refreshToken = await getJwtToken(user, process.env.JWT_REFRESH_SECRET as string, "1d");
            // Todo: store refreshtokens in db

            res.json({
                accessToken: accessToken,
                refreshToken: refreshToken,
            });
        } catch (error) {
            console.log(error);
            const err = handleAuthError(error);
            // @ts-ignore
            res.json({err});
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

            res.json({
                accessToken: accessToken,
                refreshToken: newRefreshToken,
            });
        } catch (err) {
            res.json({err});
        }
    };
}
