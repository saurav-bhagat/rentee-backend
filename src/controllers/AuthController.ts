import {sign, verify} from "jsonwebtoken";
import {Request, Response} from "express";

export interface UserPayload {
    user?: {
        id: number;
        username: string;
        email: string;
    };
    iat?: number;
}

export class AuthController {
    login = (req: Request, res: Response) => {
        //userdata will come from client
        const userData: UserPayload = {
            user: {
                id: 1,
                username: "saurav",
                email: "saurav@gmail.com",
            },
        };
        let user = userData.user;
        sign({user}, process.env.JWT_SECRET as string, (err: any, token: any) => {
            res.json({
                token,
            });
        });
    };

    verifyUser = (req: any, res: any) => {
        if (req.user) {
            console.log(req.user);
            res.json({
                message: "From authcontroller verifyUser",
                userData: req.user,
            });
        } else {
            res.status(403);
        }
    };
}
