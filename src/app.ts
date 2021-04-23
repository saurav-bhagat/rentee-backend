import path from "path";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";

import routes from "./routes";
import isAuth from "./middleware/is-auth";

dotenv.config({path: path.resolve(__dirname, "../.env")});
const app = express();

const PORT = process.env.PORT || 3000;

// middleware
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(isAuth);

app.use(routes);

app.get("/", (req, res) => {
    res.json({status: "ok"});
});

// database setup

mongoose
    .connect(process.env.DATABASE_URI as string, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log("db Connection is successfull");
    })
    .catch((err) => {
        console.log(err);
    });

app.listen(PORT, () => {
    console.log(`Server is listening at port ${PORT}`);
});
