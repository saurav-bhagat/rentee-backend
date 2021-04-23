import {Schema, model} from "mongoose";
import isEmail from "validator/lib/isEmail";
import validator from "validator";
import bcrypt from "bcrypt";

const userSchema = new Schema({
    username: {
        type: String,
        require: [true, "Please enter username"],
        unique: true,
    },
    name: {
        type: String,
        required: [true, "Please enter your name"],
    },
    email: {
        type: String,
        required: [true, "Please enter an email"],
        unique: true,
        lowercase: true,
        validate: [isEmail, "Please enter an valid email"],
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

const User = model("user", userSchema);

export default User;
