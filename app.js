import express from 'express';
import path from "path";
import connectDB from "./config/db.js";
import dotenv from "dotenv";
import csurf from "tiny-csrf";
import session from "express-session";
import cookieParser from "cookie-parser";

dotenv.config({ path: "./config/.env" });

const app = express();

connectDB();

import indexRouter from "./routes/index.js";
// import urlsRouter from "./routes/urls.js";
import apiRouter from "./routes/api.js";

const publicDir = path.join(process.cwd(), "public");

// Body Parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(publicDir));
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
    [
      //exceptions
      "/api/short/",
      "/api/stats/",
      "/api/transcribe/",
      "/api/writeRad/",
      "/api/aitranscript/",
      "/api/aiLink/",
      "/api/qa/",
      "/api/getEpisodesFromRSS/",
      "/api/searchForPodcast/",
      "/api/getOPIEpisodes/",
      "/api/saveRequest",
      "https://api.openai.com/v1/audio/transcriptions",
    ]
  )
);

app.set("view engine", "ejs");
app.use('/', indexRouter);
app.use("/api", apiRouter);


// //CORS for google TODO: set to same-origin-allow-popups if this works
// app.use(function(req, res, next) {
//   res.setHeader("Cross-Origin-Opener-Policy", "unsafe-none");
//   next();
// });

// Server Setup
const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log(`Server is running at PORT ${PORT}`);
});
