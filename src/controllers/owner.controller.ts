import {Request, Response} from "express";
import {isValidObjectId} from "mongoose";
import {IProperty} from "../models/property/interface";
import Property from "../models/property/property";
import User from "../models/user/User";
import {formatDbError, isEmptyFields} from "../utils/errorUtils";
import randomstring from "randomstring";

export class OwnerController {
    pong = (req: Request, res: Response) => {
        res.status(200).send("pong");
    };

    // owner add properties after signup
    addOwnerProperty = async (req: any, res: any) => {
        const {ownerId, buildings} = req.body;
        if (!ownerId || !isValidObjectId([ownerId])) {
            return res.status(400).json({err: "Incorrect owner detail"});
        }
        if (buildings === undefined || buildings.length === 0) {
            return res.status(400).json({err: "Atleast one building present"});
        }
        const propertyDetails = <IProperty>{ownerId, buildings};
        try {
            const property = new Property(propertyDetails);
            const propertyDoc = await property.save();
            return res.status(200).json({propertyDoc, msg: "All details of property added succesfully"});
        } catch (error) {
            return res.status(400).json({err: formatDbError(error)});
        }
    };

    // owner add tenant to tenant array
    tenantRegistration = async (req: any, res: any) => {
        let {name, email, phoneNumber, securityAmount, ownerId, buildId, roomId} = req.body;

        const tenantDetails = {name, email, phoneNumber, securityAmount, ownerId, buildId, roomId};

        if (isEmptyFields(tenantDetails)) {
            return res.status(400).json({err: "All fields are mandatory!"});
        }

        if (!isValidObjectId([ownerId, buildId, roomId])) {
            return res.status(400).json({err: "Either onwer/building/room  detail incorrect"});
        }

        const joinDate = new Date();
        let nextMonthDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
        const rentDueDate = nextMonthDate.toString();
        const password = randomstring.generate({length: 6, charset: "abc"});

        const tenantInfo = {name, email, password, phoneNumber, roomId, buildId, ownerId};

        try {
            const tenandDoc = await User.create(tenantInfo);

            const personId = tenandDoc._id;
            const tenantObj = {personId, joinDate, rentDueDate, securityAmount};
            console.log("tenant obj before push ", tenantObj);
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
            const propertyWithTenant = await propertyDoc?.save();
            res.status(200).json({password, msg: "Tenant added successfully"});
        } catch (error) {
            return res.status(400).json({err: formatDbError(error)});
        }
    };

    // owner dashboard details
    getAllOwnerBuildings = (req: any, res: any) => {
        const {ownerId} = req.body;
        if (!ownerId || !isValidObjectId([ownerId])) {
            return res.status(400).json({err: "Incorrect owner detail"});
        }
        if (req.user) {
            Property.findOne({ownerId})
                .populate({
                    path: "buildings.rooms.tenants.personId",
                })
                .then((user) => {
                    return res.json(user);
                });
        } else {
            res.status(400).json({err: "Invalid user"});
        }
    };
}
