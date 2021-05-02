import {sign, verify} from "jsonwebtoken";
import {IUser} from "../models/User";

const createToken = (user: IUser, jwtSecret: string, expireTime: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const payload = {
            _id: user._id,
            name: user.name,
            email: user.email,
            password: user.password,
            phoneNumber: user.phoneNumber,
            isOwner: user.isOwner,
            resetLink: user.resetLink,
        };
        const options = {
            expiresIn: expireTime,
            issuer: "rentee.com",
            // audience: userId,
        };
        sign(payload, jwtSecret, options, (err, token) => {
            if (err) {
                console.log("Error while signing token: ", err.message);
                reject(err);
            }
            //we use ! as we know at this line token can't be null
            resolve(token!);
        });
    });
};

export const verifyRefreshToken = (refreshToken: string, secret: string): Promise<IUser> => {
    return new Promise((resolve, reject) => {
        verify(refreshToken, secret, (err, payload) => {
            if (err) return reject("Authorization Error");
            resolve(<IUser>payload);
        });
    });
};

export default createToken;
