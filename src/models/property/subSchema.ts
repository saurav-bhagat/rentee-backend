import {Schema} from "mongoose";

export const buildingSchema = new Schema({
    name: {type: String, required: [true, "Please enter building name"]},
    address: {type: String, required: [true, "Please enter building address"]},
    rooms: [
        {
            roomId: {type: Schema.Types.ObjectId, ref: "room"},
            tenants: [{tenantId: {type: Schema.Types.ObjectId, ref: "tenant"}}],
        },
    ],
});
