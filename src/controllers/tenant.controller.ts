import {Request, Response} from "express";
import validator from "validator";
import User from "../models/user/User";
import Property from "../models/property/property";
import Tenant from "../models/tenant/tenant";
import bcrypt from "bcrypt";
import {verifyObjectId} from "../utils/errorUtils";
import {ITenant} from "../models/tenant/interface";

interface tenantObj {
    tenantEmail?: String;
    tenantName?: String;
    tenantPhone?: Number;
    roomNumber?: Number;
    roomType?: String;
    rent?: Number;
    floor?: String;
    joinDate?: Date;
    rentDueDate?: Date;
    security?: Number;
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
        const {userId, name, email, phoneNumber} = req.body;

        if (!verifyObjectId([userId])) {
            res.status(400).json({err: "UserId not valid"});
        }
        if (req.user) {
            // finding a tenant with userId
            const tenantDocument = await Tenant.findOne({userId});

            if (tenantDocument) {
                const {ownerId, buildId, roomId, _id: tenantId, joinDate, rentDueDate, securityAmount} = tenantDocument;
                const ownerDocument = await User.findOne({_id: ownerId});
                if (ownerDocument) {
                    const {name: ownerName, email: ownerEmail, phoneNumber: ownerPhoneNumber} = ownerDocument;
                    const propertyDocument = await Property.findOne({ownerId});
                    let result: tenantObj = {};

                    if (propertyDocument) {
                        propertyDocument.buildings.forEach((building) => {
                            if (building._id.toString() == buildId.toString()) {
                                building.rooms.forEach((room) => {
                                    if (room._id.toString() == roomId.toString()) {
                                        room.tenants.forEach((tenant) => {
                                            //@ts-ignore
                                            if (tenant.tenantId.toString() == tenantId.toString()) {
                                                result.roomNumber = room.roomNo;
                                                result.roomType = room.type;
                                                result.rent = room.rent;
                                                result.floor = room.floor;
                                                result.joinDate = tenant.joinDate;
                                                result.rentDueDate = tenant.rentDueDate;
                                                result.buildingName = building.name;
                                                result.buildingAddress = building.address;
                                                result.tenantEmail = email;
                                                result.tenantName = name;
                                                result.tenantPhone = phoneNumber;
                                                result.joinDate = joinDate;
                                                result.rentDueDate = rentDueDate;
                                                result.security = securityAmount;
                                                result.ownerEmail = ownerEmail;
                                                result.ownerName = ownerName;
                                                result.ownerPhone = ownerPhoneNumber;
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
                res.status(400).json({err: "Tenant not registered"});
            }
        } else {
            res.status(403).json({err: "Invalid user"});
        }
    };
}
