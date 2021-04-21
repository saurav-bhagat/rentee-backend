import * as jwt from "jsonwebtoken";
import {UserPayload} from "../controllers/AuthController";

const verifyToken = (token: any, secret: any) => {
    return jwt.verify(token, secret as string) as UserPayload;
};

export default (req: any, res: any, next: any) => {
    const authHeader = req.get("Authorization");
    const refreshHeader = req.get("x-refresh-token");
    let decodedToken: UserPayload;

    if (!authHeader) {
        req.isAuth = false;
        return next();
    }
    const token = authHeader.split(" ")[1];
    //console.log("token is ",token)
    if (!token || token === "") {
        req.isAuth = false;
        return next();
    }

    try {
        if (refreshHeader) {
            decodedToken = verifyToken(token, process.env.JWT_REFRESH_SECRET);
        } else {
            decodedToken = verifyToken(token, process.env.JWT_ACCESS_SECRET);
        }
        console.log("Decoded token is: ", decodedToken);
    } catch (err) {
        console.log(err);
        req.isAuth = false;
        return next();
    }
    if (!decodedToken) {
        req.isAuth = false;
        return next();
    }
    req.isAuth = true;
    req.user = decodedToken.user;
    next();
};
