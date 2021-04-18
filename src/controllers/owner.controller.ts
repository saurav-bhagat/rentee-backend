import {Request, Response} from "express";

export class OwnerController {
    pong = (req: Request, res: Response) => {
        res.status(200).send("pong");
    };
}
