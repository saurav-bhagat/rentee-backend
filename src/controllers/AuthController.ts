import {Request, Response} from "express";
import getJwtToken, {verifyRefreshToken} from "../utils/token";
import User from "../models/user/User";
import {IUser} from "../models/user/interface";
import {sendOTP, verifyOTP} from "../utils/phoneNumberVerification";
import {handleDbError, isEmptyFields} from "../utils/errorUtils";
import NodeMailer from "../config/nodemailer";
import validator from "validator";
import bcrypt from "bcrypt";

export class AuthController {
    signUp = async (req: Request, res: Response) => {
        const {name, email, password, phoneNumber} = req.body;
        const userData = {name, email, password, phoneNumber};
        if (isEmptyFields(userData)) {
            return res.status(400).json({err: "All fields are mandatory!"});
        }

        if (!validator.isEmail(email) || password.length < 6 || !validator.isMobilePhone(phoneNumber)) {
            return res.status(400).json({err: "Either email/password/phonenumber is not valid"});
        }

        try {
            const userdoc = await User.create(userData);

            const accessToken = await getJwtToken(userdoc, process.env.JWT_ACCESS_SECRET as string, "10m");
            const refreshToken = await getJwtToken(userdoc, process.env.JWT_REFRESH_SECRET as string, "1d");

            const user = await User.addRefreshToken(userdoc._id, refreshToken);

            return res.status(200).json({user, accessToken});
        } catch (error) {
            return res.status(400).json({err: handleDbError(error)});
        }
    };

    authenticate = async (req: Request, res: Response) => {
        const {email, password} = req.body;
        const userData = {email, password};

        if (isEmptyFields(userData)) {
            return res.status(400).json({err: "All fields are mandatory!"});
        }

        if (!validator.isEmail(email) || password.length < 6) {
            return res.status(400).json({err: "Either email/password is not valid"});
        }

        try {
            const userdoc: IUser = await User.login(email, password);

            // For generating tokens
            const accessToken = await getJwtToken(userdoc, process.env.JWT_ACCESS_SECRET as string, "10m");
            const refreshToken = await getJwtToken(userdoc, process.env.JWT_REFRESH_SECRET as string, "1d");

            const user = await User.addRefreshToken(userdoc._id, refreshToken);

            return res.status(200).json({
                user,
                accessToken: accessToken,
            });
        } catch (error: any) {
            return res.status(400).json({err: handleDbError(error)});
        }
    };

    handleRefreshToken = async (req: any, res: any) => {
        const {refreshToken} = req.body;
        if (refreshToken.length == 0) {
            return res.status(400).json({err: "All fields are mandatory!"});
        }
        try {
            if (!refreshToken) throw Error("Refresh token error");

            // verifyrefresh token method verify token and give us the payload inside it
            const userData = await verifyRefreshToken(refreshToken, <string>process.env.JWT_REFRESH_SECRET);

            const validUser = await User.findUserForRefreshToken(userData._id, refreshToken);

            const accessToken = await getJwtToken(userData, process.env.JWT_ACCESS_SECRET as string, "2m");
            const newRefreshToken = await getJwtToken(userData, process.env.JWT_REFRESH_SECRET as string, "1d");

            const user = await User.addRefreshToken(validUser._id, newRefreshToken);

            return res.status(200).json({
                user,
                accessToken: accessToken,
            });
        } catch (error) {
            return res.status(400).json({err: error.message});
        }
    };

    forgotPassword = async (req: any, res: any) => {
        const {email} = req.body;
        if (!email) return res.status(400).json({err: "Email is  mandatory!"});
        if (!validator.isEmail(email)) {
            return res.json({err: "Email is not valid"});
        }
        const nodeMailer = new NodeMailer();
        try {
            const user = await User.findOne({email});
            //not finding a user in DB is not an error, so it will not go inside catch block, it needs to be handled here
            if (user) {
                const token = await getJwtToken(user, process.env.JWT_RESET_SECRET as string, "20m");

                const updatedUser = await user?.updateOne({resetLink: token});

                const mailData = {
                    to: user?.email,
                    subject: "Reset Password",
                    html: `
                        <h2>Reset Password using this link:</h2>
                        <p><a href="${process.env.CLIENT_URL}/resetpassword/${token}">Rest Password Link</a></p>
                    `,
                };
                if (nodeMailer.sendMail(mailData))
                    return res.status(200).json({msg: "Please check your registered Email ID", token, updatedUser});
            }
            return res.status(400).json({err: "Email Does not exist"});
        } catch (err) {
            return res.status(400).json({err: "Password reset Failed, try again"});
        }
    };

    resetPassword = async (req: any, res: any) => {
        const {newPassword, token} = req.body;

        if (!newPassword || !token) {
            return res.status(400).json({err: "All fields are mandatory!"});
        }
        if (newPassword.length < 6) {
            return res.json({err: "Minimum password length is 6 characters"});
        }
        try {
            await verifyRefreshToken(token, <string>process.env.JWT_RESET_SECRET);

            const salt = await bcrypt.genSalt();
            const password = await bcrypt.hash(newPassword, salt);

            let userInDb: IUser = <IUser>await User.findOneAndUpdate(
                {
                    resetLink: token,
                },
                {
                    password,
                    resetLink: "",
                },
                {
                    new: true,
                    runValidators: true,
                    context: "query",
                },
                (err, doc) => {
                    if (err || !doc) {
                        console.log(err);
                        res.status(400).json({err: "Password update failed, try again!!"});
                    }
                    res.status(200).json({msg: "Password Updated Successfuly"});
                }
            );
        } catch (err) {
            res.status(400).json({err: "Incorrect token sent - Authorization error"});
        }
    };

    sendSms = (req: Request, res: Response) => {
        console.log("receiving phone number for opt");
        //For development purposes we need to comment the below function
        // sendOTP(req, res);
    };

    verifySms = (req: Request, res: Response) => {
        //For development purposes we need to comment the below function
        //  verifyOTP(req, res);
    };
}
