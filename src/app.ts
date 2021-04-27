import path from "path";
import dotenv from "dotenv";
import express from "express";
import db from "./config/db";
import routes from "./routes";
import isAuth from "./middleware/is-auth";

dotenv.config({path: path.resolve(__dirname, "../.env")});
const app = express();

const PORT = process.env.PORT || 3000;

// db setup
db();

// middleware
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(isAuth);

app.use(routes);

app.get("/", (req, res) => {
    res.json({status: "ok"});
});

app.listen(PORT, () => {
    console.log(`Server is listening at port ${PORT}`);
});

process.on("uncaughtException", (err) => {
    console.error("There was an uncaught error", err);
    process.exit(1); //mandatory (as per the Node.js docs)
});