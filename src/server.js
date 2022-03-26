import express from "express";
import "dotenv/config";

const app = express();

app.listen(process.env.PORT, () =>
  console.log("Server Connected on port 'http://localhost:3000'")
);
