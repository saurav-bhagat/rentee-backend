import {sign, verify} from "jsonwebtoken";

const createToken = (userId: any, jwtSecret: string, expireTime: string) => {
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
            resolve(token);
        });
    });
};

export const verifyRefreshToken = (refreshToken: string) => {
    return new Promise((resolve, reject) => {
        verify(refreshToken, process.env.JWT_REFRESH_SECRET as string, (err, payload) => {
            if (err) return reject("Authorization Error");
            resolve(payload);
        });
    });
};

export default createToken;
