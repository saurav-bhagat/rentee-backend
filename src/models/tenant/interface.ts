import {Schema, Document} from "mongoose";

export interface ITenant extends Document {
    _id: Schema.Types.ObjectId;
    personId: Schema.Types.ObjectId;
    joinDate: Date;
    rentDueDate: Date;
    securityAmount: Number;
}
