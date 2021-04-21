import {Request, Response} from "express";
import signAccessToken from "../helper/jwt_helper";
import signRefreshToken from "../helper/jwt_helper";

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
        const accessToken = await signAccessToken(user, process.env.JWT_ACCESS_SECRET, "10s");
        const refreshToken = await signRefreshToken(user, process.env.JWT_REFRESH_SECRET, "1d");

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

    verifyRefreshToken = async (req: any, res: any) => {
        if (req.user) {
            const user = req.user;
            const accessToken = await signAccessToken(user, process.env.JWT_ACCESS_SECRET, "40s");
            const refreshToken = await signRefreshToken(user, process.env.JWT_REFRESH_SECRET, "1d");
            res.json({
                accessToken: accessToken,
                refreshToken: refreshToken,
            });
        } else {
            res.status(403).json({err: "user not found"});
        }
    };
}
