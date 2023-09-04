# One Project Participatory Budgeting

## Run Locally

* Prerequisites:
  * Node.js
  * npm
  * MongoDB Atlas account


* Clone the project

* Get the `.env` file from the project owner with required api keys

* Install dependencies

```bash
  npm install
```

* Start the server

```bash
  npm run start
```

## API Reference

* `/getRequests` - gets all requests from our cloud DB
* `/establishLLM` - sets up the LLM for auto request generation
* `/saveRequest` - saves an individual request to the database
* `/generateRequest` - generates an AI based request which gets populated on our request form modal
* `/csrf` gets the CSRF token. Unused currently

## Tech Stack
* Database: MongoDB Cloud Atlas
* Backend: Node.js, Express.js
* Frontend: Static HTML, CSS, JS, EJS templating engine
* OpenAI, FAISS, Langchain - LLM Request generation


## Database Setup Notes

Database was established with the following steps, which could be ammended to set up your own DB.

* [Sign up for the mongo atlas free tier](https://www.mongodb.com/cloud/atlas)

  * Choose your region and click on the "Create a free cluster" button
  * Choose "Connect Your Application" from the "choose a connection method" modal
  * Copy your connection URL and paste it in the .env file's `MONGO_URI` variable

## View online

[One Project Participatory Budgeting](https://showlinks.herokuapp.com/op)

**Note**: I am repurposing the heroku setup from a previous project. This will not be a permanent URL.

