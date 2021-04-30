import {Schema, model, Document, Model} from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
import uniqueValidator from "mongoose-unique-validator";

const userSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "Please enter your name"],
        },
        email: {
            type: String,
            required: [true, "Please enter an email"],
            unique: [true, "Email is already registered"],
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
            required: [true, "Please enter phone number"],
            validate: [validator.isMobilePhone, "Please enter an valid phone number"],
            unique: [true, "Phone number is already registered"],
        },
        isOwner: {
            type: Boolean,
        },
        resetLink: {
            type: String,
            default: "",
        },
        token: {
            type: String,
        },
    },
    {timestamps: true}
);

//this method fire before doc save to db
userSchema.pre<IUser>("save", async function (next) {
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
        throw Error("Incorrect password");
    } else {
        throw Error("Incorrect email");
    }
};

export interface IUser extends Document {
    _id: Schema.Types.ObjectId;
    name: string;
    email: string;
    password: string;
    phoneNumber: string;
    isOwner: boolean;
    resetLink: string;
}

userSchema.statics.addRefreshToken = async function (id: string, token: string) {
    const response = await this.findByIdAndUpdate(id, {token: token, resetLink: ""}, {new: true}, (err, user) => {
        if (err) {
            return err;
        } else {
            return user;
        }
    });
    return response;
};

userSchema.statics.findUserForRefreshToken = async function (id: string, token: string) {
    const user = await this.findById(id);
    console.log(user);
    if (user && user.token === token) {
        return user;
    } else {
        throw Error("Invalid user");
    }
};

interface basicUserModel extends Model<IUser> {
    login: (email: Schema.Types.ObjectId, password: string) => IUser;
    addRefreshToken: (id: Schema.Types.ObjectId, token: string) => object;
    findUserForRefreshToken: (id: Schema.Types.ObjectId, token: string) => IUser;
}

const User = model<IUser, basicUserModel>("user", userSchema);

userSchema.plugin(uniqueValidator, {message: "{PATH} already exist"});

export default User;
