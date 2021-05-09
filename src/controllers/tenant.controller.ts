import {Request, Response} from "express";
import validator from "validator";
import User from "../models/user/User";
import Property from "../models/property/property";
import bcrypt from "bcrypt";
import {verifyObjectId} from "../utils/errorUtils";

interface tenantObj {
    tenantName?: String;
    tenantPhone?: Number;
    roomNumber?: Number;
    roomType?: String;
    rent?: Number;
    floor?: String;
    joinDate?: Date;
    rentDueDate?: Date;
    buildingName?: String;
    buildingAddress?: String;
    ownerName?: String;
    ownerEmail?: String;
    ownerPhone?: String;
}

export class TenantController {
    // Password update on first login
    updateTenantPassword = async (req: any, res: Response) => {
        const {email, password} = req.body;

        if (req.user) {
            if (!email || !password) {
                return res.json({err: "All fields are mandatory!"});
            }
            if (!validator.isEmail(email) || password.length < 6) {
                return res.json({err: "Either email/password incorrect"});
            }

            const tenant = await User.findOne({email});
            if (tenant) {
                const salt = await bcrypt.genSalt();
                const newPassword = await bcrypt.hash(password, salt);

                const updatedUser = await tenant.updateOne({password: newPassword});
                if (updatedUser) {
                    return res.status(200).json({msg: "Password updated successfully"});
                }
                return res.status(400).json({err: "Failed to update"});
            }
            return res.status(400).json({err: "Tenant does not exit"});
        } else {
            return res.status(403).json({err: "Invalid user"});
        }
    };

    // Tenant dashboard details
    //modify the query to filter the building too
    tenantInfo = async (req: any, res: any) => {
        const {buildId, ownerId, roomId, tenantId, name} = req.body;

        if (!verifyObjectId([buildId, ownerId, roomId, tenantId])) {
            res.status(400).json({err: "Either owner/building/room/tenant not valid"});
        }

        if (req.user) {
            const propertyDocument = await Property.findOne({ownerId});
            const ownerDetails = await User.findOne({ownerId});
            let result: tenantObj = {};
            result.tenantName = name;
            if (ownerDetails) {
                result.ownerName = ownerDetails.name;
                result.ownerPhone = ownerDetails.phoneNumber;
                result.ownerEmail = ownerDetails.email;
                if (propertyDocument) {
                    propertyDocument.buildings.forEach((building) => {
                        if (building._id == buildId) {
                            building.rooms.forEach((room) => {
                                if (room._id == roomId) {
                                    room.tenants.forEach((tenant) => {
                                        if (tenant.personId == tenantId) {
                                            result.roomNumber = room.roomNo;
                                            result.roomType = room.type;
                                            result.rent = room.rent;
                                            result.floor = room.floor;
                                            result.joinDate = tenant.joinDate;
                                            result.rentDueDate = tenant.rentDueDate;
                                            result.buildingName = building.name;
                                            result.buildingAddress = building.address;
                                        }
                                    });
                                }
                            });
                        }
                    });
                    res.status(200).json({result, msg: "successfully fetch tenant"});
                } else {
                    res.status(400).json({err: "Owner not found"});
                }
            } else {
                res.status(400).json({err: "Owner not found"});
            }
        } else {
            res.status(403).json({err: "Invalid user"});
        }
    };
}
