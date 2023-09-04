import path from "path";
import process from "process";
import express from "express";
import Request from "../models/Request.js";

const router = express.Router();
const templates = path.join(process.cwd(), "templates");

//TODO: kill CSRF?...pain to work with
//For now, manage list of exceptions to bypass needed routes from app.js
router.get("/op", async (req, res) => {
  req.session.csrf = req.csrfToken();
  try {
    const requests = await Request.find().sort({ request_date: -1 });
    res.render("pages/op", { token: req.session.csrf, comments: requests });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: `Server Error ${err}` });
  }
});

router.get("/", async (req, res) => {
  req.session.csrf = req.csrfToken();
  res.render("pages/index");
});

export default router;
