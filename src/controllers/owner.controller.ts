import {Request, Response} from "express";
import Property from "../models/property";
import handleAuthError from "../utils/authErrorHandler";

export class OwnerController {
    pong = (req: Request, res: Response) => {
        res.status(200).send("pong");
    };

    sendDetails = (req: any, res: any) => {
        console.log(req.body);
        const {buildings} = req.body;
        const propertyPayload = {buildings};

        Property.collection.insert(propertyPayload, (err, result) => {
            if (err) {
                res.status(400).json({err: handleAuthError(err)});
            } else {
                res.status(200).json({result});
            }
        });
    };
}
