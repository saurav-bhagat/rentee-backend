import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import * as  Sequelize from 'sequelize';
import bodyParser from 'body-parser';

const app=express();

const port=process.env.PORT;

// middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/',(req,res)=>{
    res.status(200).send("hello");
});


// database setup 
const dbConfig=new Sequelize.Sequelize(process.env.DB||"",process.env.DB_USER_NAME||"",process.env.DB_PASSWORD||"",{
    host:"localhost",
    port:3306,
    dialect:"mysql",
});

dbConfig
    .authenticate().then(() => console.log("connected to db"))            
    .catch(() => {            
        throw "error";       
     });

app.listen(port , ()=>{ console.log("server is running on port",port)});