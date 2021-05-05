import {Request, Response} from "express";
import {isValidObjectId} from "mongoose";
import {IProperty} from "../models/property/interface";
import Property from "../models/property/property";
import User from "../models/user/User";
import handleDbError, {isEmptyFields} from "../utils/dbErrorhandler";
import randomstring from "randomstring";

export class OwnerController {
    pong = (req: Request, res: Response) => {
        res.status(200).send("pong");
    };

    addOwnerProperty = async (req: any, res: any) => {
        const {ownerId, buildings} = req.body;
        if (ownerId === null) {
            return res.status(400).json({err: "ownerId can't be null"});
        } else {
            if (!isValidObjectId(ownerId)) {
                return res.status(400).json({err: "objectId not correct"});
            }
        }
        if (buildings === undefined || buildings.length === 0) {
            return res.status(400).json({err: "atleast one building present"});
        }
        const propertyDetails = <IProperty>{ownerId, buildings};
        try {
            const property = new Property(propertyDetails);
            const propertyDoc = await property.save();
            return res.status(200).json({propertyDoc, msg: "all details of property added succesfully"});
        } catch (error) {
            return res.status(400).json({err: handleDbError(error)});
        }
    };

    tenantRegistration = async (req: any, res: any) => {
        let {name, email, phoneNumber, securityAmount, ownerId, buildId, roomId} = req.body;

        const tenantDetails = {name, email, phoneNumber, securityAmount, ownerId, buildId, roomId};

        if (isEmptyFields(tenantDetails)) {
            return res.status(400).json({err: "All fields are mandatory!"});
        }
        if (!isValidObjectId(ownerId)) {
            return res.status(400).json({err: "objectId not correct"});
        }
        if (!isValidObjectId(buildId)) {
            return res.status(400).json({err: "buildId not correct"});
        }
        if (!isValidObjectId(roomId)) {
            return res.status(400).json({err: "roomId not correct"});
        }
        const joinDate = new Date();
        const rentDueDate = new Date(joinDate.getFullYear(), joinDate.getMonth() + 1, 1);

        const password = randomstring.generate({length: 4, charset: "abc"});

        const tenantInfo = {name, email, password, phoneNumber};

        try {
            const tenandDoc = await User.create(tenantInfo);

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
            const propertyWithTenant = await propertyDoc?.save();
            res.status(200).json({password, msg: "tenant added successfully"});
        } catch (error) {
            return res.status(400).json({err: handleDbError(error)});
        }
    };

    getAllOwnerBuildings = (req: any, res: any) => {
        const {ownerId} = req.body;
        if (!isValidObjectId(ownerId)) {
            return res.status(400).json({err: "objectId not correct"});
        }
        if (req.user) {
            Property.findOne({ownerId})
                .populate("buildings") // key to populate
                .then((user) => {
                    return res.json(user);
                });
        } else {
            res.status(400).json({err: "invalid user"});
        }
    };
}
