import path from "path";
import process from "process";
import express from "express";
import Url from "../models/Url.js";
import Stat from "../models/Stat.js";
//import the ua-parser node module
import UAParser from "ua-parser-js";
import axios from "axios";

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
  res.sendFile("stats.html", { root: templates });
});

router.get("/dashboard", (req, res) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  //next();
  res.sendFile("dashboard.html", { root: templates });
});

router.get("/privacy", (req, res) => {
  res.sendFile("privacy.html", { root: templates });
});

router.get("/contact", (req, res) => {
  req.session.csrf = req.csrfToken();
  res.sendFile("contact.html", { root: templates, token: req.session.csrf });
});

router.get("/transcribe", (req, res) => {
  res.sendFile("transcribe.html", { root: templates });
});

router.get("/rad", (req, res) => {
  res.sendFile("rad.html", { root: templates });
});

router.get("/ai", (req, res) => {
  res.sendFile("ai.html", { root: templates, token: req.session.csrf });
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
      const host = req.get("referrer") || "Unknown";

      const browser = browserMatch ? browserMatch[1] : "";
      const os = osMatch ? osMatch[1] : "";
      const device = deviceMatch
        ? deviceMatch[1]
          ? "Mobile"
          : "Desktop"
        : "Desktop";

      const ts = new Date();
      const ts_micros = ts.getTime() * 1000;
      const showlink = req.params.urlId;

      let stat = new Stat({
        urlRef: showlink,
        browser: browser,
        os: os,
        device: device,
        accessDate: ts,
        host: host,
      });

      await stat.save(); //save stat to database

      //log in ga:
      const measurement_id = process.env.G_MEASUREMENT_ID;
      const api_secret = process.env.G_MEASUREMENT_KEY;
      const client_id = process.env.G_CLIENT_ID;

      const ga_payload = {
        client_id: client_id,
        timestamp_micros: ts_micros,
        non_personalized_ads: true,
        events: [
          {
            name: "access_link",
            params: {
              showlink: showlink,
            },
          },
        ],
      };

      const ga_url = `https://www.google-analytics.com/mp/collect?measurement_id=${measurement_id}&api_secret=${api_secret}`;
      try {
        const response = await axios.post(ga_url, ga_payload);
        console.log("ga_success");
      } catch (error) {
        console.error("Error sending Google Analytics request:", error);
      }

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
