import {Request, Response} from "express";
import getJwtToken, {verifyRefreshToken} from "../helper/jwt_helper";

export interface UserPayload {
    user?: {
        id: number;
        username: string;
        email: string;
    };
    iat?: number; //
}

export class AuthController {
    login = async (req: Request, res: Response) => {
        //userdata will come from client
        const userData: UserPayload = {
            user: {
                id: 1,
                username: "saurav",
                email: "saurav@gmail.com",
            },
        };
        let user = userData.user;
        const accessToken = await getJwtToken(user, process.env.JWT_ACCESS_SECRET as string, "10s");
        const refreshToken = await getJwtToken(user, process.env.JWT_REFRESH_SECRET as string, "1d");

        // Todo: store refreshtokens in db

        res.json({
            accessToken: accessToken,
            refreshToken: refreshToken,
        });
    };

    verifyUser = (req: any, res: any) => {
        if (req.user) {
            //console.log(req.user);
            res.json({
                message: "From authcontroller verifyUser",
                userData: req.user,
            });
        } else {
            res.status(403).json({err: "user not found"});
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
