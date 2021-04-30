import {Schema, model, Document, Model} from "mongoose";
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
                            joinDate: {type: Date, default: Date.now},
                            rentDueDate: Date,
                            securityAmount : Number,
                        },
                    ],
                },
            ],
        },
    ],
});


interface propertyDocument extends Document{
        buildings:[
            {
                name:String;
                address:String;
                rooms:[
                    rent:Number,
                    type:String,
                    floor:String,
                    roomNo:Number,
                    isEmpty:Boolean,
                    tenants:[
                        personId:String,
                        joinDate:Date,
                        rentDueDate:Date,
                        securityAmount:Number
                    ]
                ]
            }
        ]
}


const property = model<propertyDocument>("property", propertySchema);

propertySchema.plugin(uniqueValidator, {message: "{PATH} already exist"});

export default property;
