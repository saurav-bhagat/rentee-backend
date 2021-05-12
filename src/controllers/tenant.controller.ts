import {Request, Response} from "express";
import validator from "validator";
import User from "../models/user/User";
import Room from "../models/property/rooms";
import Property from "../models/property/property";
import Tenant from "../models/tenant/tenant";
import bcrypt from "bcrypt";
import {verifyObjectId} from "../utils/errorUtils";
import {IRooms} from "../models/property/interface";

interface tenantObj {
    tenantEmail?: String;
    tenantName?: String;
    tenantPhoneNumber?: Number;
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
    ownerPhoneNumber?: String;
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
        const {userId, name: tenantName, email: tenantEmail, phoneNumber: tenantPhoneNumber} = req.body;

        if (!verifyObjectId([userId])) {
            res.status(400).json({err: "UserId not valid"});
        }
        if (req.user) {
            // finding a tenant with userId
            const tenantDocument = await Tenant.findOne({userId});

            if (tenantDocument) {
                const {
                    ownerId,
                    buildId,
                    roomId,
                    _id: tenantId,
                    joinDate,
                    rentDueDate,
                    securityAmount: security,
                } = tenantDocument;

                const ownerDocument = await User.findOne({_id: ownerId});
                if (ownerDocument) {
                    const {name: ownerName, email: ownerEmail, phoneNumber: ownerPhoneNumber} = ownerDocument;

                    const propertyDocument = await Property.findOne({ownerId});
                    let result: tenantObj = {};

                    if (propertyDocument) {
                        for (let i = 0; i < propertyDocument.buildings.length; i += 1) {
                            let building = propertyDocument.buildings[i];

                            if (building._id.toString() == buildId.toString()) {
                                const {name: buildingName, address: buildingAddress} = building;

                                const roomDocument = await Room.findOne({_id: roomId});
                                const {rent, type: roomType, floor, roomNo: roomNumber} = <IRooms>roomDocument;

                                result = {
                                    tenantEmail,
                                    tenantName,
                                    tenantPhoneNumber,
                                    roomNumber,
                                    roomType,
                                    rent,
                                    floor,
                                    joinDate,
                                    rentDueDate,
                                    security,
                                    buildingName,
                                    buildingAddress,
                                    ownerName,
                                    ownerEmail,
                                    ownerPhoneNumber,
                                };
                            }
                        }

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
