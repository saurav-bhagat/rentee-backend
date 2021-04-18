import * as jwt from "jsonwebtoken";
import {UserPayload} from "../controllers/AuthController";

export default (req: any, res: any, next: any) => {
    const authHeader = req.get("Authorization");
    let decodedToken: UserPayload;

    if (!authHeader) {
        req.isAuth = false;
        return next();
    }
    const token = authHeader.split(" ")[1];
    if (!token || token === "") {
        req.isAuth = false;
        return next();
    }

    try {
        decodedToken = jwt.verify(token, process.env.JWT_SECRET as string) as UserPayload;
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
