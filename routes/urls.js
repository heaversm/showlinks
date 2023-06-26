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

//import axios
import axios from "axios";
import xml2js from "xml2js";
const parser = new xml2js.Parser();

import { OpenAI } from "langchain/llms/openai"; //https://js.langchain.com/docs/getting-started/install

//FOR OPENAI DEMO
// import { ChatOpenAI } from "langchain/chat_models/openai";
// import { HumanChatMessage, SystemChatMessage } from "langchain/schema";

//FOR OPENAI TRANSCRIPT INTERACTION
import { TextLoader } from "langchain/document_loaders/fs/text";
import { CharacterTextSplitter } from "langchain/text_splitter";
import { FaissStore } from "langchain/vectorstores/faiss";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { RetrievalQAChain } from "langchain/chains"; //https://js.langchain.com/docs/modules/indexes/retrievers/remote-retriever

//Due to dirname being undefined in ESModules:
//https://flaviocopes.com/fix-dirname-not-defined-es-module-scope/
import { fileURLToPath } from "url";
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

//AI
let chain;

const secondsToTimestamp = (duration) => {
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = Math.floor(duration % 60);
  const milliseconds = Math.floor((duration % 1) * 1000);

  const formattedHours = hours.toString().padStart(2, "0");
  const formattedMinutes = minutes.toString().padStart(2, "0");
  const formattedSeconds = seconds.toString().padStart(2, "0");
  const formattedMilliseconds = milliseconds.toString().padStart(3, "0");

  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}.${formattedMilliseconds}`;
};

const generateDurationEvents = (duration) => {
  const numDurationEvents = Math.floor(duration / durationIncrement);
  const defaultEvents = RAD_DATA.remoteAudioData.events.length;
  for (let i = 0; i < numDurationEvents; i++) {
    const eventNum = i + defaultEvents;
    const eventNumStr = eventNum.toString();
    const durationTimestamp = secondsToTimestamp(durationIncrement * (i + 1));
    console.log("durationTimestamp", durationTimestamp);
    const durationEvent = {
      eventTime: durationTimestamp,
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

const getAudioFromURL = async (url) => {
  return new Promise((resolve) => {
    https
      .get(url, (response) => {
        // console.log("response", response);
        if (response.statusCode === 200) {
          const chunks = [];

          response.on("data", (chunk) => {
            chunks.push(chunk);
          });

          response.on("end", () => {
            console.log("end");
            const chunkedBuffer = Buffer.concat(chunks);
            const fileID = nanoid();
            const fileName = `${fileID}.mp3`;
            // const arrayBuffer = toArrayBuffer(chunkedBuffer);
            //fs.writeFileSync(fileName, arrayBuffer);

            fs.writeFileSync(fileName, chunkedBuffer);
            const filePath = path.join(__dirname, `../${fileName}`);
            // return filePath;
            return resolve(filePath);
          });
        } else {
          //reject with the error message
          return reject("Error retrieving MP3 file");
        }
      })
      .on("error", (error) => {
        console.error("Error retrieving MP3 file:", error);
        return res.status(400).json({ error: error });
      });
  });
};

const createRetrieverFromTranscript = async (transcript) => {
  //Split text into chunks
  //https://js.langchain.com/docs/modules/indexes/text_splitters/
  //https://medium.com/codingthesmartway-com-blog/unlock-the-power-of-language-models-combine-whisper-api-and-langchain-to-build-a-youtube-video-q-a-aa42a4c31d2b
  const textsplitter = new CharacterTextSplitter({
    separator: " ",
    chunkSize: 512,
    chunkOverlap: 0,
  });
  const texts = await textsplitter.splitText(transcript);

  // Create metadata for each text
  //MH not sure what's needed here for metadata, just seems to need something in this param
  const metadatas = [];
  texts.forEach((text, i) => {
    const metadata = { id: i };
    metadatas.push(metadata);
  });

  try {
    // Create a vector store from the texts
    const vectorStore = await FaissStore.fromTexts(
      texts,
      metadatas,
      new OpenAIEmbeddings()
    );
    // Create a retriever from the vector store
    const retriever = vectorStore.asRetriever();
    return retriever;
  } catch (err) {
    console.log("Error establishing vector store", err);
    return err;
  }
};

router.post("/getEpisodesFromRSS", async (req, res) => {
  const { feedURL } = req.body;
  console.log("getEpisodes", feedURL);

  // fetch(feedURL);
  try {
    const response = await axios.get(feedURL);
    // console.log(response);
    const xmlText = response.data;
    console.log("xmlText", xmlText);

    const parsedData = await parser
      .parseStringPromise(xmlText)
      .then((parsedData) => {
        const items = parsedData.rss.channel[0].item;
        const mp3Urls = items.map((item) => item.enclosure[0].$.url);
        console.log("mp3Urls", mp3Urls);
        return res.status(200).json({
          mp3Urls: mp3Urls,
        });
        //return mp3Urls;
      })
      .catch((err) => {
        console.log(err);
        return res.status(400).json({ error: "Error parsing feed" });
      });
    // console.log(parsedData);
  } catch (error) {
    console.error("Error fetching the feed:", error);
    return res.status(400).json({ error: "Error fetching feed" });
  }
  // .then((response) => {
  //   console.log("response", response);
  //   response.text();
  // })
  // .then((xmlText) => {
  //   console.log("xmlText", xmlText);
  //   // const parser = new DOMParser();
  //   // const xmlDoc = parser.parseFromString(xmlText, "text/xml");
  //   // const items = xmlDoc.getElementsByTagName("item");
  //   // const mp3Urls = [];
  //   // for (let i = 0; i < items.length; i++) {
  //   //   const item = items[i];
  //   //   const enclosure = item.getElementsByTagName("enclosure")[0];
  //   //   const mp3Url = enclosure.getAttribute("url");
  //   //   mp3Urls.push(mp3Url);
  //   // }
  //   // console.log(mp3Urls);
  // })
  // .catch((error) => {
  //   console.error("Error fetching or parsing the feed:", error);
  // });
  //return res.status(400).json({ error: "TODO" });
});

router.post("/aiLink", async (req, res) => {
  const { link } = req.body;
  console.log(link);
  if (!link || link === "") {
    console.error("no valid url");
    return res.status(400).json({ error: "Invalid podcast URL." });
  }
  const llm = new OpenAI();
  const podcastFile = await getAudioFromURL(link);
  console.log("podcastFilez", podcastFile);

  const transcription = await transcribeAudio(podcastFile, "text");
  fs.unlink(podcastFile, (err) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error deleting file");
      return;
    }
    console.log("File deleted!");
  });
  const retriever = await createRetrieverFromTranscript(transcription);
  chain = RetrievalQAChain.fromLLM(llm, retriever);
  res.json({ message: "QA Chain Established" });
});

router.post("/aitranscript", upload.single("file"), async (req, res) => {
  const { format, link } = req.body;
  console.log("format and link", format, link);
  // res.status(500).json({ error: `We done` });
  const llm = new OpenAI();
  if ((req.file && format === "transcript") || (req.file && format === "mp3")) {
    console.log("file", req.file);
    const { originalname, mimetype, filename } = req.file;
    const uploadPath = req.file.path;
    const fileExt = originalname.slice(originalname.lastIndexOf("."));
    // console.log(fileExt, filename, originalname, mimetype, uploadPath);

    if (format === "transcript") {
      const transcriptPath = path.join(process.cwd(), uploadPath);

      const loader = new TextLoader(transcriptPath);
      try {
        // Create the doc loader;
        const docs = await loader.load();
        // Load the docs into the vector store
        try {
          // Create a vector store from the docs
          const vectorStore = await FaissStore.fromDocuments(
            docs,
            new OpenAIEmbeddings()
          );

          // Create a retriever from the vector store
          const retriever = vectorStore.asRetriever();
          // Create a chain that uses the OpenAI LLM and retriever.
          chain = RetrievalQAChain.fromLLM(llm, retriever);
          //remove the transcript file
          fs.unlink(transcriptPath, (err) => {
            if (err) {
              console.error(err);
              res.status(500).send("Error deleting file");
              return;
            }
            res.json({ message: "QA Chain Established" });
          });
        } catch (err) {
          console.log(err);
          res
            .status(500)
            .json({ error: `Error establishing vector store: ${err}` });
        }
      } catch (err) {
        console.log(err);
        res.status(500).json({ error: `Erorr loading transcript: ${err}` });
      }
    } else if (format === "mp3") {
      const newFileName = filename + fileExt;
      const origPodcastFile = path.join(process.cwd(), "uploads", filename);
      const podcastFile = path.join(process.cwd(), "uploads", newFileName);
      //rename file with extension
      fs.rename(origPodcastFile, podcastFile, async () => {
        //transcribe audio
        const transcript = await transcribeAudio(podcastFile, "text");

        //remove the podcast file
        fs.unlink(podcastFile, (err) => {
          if (err) {
            console.error(err);
            res.status(500).send("Error deleting file");
            return;
          }
          console.log("File deleted!");
        });
        const retriever = await createRetrieverFromTranscript(transcript);
        chain = RetrievalQAChain.fromLLM(llm, retriever);
        res.json({ message: "QA Chain Established" });
      });
    }
  }
});

router.post("/qa", async (req, res) => {
  console.log(req.body);
  const question = req.body.question;
  try {
    const chainResponse = await chain.call({
      query: question,
    });
    // console.log(question, chainResponse);
    res.json({ message: chainResponse.text });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: `Server Error ${err}` });
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

const sendSongToClient = async (arrayBuffer, stringifiedRadData, res) => {
  const writer = new ID3Writer(arrayBuffer);
  writer.setFrame("TXXX", {
    description: "RAD",
    value: stringifiedRadData,
  });
  writer.addTag();
  const taggedSongBuffer = Buffer.from(writer.arrayBuffer);
  const fileID = nanoid();
  const fileName = `${fileID}.mp3`;
  fs.writeFileSync(fileName, taggedSongBuffer);

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
};

router.post("/writeRad", upload.single("file"), async (req, res, next) => {
  const method = req.body.method;
  console.log("method", method);
  if (!method) {
    console.error("no method specified");
    return res.status(400).json({ error: "Invalid podcast URL." });
  }

  //COMMON
  const duration = req.body.duration;
  console.log("duration", duration);

  if (!duration || duration === "") {
    console.error("no valid url");
    return res.status(400).json({ error: "No duration" });
  }

  generateDurationEvents(duration);
  const stringifiedRadData = JSON.stringify(RAD_DATA);

  if (method === "url") {
    const url = req.body.url;

    if (!url || url === "") {
      console.error("no valid url");
      return res.status(400).json({ error: "Invalid podcast URL." });
    }

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
            sendSongToClient(arrayBuffer, stringifiedRadData, res);
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
    const fileBuffer = fs.readFileSync(file.path);
    sendSongToClient(fileBuffer, stringifiedRadData, res);
  }
});

const transcribeAudio = async (podcastFile, format) => {
  const transcription = await openai
    .createTranscription(
      fs.createReadStream(podcastFile),
      "whisper-1",
      "", //prompt
      format //response format: json, vtt,srt, or text
    )
    .then(async (transcriptResponse) => {
      console.log("transcribed");
      let transcript = transcriptResponse.data;
      return transcript;
    })
    .catch((err) => {
      console.error("error transcribing", err);
    });
  return transcription;
};

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
    let transcript = await transcribeAudio(podcastFile, format);

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
  });
});

export default router;
