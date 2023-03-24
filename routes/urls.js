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
  const { origUrls, userId, episodeName } = req.body;
  const base = process.env.BASE;

  //generate episodeId
  let episodeId = "";

  if (episodeName && episodeName !== "") {
    episodeId = toCamelCase(episodeName);
  }

  let shortUrls = [];
  for (const origUrl of origUrls) {
    if (validateUrl(origUrl)) {
      try {
        let url = await Url.findOne({ origUrl });
        if (url) {
          console.log("url exists");
          shortUrls.push(url);
        } else {
          const urlId = nanoid();
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
          shortUrls.push(url);
        }
      } catch (err) {
        console.log(err);
        res.status(500).json("Server Error");
      }
    } else {
      res.status(400).json("Invalid Original Url");
    }
  }
  const responseObj = {
    shortUrls,
    userId,
    episodeId,
  };
  res.json(responseObj);
});

router.post("/stats", async (req, res) => {
  const { userId, episodeId, shortUrl } = req.body;
  const base = process.env.BASE;

  const method = userId ? "userId" : episodeId ? "episodeId" : "shortUrl";

  // if (validateUrl(shortUrl)) {
  //   console.log("valid url");

  const getUrlsWithStats = async (urls) => {
    const urlsWithStats = [];
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

    return urlsWithStats;
  };

  if (method === "userId") {
    try {
      const urls = await Url.find({ userId: userId });

      if (urls && urls.length) {
        const urlsWithStats = await getUrlsWithStats(urls);
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
        const urlsWithStats = await getUrlsWithStats(urls);
        res.json(urlsWithStats);
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
        const urlsWithStats = await getUrlsWithStats(urls);
        res.json(urlsWithStats);
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
