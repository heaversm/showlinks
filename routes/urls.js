import path from "path";
import express from "express";
import { nanoid } from "nanoid";
import Url from "../models/Url.js";
import { validateUrl, validateEmail, toCamelCase } from "../utils/utils.js";
import Mailgun from "mailgun.js";
import formData from "form-data";
import { Configuration, OpenAIApi } from "openai";
import * as fs from "fs";
import multer from "multer";

const openAiConfiguration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(openAiConfiguration);

const router = express.Router();

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: "api",
  key: process.env.MAILGUN_KEY,
});

const upload = multer({ dest: "uploads/" });

const sendEmail = async (contactFormData) => {
  const { name, email, podcast, feedback } = contactFormData;
  const sandbox = process.env.MAILGUN_SANDBOX;
  const recipients = process.env.MAILGUN_RECIPIENTS;
  return new Promise((resolve, reject) => {
    mg.messages
      .create(sandbox, {
        from: `Mailgun Sandbox <postmaster@${sandbox}>`,
        to: recipients,
        subject: "Show Notes Contact Submission",
        text: `Name: ${name}\r\nEmail: ${email}\r\nPodcast: ${podcast}\r\nFeedback: ${feedback}`,
      })
      .then((msg) => {
        // console.log(msg);
        return resolve(msg);
      }) // logs response data
      .catch((err) => {
        console.log(err);
        return reject(err);
      }); // logs any error`;
  });
};

//ID generator
router.get("/generateUserId", async (req, res) => {
  const userId = nanoid();
  if (userId) {
    res.json({ userId: userId });
  } else {
    res.json({ error: "Error generating user ID" });
  }
});

router.get("/csrf", (req, res) => {
  res.json({
    token: req.session.csrf,
  });
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
  if (origUrls && origUrls.length) {
    for (const origUrl of origUrls) {
      console.log(origUrl, "orig");
      if (validateUrl(origUrl)) {
        //valid url
        try {
          let url = await Url.findOne({ origUrl });
          if (url) {
            //url exists
            shortUrls.push(url);
          } else {
            //new url
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
          //res.status(500).json("Server Error");
        }
      } else {
        //invalid url
        console.log("invalid orig url", origUrl);
        //res.status(400).json("Invalid Original Url");
      }
    } //end for
    const responseObj = {
      shortUrls,
      userId,
      episodeId,
    };
    res.json(responseObj);
  } //end if origUrls
  else {
    res.status(400).json("no URLs found");
  }
});

const getStatsByMethod = async (method, methodVal, errorMsg) => {
  const urls = await Url.aggregate([
    {
      $match: {
        [method]: methodVal,
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
    return urls;
  } else {
    const errorResponse = {
      error: errorMsg,
    };
    return errorResponse;
  }
};

//stats retriever
router.post("/stats", async (req, res) => {
  const { userId, episodeId, shortUrl } = req.body;
  const base = process.env.BASE;

  const method = userId ? "userId" : episodeId ? "episodeId" : "shortUrl";

  // if (validateUrl(shortUrl)) {
  //   console.log("valid url");
  try {
    let urls;
    if (method === "userId") {
      urls = await getStatsByMethod(
        "userId",
        userId,
        "user ID not found or no links associated with this ID"
      );
    } else if (method === "episodeId") {
      urls = await getStatsByMethod(
        "episodeId",
        episodeId,
        "Invalid episode ID or no links found"
      );
    } else if (method === "shortUrl") {
      urls = await getStatsByMethod("shortUrl", shortUrl, "URL not found");
    }
    res.json(urls);
  } catch (err) {
    console.log(err);
    res.status(500).json("Server Error");
  }
});

router.post("/contact", async (req, res) => {
  const { name, email, podcast, feedback, proof, _csrf } = req.body;

  if (!_csrf || _csrf != req.session.csrf) {
    return res.status(400).json({ error: "Invalid CSRF." });
  }

  if (!feedback || !proof) {
    return res.status(400).json({ error: "All fields are required." });
  }
  if (parseInt(proof) !== 6) {
    return res.status(400).json({ error: "Invalid proof of humanity." });
  }
  if (email && !validateEmail(email)) {
    return res.status(400).json({ error: "Invalid email address." });
  }
  if (podcast && !validateUrl(podcast)) {
    return res.status(400).json({ error: "Invalid podcast URL." });
  }
  const emailResponse = await sendEmail(req.body);
  // Send a success response
  res.json({ message: "Your information has been submitted successfully!" });
});

// router.post("/transcribe", async (req, res) => {
router.post("/transcribe", upload.single("file"), async (req, res, next) => {
  // console.log(req.file, req.body);
  const { originalname, mimetype, filename } = req.file;
  const fileExt = originalname.slice(originalname.lastIndexOf("."));
  const newFileName = filename + fileExt;
  const origPodcastFile = path.join(process.cwd(), "uploads", filename);
  const podcastFile = path.join(process.cwd(), "uploads", newFileName);

  fs.rename(origPodcastFile, podcastFile, async () => {
    await openai
      .createTranscription(
        fs.createReadStream(podcastFile),
        "whisper-1",
        "", //prompt
        "srt" //response format: json, vtt,srt, or text
      )
      .then(async (transcriptResponse) => {
        const transcript = transcriptResponse.data;
        // console.log(transcript);
        fs.unlink(podcastFile, (err) => {
          if (err) {
            console.error(err);
            res.status(500).send("Error deleting file");
            return;
          }
          res.json({ transcript: transcript });
        });
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json("Server Error");
      });
  });
});

export default router;
