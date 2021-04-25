import mongoose from "mongoose";

export default async () => {
    await mongoose
        .connect(process.env.DATABASE_URI as string, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            //  useCreateIndex: true,
            //  useFindAndModify: false
        })
        .then(() => {
            console.log("db Connection is successfull on port");
        })
        .catch((err) => {
            console.log("failed to connect to db", err);
        });
};
