import mongoose, {Schema, Document} from "mongoose";
import {ITenant} from "../tenant/interface";

export interface IRooms extends Document {
    _id: Schema.Types.ObjectId;
    rent: Number;
    type: String;
    floor: String;
    roomNo: Number;
    isEmpty: Boolean;
    tenants: mongoose.Types.Array<ITenant>;
}

export interface IBuilding extends Document {
    _id: Schema.Types.ObjectId;
    name: String;
    address: String;
    rooms: mongoose.Types.Array<IRooms>;
}

export interface IProperty extends Document {
    _id: Schema.Types.ObjectId;
    ownerId: Schema.Types.ObjectId;
    buildings: mongoose.Types.Array<IBuilding>;
}
