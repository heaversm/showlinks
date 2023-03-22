import path from "path";
import process from "process";
import express from "express";
import Url from "../models/Url.js";

const router = express.Router();
const templates = path.join(process.cwd(), "templates");
console.log(templates);

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

router.get("/:urlId", async (req, res) => {
  console.log("get id", req.params.urlId);
  try {
    const url = await Url.findOne({ urlId: req.params.urlId });
    if (url) {
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
