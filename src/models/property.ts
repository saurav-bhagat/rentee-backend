import {Schema, model, Document, Model} from "mongoose";
import validator from "validator";
import uniqueValidator from "mongoose-unique-validator";

const propertySchema = new Schema({
    buildings: [
        {
            name: {type: String, required: [true, "Please enter building name"]},
            address: {type: String, required: [true, "Please enter building address"]},
            rooms: [
                {
                    rent: {type: Number, required: [true, "Please enter room rent"]},
                    type: {type: String, required: [true, "Please enter room type"]},
                    floor: {type: String, required: [true, "Please enter floor type"]},
                    roomNo: {type: Number, required: [true, "Please enter room number"]},
                    //amenities:[{}],
                    isEmpty: {type: Boolean},
                    tenants: [
                        {
                            personId: {type: Schema.Types.ObjectId, ref: "user"},
                            // personId: String,
                            joinDate: {type: Date, default: Date.now},
                            rentDueDate: Date,
                            //securityPaid: {type: Number, required: [true, "Please enter security paid"]},
                            securityPaid: Number,
                        },
                    ],
                },
            ],
        },
    ],
});

const property = model("property", propertySchema);

propertySchema.plugin(uniqueValidator, {message: "{PATH} already exist"});

export default property;
