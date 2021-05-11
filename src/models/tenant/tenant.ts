import {Schema, model} from "mongoose";
import {ITenant} from "./interface";

const tenantSchema = new Schema(
    {
        userId: {type: Schema.Types.ObjectId, ref: "user"},
        joinDate: {type: Date, default: Date.now},
        rentDueDate: Date,
        securityAmount: Number,
        ownerId: {type: Schema.Types.ObjectId},
        roomId: {type: Schema.Types.ObjectId},
        buildId: {type: Schema.Types.ObjectId},
    },
    {timestamps: true}
);

const tenant = model<ITenant>("tenant", tenantSchema);

export default tenant;
