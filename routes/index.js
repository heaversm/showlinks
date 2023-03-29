import path from "path";
import process from "process";
import express from "express";
import Url from "../models/Url.js";
import Stat from "../models/Stat.js";
//import the ua-parser node module
import UAParser from "ua-parser-js";

const router = express.Router();
const templates = path.join(process.cwd(), "templates");

const browserRegex =
  /(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i;
const osRegex =
  /(iphone|ipad|ipod|android|windows phone|windows nt|mac os x)\s([0-9._]+)/i;
const deviceRegex = /android.+; (mobile)|(windows phone)/i;

router.get("/", (req, res) => {
  // res.sendFile(path.join(__dirname, "./client"));
  //__dirname is not defined - not sure why...using this hack instead
  //https://stackoverflow.com/questions/26079611/node-js-typeerror-path-must-be-absolute-or-specify-root-to-res-sendfile-failed
  res.sendFile("index.html", { root: templates });
});

router.get("/stats", (req, res) => {
  // res.sendFile(path.join(__dirname, "./client"));
  //__dirname is not defined - not sure why...using this hack instead
  //https://stackoverflow.com/questions/26079611/node-js-typeerror-path-must-be-absolute-or-specify-root-to-res-sendfile-failed
  res.sendFile("stats.html", { root: templates });
});

router.get("/contact", (req, res) => {
  // res.sendFile(path.join(__dirname, "./client"));
  //__dirname is not defined - not sure why...using this hack instead
  //https://stackoverflow.com/questions/26079611/node-js-typeerror-path-must-be-absolute-or-specify-root-to-res-sendfile-failed
  res.sendFile("contact.html", { root: templates });
});

router.get("/:urlId", async (req, res) => {
  //console.log("get id", req.params.urlId);

  try {
    const url = await Url.findOne({ urlId: req.params.urlId });
    if (url) {
      const userAgent = req.headers["user-agent"];
      console.log(userAgent);
      const browserMatch = userAgent.match(browserRegex);
      const osMatch = userAgent.match(osRegex);
      const deviceMatch = userAgent.match(deviceRegex);

      const browser = browserMatch ? browserMatch[1] : "";
      const os = osMatch ? osMatch[1] : "";
      const device = deviceMatch
        ? deviceMatch[1]
          ? "Mobile"
          : "Desktop"
        : "Desktop";

      let stat = new Stat({
        urlRef: req.params.urlId,
        browser: browser,
        os: os,
        device: device,
        accessDate: new Date(),
      });

      await stat.save();

      await Url.updateOne(
        {
          urlId: req.params.urlId,
        },
        { $inc: { clicks: 1 } }
      );
      return res.redirect(url.origUrl);
    } else res.status(404).json("Not found");
  } catch (err) {
    console.log(err);
    res.status(500).json("Server Error");
  }
});

export default router;
