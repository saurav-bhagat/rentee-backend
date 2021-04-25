import {Schema, model, Document, Model} from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
import uniqueValidator from "mongoose-unique-validator";

const userSchema = new Schema({
    name: {
        type: String,
        required: [true, "Please enter your name"],
    },
    email: {
        type: String,
        required: [true, "Please enter an email"],
        unique: [true, "email is already registered"],
        lowercase: true,
        validate: [validator.isEmail, "Please enter an valid email"],
    },
    password: {
        type: String,
        required: [true, "Please enter a password"],
        minlength: [6, "Minimum password length is 6 characters"],
    },
    phoneNumber: {
        type: String,
        required: [true, "Please enter  phone number"],
        validate: [validator.isMobilePhone, "Please enter an valid phone number"],
        unique: [true, "Phone number is already registered"],
    },
    isOwner: {
        type: Boolean,
    },
});

//this method fire before doc save to db
userSchema.pre("save", async function (next) {
    const salt = await bcrypt.genSalt();
    let plainText = this.get("password");
    this.set("password", await bcrypt.hash(plainText, salt));
    next();
});

// static method to login user
userSchema.statics.login = async function (email: string, password: string) {
    const user = await this.findOne({email});
    if (user) {
        const auth = await bcrypt.compare(password, user.password);
        if (auth) {
            return user;
        }
        throw Error("incorrect password");
    } else {
        throw Error("incorrect email");
    }
};

interface basicUserDocument extends Document {
    name: {
        type: String;
    };
    email: {
        type: String;
    };
    password: {
        type: String;
    };
    phoneNumber: {
        type: String;
    };
    isOwner: {
        type: Boolean;
    };
}

interface basicUserModel extends Model<basicUserDocument> {
    login: (email: string, password: string) => object;
}

const User = model<basicUserDocument, basicUserModel>("user", userSchema);

userSchema.plugin(uniqueValidator);

export default User;
