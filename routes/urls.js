import path from "path";
import express from "express";
import { nanoid } from "nanoid";
import Url from "../models/Url.js";
import Stat from "../models/Stat.js";
import { validateUrl, toCamelCase } from "../utils/utils.js";
import dotenv from "dotenv";
dotenv.config({ path: "../config/.env" });

const router = express.Router();
const templates = path.join(process.cwd(), "templates");

//ID generator
router.get("/generateUserId", async (req, res) => {
  const userId = nanoid();
  if (userId) {
    res.json({ userId: userId });
  } else {
    res.json({ error: "Error generating user ID" });
  }
});

// Short URL Generator
router.post("/short", async (req, res) => {
  const { origUrl, userId, episodeName } = req.body;
  const base = process.env.BASE;
  console.log(req.body);

  const urlId = nanoid();

  //generate episodeId
  let episodeId = "";
  if (episodeName && episodeName !== "") {
    episodeId = toCamelCase(episodeName);
  }

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
          episodeName,
          episodeId,
          userId,
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
  const { userId, episodeId, shortUrl } = req.body;
  const base = process.env.BASE;

  const method = userId ? "userId" : episodeId ? "episodeId" : "shortUrl";

  // if (validateUrl(shortUrl)) {
  //   console.log("valid url");

  if (method === "userId") {
    try {
      const urls = await Url.find({ userId: userId });
      const urlsWithStats = [];
      if (urls && urls.length) {
        for (const url of urls) {
          //console.log(url);
          const {
            userId,
            episodeName,
            episodeId,
            clicks,
            origUrl,
            shortUrl,
            urlId,
            date,
          } = url;
          const urlStats = await Stat.find({ urlRef: url.urlId });
          //console.log(url, urlStats);
          //console.log("stat");
          //join the urlStats and url together in one object
          const urlWithStats = {
            userId,
            episodeName,
            episodeId,
            clicks,
            origUrl,
            shortUrl,
            urlId,
            date,
            urlStats,
          };
          //console.log(urlWithStats);
          urlsWithStats.push(urlWithStats);
        }
        //console.log("all stats", urlsWithStats);
        res.json(urlsWithStats);
      } else {
        res.json({
          error: "user ID not found",
        });
      }
    } catch (err) {
      console.log(err);
      res.status(500).json("Server Error");
    }
  } else if (method === "episodeId") {
    try {
      const urls = await Url.find({ episodeId: episodeId });
      if (urls && urls.length) {
        res.json(urls);
      } else {
        res.json({
          error: "episode ID not found",
        });
      }
    } catch (err) {
      console.log(err);
      res.status(500).json("Server Error");
    }
  } else if (method === "shortUrl") {
    try {
      let url = await Url.findOne({ shortUrl });
      if (url) {
        //res.json(url);
        const urls = [];
        urls.push(url);
        res.json(urls);
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
  }
});

export default router;
