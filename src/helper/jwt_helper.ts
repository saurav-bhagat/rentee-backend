import {sign} from "jsonwebtoken";

const createToken = (userId: any, jwtSecret: any, expireTime: string) => {
    return new Promise((resolve, reject) => {
        const payload = {
            user: userId,
        };
        const secret = jwtSecret;
        const options = {
            expiresIn: expireTime,
            issuer: "rentee.com",
            // audience: userId,
        };
        sign(payload, secret, options, (err, token) => {
            if (err) {
                console.log(err.message);
                reject(err);
                return;
            }
            resolve(token);
        });
    });
};

export default createToken;
