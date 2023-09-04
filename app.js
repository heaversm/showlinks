import express from 'express';
import path from "path";
import connectDB from "./config/db.js";
import dotenv from "dotenv";
import csurf from "tiny-csrf"; //prevent CSRF attacks
import session from "express-session";
import cookieParser from "cookie-parser";

dotenv.config({ path: "./config/.env" });

const app = express();

//Connect to our Mongo Cloud DB
connectDB();

import indexRouter from "./routes/index.js";
import apiRouter from "./routes/api.js";

const publicDir = path.join(process.cwd(), "public");

// Body Parser for Form Data stuff
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(publicDir));

//FOR CSRF
app.use(cookieParser("cookie-parser-secret"));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
//CSRF: add any exceptions here as the 3rd param
//https://www.npmjs.com/package/tiny-csrf
app.use(
  csurf(
    process.env.CSRF_SECRET,
    ["POST"], //methods to protect
    ["/api/saveRequest"]
  )
);

app.set("view engine", "ejs"); //render EJS templates
app.use('/', indexRouter); //for serving pages
app.use("/api", apiRouter); //for handling API requests

// Server Setup
const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log(`Server is running at PORT ${PORT}`);
});
