import express from "express";
import http from "http";
import socketIO from "socket.io";
import "dotenv/config";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");

app.use("/client", express.static(__dirname + "/client"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const httpServer = http.createServer(app);
const wsServer = socketIO(httpServer);

app.listen(process.env.PORT, () =>
  console.log("Server Connected on port 'http://localhost:3000'")
);
