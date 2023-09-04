# One Project Participatory Budgeting

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

```

### Get item from DB

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
