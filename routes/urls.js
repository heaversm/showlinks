import path from "path";
import express from "express";
import { nanoid } from "nanoid";
import Url from "../models/Url.js";
import { validateUrl } from "../utils/utils.js";
import dotenv from "dotenv";
dotenv.config({ path: "../config/.env" });

const router = express.Router();
const templates = path.join(process.cwd(), "templates");

// Short URL Generator
router.post("/short", async (req, res) => {
  const { origUrl } = req.body;
  const base = process.env.BASE;
  console.log(req.body);

  const urlId = nanoid();
  if (validateUrl(origUrl)) {
    try {
      let url = await Url.findOne({ origUrl });
      if (url) {
        res.json(url);
      } else {
        const shortUrl = `${base}/${urlId}`;

        url = new Url({
          origUrl,
          shortUrl,
          urlId,
          date: new Date(),
        });

        await url.save();
        res.json(url);
      }
    } catch (err) {
      console.log(err);
      res.status(500).json("Server Error");
    }
  } else {
    res.status(400).json("Invalid Original Url");
  }
});

router.post("/stats", async (req, res) => {
  const { shortUrl } = req.body;
  const base = process.env.BASE;
  console.log(shortUrl);

  // if (validateUrl(shortUrl)) {
  //   console.log("valid url");
  try {
    console.log("find the short url");
    let url = await Url.findOne({ shortUrl });
    console.log(url, shortUrl);
    if (url) {
      res.json(url);
    } else {
      console.log("no url found");
      res.json({
        error: "URL not found",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json("Server Error");
  }
  // } else {
  //   res.status(400).json("Invalid Short Url");
  // }
});

export default router;
