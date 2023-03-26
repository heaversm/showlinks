import path from "path";
import express from "express";
import { nanoid } from "nanoid";
import Url from "../models/Url.js";
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

  if (method === "userId") {
    try {
      const urls = await Url.aggregate([
        {
          $match: {
            userId: userId,
          },
        },
        {
          $lookup: {
            from: "stats",
            localField: "urlId",
            foreignField: "urlRef",
            as: "urlStats",
          },
        },
      ]).exec();
      if (urls && urls.length) {
        res.json(urls);
      } else {
        res.json({
          error: "user ID not found or no links associated with this ID",
        });
      }
    } catch (err) {
      console.log(err);
      res.status(500).json("Server Error");
    }
  } else if (method === "episodeId") {
    try {
      const urls = await Url.aggregate([
        {
          $match: {
            episodeId: episodeId,
          },
        },
        {
          $lookup: {
            from: "stats",
            localField: "urlId",
            foreignField: "urlRef",
            as: "urlStats",
          },
        },
      ]).exec();
      if (urls && urls.length) {
        res.json(urls);
      } else {
        res.json({
          error: "Invalid episode ID or no links found",
        });
      }
      res.json(urls);
    } catch (err) {
      console.log(err);
      res.status(500).json("Server Error");
    }
  } else if (method === "shortUrl") {
    try {
      const urls = await Url.aggregate([
        {
          $match: {
            shortUrl: shortUrl,
          },
        },
        {
          $lookup: {
            from: "stats",
            localField: "urlId",
            foreignField: "urlRef",
            as: "urlStats",
          },
        },
      ]).exec();
      if (urls) {
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
