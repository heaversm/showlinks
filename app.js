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
import urlsRouter from "./routes/urls.js";

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
app.use(
  csurf(
    process.env.CSRF_SECRET,
    ["POST"],
    [
      "/api/short/",
      "/api/stats/",
      "/api/transcribe/",
      "/api/writeRad/",
      "https://api.openai.com/v1/audio/transcriptions",
    ]
  )
);

app.use('/', indexRouter);
app.use('/api', urlsRouter);


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
