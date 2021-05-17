import * as jwt from "jsonwebtoken";
import { IUser } from "../models/user/interface";

export default (req: any, res: any, next: any) => {
	const authHeader = req.get("Authorization");
	let decodedToken: IUser;

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
		decodedToken = <IUser>jwt.verify(token, process.env.JWT_ACCESS_SECRET as string);
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
	req.user = decodedToken;
	next();
};
