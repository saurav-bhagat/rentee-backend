import mongoose, {Schema, Document} from "mongoose";

// This the type of tenant which is present in building
export interface ITenantInBuilding extends Document {
    _id: Schema.Types.ObjectId;
    tenantId: Schema.Types.ObjectId;
}

export interface IRooms extends Document {
    _id: Schema.Types.ObjectId;
    rent: Number;
    type: String;
    floor: String;
    roomNo: Number;
    isEmpty: Boolean;
}

// This is type of room which is present in building
export interface IRoomsInBuilding extends Document {
    _id: Schema.Types.ObjectId;
    roomId: Schema.Types.ObjectId;
    tenants: mongoose.Types.Array<ITenantInBuilding>;
}

export interface IBuilding extends Document {
    _id: Schema.Types.ObjectId;
    name: String;
    address: String;
    rooms: mongoose.Types.Array<IRoomsInBuilding>;
}

export interface IProperty extends Document {
    _id: Schema.Types.ObjectId;
    ownerId: Schema.Types.ObjectId;
    buildings: mongoose.Types.Array<IBuilding>;
}
