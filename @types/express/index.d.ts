import { IUser } from "../../src/models/user/interface";

declare global{
    namespace Express {
        interface Request {
            isAuth: boolean,
            user: IUser
        }
    }
}