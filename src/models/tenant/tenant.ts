import {Schema, model} from "mongoose";
import {ITenant} from "./interface";

const tenantSchema = new Schema({
    personId: {type: Schema.Types.ObjectId, ref: "user"},
    joinDate: {type: Date, default: Date.now},
    rentDueDate: Date,
    securityAmount: Number,
});

const tenant = model<ITenant>("tenant", tenantSchema);

export default tenant;
