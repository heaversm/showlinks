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
import ID3Writer from "browser-id3-writer";
import { XMLHttpRequest } from "xmlhttprequest";
import https from "https";

//Due to dirname being undefined in ESModules:
//https://flaviocopes.com/fix-dirname-not-defined-es-module-scope/
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const RAD_DATA = {
  remoteAudioData: {
    trackingUrls: ["https://showlinks.herokuapp.com/api/track_rad"],
    events: [
      {
        eventTime: "00:00:00.000",
        label: "podcastDownload",
        spId: "0",
        creativeId: "0",
        adPosition: "0",
        eventNum: "0",
      },
      {
        eventTime: "00:00:01.000",
        label: "podcastStart",
        spId: "0",
        creativeId: "0",
        adPosition: "0",
        eventNum: "1",
      },
    ],
  },
};

const durationIncrement = 10; //Generate an event every X seconds

const generateDurationEvents = (duration) => {
  const numDurationEvents = Math.floor(duration / durationIncrement);
  const defaultEvents = RAD_DATA.remoteAudioData.events.length;
  for (let i = 0; i < numDurationEvents; i++) {
    const eventNum = i + defaultEvents;
    const eventNumStr = eventNum.toString();
    const durationEvent = {
      eventTime: `00:00:${durationIncrement * (i + 1)}.000`,
      label: `podcastDuration${eventNum}`,
      spId: "0",
      creativeId: "0",
      adPosition: "0",
      eventNum: eventNumStr,
    };
    RAD_DATA.remoteAudioData.events.push(durationEvent);
  }
};

const srtToTimestampedText = (srtString) => {
  // Split the string into an array of subtitle blocks
  const subtitleBlocks = srtString.split("\n\n");

  // Loop through each subtitle block and format the timestamp and text
  let outputString = "";
  subtitleBlocks.forEach((subtitleBlock) => {
    // Extract the timestamp and text
    const [step, timestamp, ...textLines] = subtitleBlock.split("\n");
    const text = textLines.join("\n");

    // Format the timestamp as desired
    const [start, end] = timestamp.split(" --> ");
    const formattedStart = start ? start.replace(/,\d{3}/, "") : "";

    const formattedEnd = end ? end.replace(/,\d{3}/, "") : "";
    const formattedTimestamp = `[${formattedStart} --> ${formattedEnd}]`;

    // Join the formatted timestamp and text into a single string
    const formattedSubtitle = `${formattedTimestamp}\n${text}\n`;

    // Append the formatted subtitle to the output string
    outputString += formattedSubtitle;
  });
  return outputString;
};

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

const toArrayBuffer = (buffer) => {
  const arrayBuffer = new ArrayBuffer(buffer.length);
  const view = new Uint8Array(arrayBuffer);
  for (let i = 0; i < buffer.length; ++i) {
    view[i] = buffer[i];
  }
  return arrayBuffer;
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

router.post("/writeRad", upload.single("file"), async (req, res, next) => {
  const method = req.body.method;
  console.log("method", method);
  if (!method) {
    console.error("no method specified");
    return res.status(400).json({ error: "Invalid podcast URL." });
  }
  let arrayBuffer, writer;
  if (method === "url") {
    const url = req.body.url;
    const duration = req.body.duration;
    console.log("duration", duration);

    if (!duration || duration === "") {
      console.error("no valid url");
      return res.status(400).json({ error: "No duration" });
    }

    generateDurationEvents(duration);
    const stringifiedRadData = JSON.stringify(RAD_DATA);
    console.log("stringifiedRadData", stringifiedRadData);

    if (!url || url === "") {
      console.error("no valid url");
      return res.status(400).json({ error: "Invalid podcast URL." });
    }
    //getting array buffer
    // const xhr = new XMLHttpRequest();
    // xhr.open("GET", url, true);
    // xhr.responseType = "arraybuffer";

    https
      .get(url, (response) => {
        if (response.statusCode === 200) {
          const chunks = [];

          response.on("data", (chunk) => {
            chunks.push(chunk);
          });

          response.on("end", () => {
            const chunkedBuffer = Buffer.concat(chunks);
            // The 'arrayBuffer' now contains the MP3 file as a Buffer.
            // You can convert it to an ArrayBuffer if needed.
            //console.log("chunkedBuffer", chunkedBuffer);
            const arrayBuffer = toArrayBuffer(chunkedBuffer);
            //console.log("arrayBuffer", arrayBuffer);
            writer = new ID3Writer(arrayBuffer);
            writer.setFrame("TXXX", {
              description: "RAD",
              value: stringifiedRadData,
            });
            writer.addTag();
            const taggedSongBuffer = Buffer.from(writer.arrayBuffer);
            const fileID = nanoid();
            const fileName = `${fileID}.mp3`;
            const radFile = fs.writeFileSync(fileName, taggedSongBuffer);

            //res.json({ msg: `received url ${url}` });

            const filePath = path.join(__dirname, `../${fileName}`);
            // res.download("temp-rad-file.mp3"); // Set disposition and send it.
            console.log("filePath", filePath);

            fs.stat(filePath, (error, stats) => {
              if (error) {
                res.statusCode = 404;
                res.end("File not found");
                return;
              }
              res.writeHead(200, {
                "Content-Type": "audio/mpeg",
                "Content-Length": stats.size,
              });

              const fileStream = fs.createReadStream(filePath);
              fileStream.pipe(res);
              fileStream.on("end", () => {
                fs.unlink(filePath, (err) => {
                  if (err) {
                    console.error(err);
                    return;
                  }
                  console.log("file removed");
                });
              });
            });
          });
        }
      })
      .on("error", (error) => {
        console.error("Error retrieving MP3 file:", error);
        return res.status(400).json({ error: error });
      });
  } else if (method === "file") {
    const file = req.file;
    if (!file || file === "") {
      console.error("no valid file");
      return res.status(400).json({ error: "Invalid file" });
    }
    res.json({ msg: "received file" });
  }
});

// router.post("/transcribe", async (req, res) => {
router.post("/transcribe", upload.single("file"), async (req, res, next) => {
  const { originalname, mimetype, filename } = req.file;
  const fileExt = originalname.slice(originalname.lastIndexOf("."));
  const newFileName = filename + fileExt;
  const origPodcastFile = path.join(process.cwd(), "uploads", filename);
  const podcastFile = path.join(process.cwd(), "uploads", newFileName);
  const origFormat = req.body.format;
  let format;
  if (!origFormat || req.body.format == "text") {
    //text doesn't give us the timestamps so we'll have to convert the srt to timestamped text
    format = "srt";
  } else {
    format = origFormat;
  }
  //const format = req.body.format;

  fs.rename(origPodcastFile, podcastFile, async () => {
    await openai
      .createTranscription(
        fs.createReadStream(podcastFile),
        "whisper-1",
        "", //prompt
        format //response format: json, vtt,srt, or text
      )
      .then(async (transcriptResponse) => {
        console.log("transcribed");
        let transcript = transcriptResponse.data;

        if (origFormat == "text") {
          //convert srt to timestamped text
          transcript = srtToTimestampedText(transcript);
        }

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
