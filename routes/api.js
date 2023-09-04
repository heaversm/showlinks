import path from "path";
import express from "express";
import Request from "../models/Request.js";
import { Configuration, OpenAIApi } from "openai";

//FOR OPENAI INTERACTION

//https://js.langchain.com/docs/getting-started/install
import { OpenAI } from "langchain/llms/openai";
import { JSONLoader } from "langchain/document_loaders/fs/json";
import { FaissStore } from "langchain/vectorstores/faiss";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { RetrievalQAChain } from "langchain/chains";

//Due to dirname being undefined in ESModules:
//https://flaviocopes.com/fix-dirname-not-defined-es-module-scope/
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openAiConfiguration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0.9, //degree of randomness (1=high, 0=low)
});

const openai = new OpenAIApi(openAiConfiguration);
const router = express.Router();

//AI
let chain;
let llm;
//END OPENAI

const CONFIG = {
  //data scraped from Seattle "Your City Your Voice" dataset
  // https://data.seattle.gov/Community/Your-Voice-Your-Choice-Project-Ideas/syvi-qhpy
  PB_DATA_PATH: "pb-seattle.json",
};

const configLLM = async () => {
  llm = new OpenAI(openai); //openAI is the model
  const DOCS_PATH = path.join(process.cwd(), "data/", CONFIG.PB_DATA_PATH);
  const loader = new JSONLoader(DOCS_PATH, ["/project_title", "/idea"]); //the array specifies the data we want to generate embeddings for
  const docs = await loader.load();
  try {
    //the vector store facilitates a similarity search
    const vectorStore = await FaissStore.fromDocuments(
      docs,
      new OpenAIEmbeddings()
    );
    const retriever = vectorStore.asRetriever();
    chain = RetrievalQAChain.fromLLM(llm, retriever); //the chain allows us to string together multiple functionality necessary for LLM interaction
    console.log("llm ready");
  } catch {
    console.log(err);
    return err;
  }
};

router.get("/getRequests", async (req, res) => {
  //get requests from our mongo cloud DB. Sort by newest first
  try {
    const requests = await Request.find().sort({ request_date: -1 });
    res.status(200).json(requests);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: `Server Error ${err}` });
  }
});

router.get("/establishLLM", async (req, res) => {
  if (!chain) {
    try {
      await configLLM();
      res.status(200).json({ ready: true });
    } catch (err) {
      console.log(err);
      res.status(500).json({ ready: false, error: `Server Error ${err}` });
    }
  } else {
    res.status(200).json({ ready: true });
  }
});

router.post("/saveRequest", async (req, res) => {
  //Save a user's request to our cloud DB
  console.log("saveRequest", req.body);

  const {
    request__title,
    request__description,
    request__category,
    request__priority,
    request__username,
  } = req.body;

  //TODO: could just destructure the req. object and append needed info
  const saveRequest = new Request({
    request__title,
    request__description,
    request__category,
    request__priority,
    request__username,
    request__date: new Date(),
  });
  await saveRequest.save();
  console.log("request saved");
  //TODO: could handle async response. For now, just redirect
  res.redirect("/");
});

router.get("/generateRequest", async (req, res) => {
  //TODO: probably don't need retrievalQA chain since there is no Q&A
  //could just use the completions API

  //TODO: need to use the promptTemplate from langchain for structured JSON. This is leading to occasional invalid JSON errors.

  const query = `Create a forum posting for the participatory budgeting process for the city of seattle. Here is the format your output should adhere to.
  
  "request_title": "generate a title for the request. It should be short, no more than 10 words.",\n
  "request_body": "generate the request itself. It should be related to the request title but elaborate more on the details of the need the user has or the idea they want to see implemented in their city. It should be 250 words or less.",\n
  "request_category": "generate a category for the request. It should be one of the following: 'transportation', 'housing', 'education', 'healthcare', 'environment', 'safety', 'leisure','other'",\n
  "request_priority": "the priority of the request. It should be one of the following: [low, medium, high]}",\n"request_username": "generate a username for the user who asked the question. Should be in the format of: Firstname  Last Initial."\n\n 
  
  Return this all as a valid JSON object, with each item on its own line. Your response should be random, alternating between requests related to the various request_category options provided above."`;

  try {
    const chainResponse = await chain.call({
      query: query,
    });
    // console.log(chainResponse);
    //TODO: MH - every once in awhile this will respond with invalid JSON
    const responseText = JSON.parse(chainResponse.text);
    // console.log(responseText);
    res.json({ request: responseText });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: `Server Error ${err}` });
  }
});

router.get("/csrf", (req, res) => {
  res.json({
    token: req.session.csrf,
  });
});

export default router;
