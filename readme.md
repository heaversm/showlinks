# Showlinks

Gain insights on user interaction with your podcast show notes

## Run Locally

* Clone the project**

* Get the `.env` file from the project owner

* [Sign up for the mongo atlas free tier](https://www.mongodb.com/cloud/atlas)

  * Choose your region and click on the "Create a free cluster" button
  * Choose "Connect Your Application" from the "choose a connection method" modal
  * Copy your connection URL and paste it in the .env file's `MONGO_URI` variable

* Install dependencies*

```bash
  npm install
```

* Start the server

```bash
  npm run start
```

## API Reference

### Shorten URL

```http
  POST /api/short
```

| Field | Type   | Description  |
| :---- | :----- | :----------- |
| Body  | `json` | Original Url |

**Example:**

```http
POST http://localhost:3333/api/short
Content-Type: application/json

{
    "origUrl": "https://nemo.hashnode.dev/an-introduction-to-recursion-using-javascript-ckfgx2nrq001xols17h787f87"
}

```

### Get item

```http
  GET /:id
```

| Parameter | Type     | Description     |
| :-------- | :------- | :-------------- |
| `id`      | `string` | Unique URL Code |

**Example:**

```http
GET http://localhost:3333/SLiCKEXdn
```

### Generate User ID
  
  ```http
    GET /api/generateUserId
  ```

### Get Stats

  ```http
    GET /api/stats
  ```

Pass either a `userId`, `episodeId` or `shortUrl` in the body to get the stats for that particular item