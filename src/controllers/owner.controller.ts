import {Request, Response} from "express";
import Property from "../models/property/property";
import User from "../models/user/User";
import handleAuthError from "../utils/authErrorHandler";
import getJwtToken from "../utils/token";

export class OwnerController {
    pong = (req: Request, res: Response) => {
        res.status(200).send("pong");
    };

    sendDetails = async (req: any, res: any) => {
        const {ownerId, buildings} = req.body;
        const propertyDetails = {ownerId, buildings};
        try {
            const property = new Property(propertyDetails);
            const propertyDoc = await property.save();
            res.status(200).json({propertyDoc, msg: "all details of property added succesfully"});
        } catch (error) {
            console.log(error);
            res.status(400).json(error);
        }
    };

    tenantRegistration = async (req: any, res: any) => {
        let {
            name,
            email,
            password,
            phoneNumber,
            joinDate,
            rentDueDate,
            securityAmount,
            ownerId,
            buildId,
            roomId,
        } = req.body;

        joinDate = new Date(joinDate);

        rentDueDate = new Date();
        rentDueDate.setMonth(rentDueDate.getMonth() + 1);
        rentDueDate = new Date(rentDueDate);

        const tenantInfo = {name, email, password, phoneNumber};

        try {
            const tenandDoc = await User.create(tenantInfo);

            //  Genrating tokens
            const refreshToken = await getJwtToken(tenandDoc, process.env.JWT_REFRESH_SECRET as string, "1d");

            //Providing token to user
            const user = await User.addRefreshToken(tenandDoc._id, refreshToken);

            const personId = tenandDoc._id;
            const tenantObj = {personId, joinDate, rentDueDate, securityAmount};

            const propertyDoc = await Property.findOne({ownerId});

            propertyDoc?.buildings.forEach((building) => {
                if (building._id == buildId) {
                    building.rooms.forEach((room) => {
                        if (room._id == roomId) {
                            room.tenants.push(tenantObj);
                        }
                    });
                }
            });
            const result = await propertyDoc?.save();
            res.status(200).json({result, msg: "tenant added successfully"});
        } catch (error) {
            console.log(error);
            return res.status(400).json({err: handleAuthError(error)});
        }
    };

    getAllOwnerBuildings = (req: any, res: any) => {
        const {ownerId} = req.body;
        console.log(ownerId);
        Property.findOne({ownerId})
            .populate("buildings") // key to populate
            .then((user) => {
                res.json(user);
            });
    };
}
