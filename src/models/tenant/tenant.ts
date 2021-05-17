import {Schema, model} from "mongoose";
import {ITenant} from "./interface";

const tenantSchema = new Schema(
    {
        userId: {type: Schema.Types.ObjectId, ref: "user"},
        joinDate: {type: Date, default: Date.now},
        rentDueDate: String,
        securityAmount: Number,
        ownerId: {type: Schema.Types.ObjectId, ref: "user"},
        roomId: {type: Schema.Types.ObjectId, ref: "room"},
        buildId: {type: Schema.Types.ObjectId},
    },
    {timestamps: true}
);

const tenant = model<ITenant>("tenant", tenantSchema);

export default tenant;
