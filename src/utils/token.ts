import {sign, verify} from "jsonwebtoken";
import { UserPayload } from "../controllers/AuthController";

const createToken = (userId: any, jwtSecret: string, expireTime: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const payload = {
            user: userId,
        };
        const options = {
            expiresIn: expireTime,
            issuer: "rentee.com",
            // audience: userId,
        };
        sign(payload, jwtSecret, options, (err, token) => {
            if (err) {
                console.log(err.message);
                reject(err);
                return;
            }
            //we use ! as we know at this line token can't be null
            resolve(token!);
        });
    });
};

export const verifyRefreshToken = (refreshToken: string, secret: string): Promise<UserPayload> => {
    return new Promise((resolve, reject) => {
        verify(refreshToken, secret, (err, payload) => {
            if (err) return reject("Authorization Error");
            resolve(<UserPayload>payload);
        });
    });
};

export default createToken;
