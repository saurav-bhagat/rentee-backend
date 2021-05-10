import {Schema} from "mongoose";

export const roomSchema = new Schema({
    rent: {type: Number, required: [true, "Please enter room rent"]},
    type: {type: String, required: [true, "Please enter room type"]},
    floor: {type: String, required: [true, "Please enter floor type"]},
    roomNo: {type: Number, required: [true, "Please enter room number"]},
    isEmpty: {type: Boolean},
    tenants: [{tenantId: {type: Schema.Types.ObjectId, ref: "tenant"}}],
});

export const buildingSchema = new Schema({
    name: {type: String, required: [true, "Please enter building name"]},
    address: {type: String, required: [true, "Please enter building address"]},
    rooms: [roomSchema],
});
