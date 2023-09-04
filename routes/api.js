import path from "path";
import express from "express";
import { nanoid } from "nanoid";
import Url from "../models/Url.js";
import { validateUrl, validateEmail, toCamelCase } from "../utils/utils.js";
import formData from "form-data";
import { Configuration, OpenAIApi } from "openai";
import * as fs from "fs";
import https from "https";
import crypto from "crypto";
import { OpenAI } from "langchain/llms/openai"; //https://js.langchain.com/docs/getting-started/install

//FETCHING / SEARCHING
import axios from "axios";
import xml2js from "xml2js";
const parser = new xml2js.Parser();

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

//AI
let chain;

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

export default router;
