import path from "path";
import dotenv from "dotenv";
import express from "express";
import * as Sequelize from "sequelize";

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
const dbConfig = new Sequelize.Sequelize(
    process.env.DB || "",
    process.env.DB_USER_NAME || "",
    process.env.DB_PASSWORD || "",
    {
        host: process.env.MYSQL_HOST,
        port: process.env.MYSQL_PORT as any,
        dialect: "mysql",
    }
);

dbConfig
    .authenticate()
    .then(() => console.log("connected to db"))
    .catch((err) => {
        console.log(`Error connection to database: ${err}`);
    });

app.listen(PORT, () => {
    console.log(`Server is listening at port ${PORT}`);
});