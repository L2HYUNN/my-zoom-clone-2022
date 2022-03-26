import express from "express";
import http from "http";
import SocketIO from "socket.io";
import "dotenv/config";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");

app.use("/client", express.static(__dirname + "/client"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);

wsServer.on("connection", (socket) => {
  socket.on("enter_room", (roomName) => {
    socket.join(roomName);
    socket.to(roomName).emit("info_enter_room", roomName);
  });
  socket.on("offer", (offer, roomName) => {
    socket.to(roomName).emit("offer", offer);
  });
  socket.on("answer", (answer, roomName) => {
    socket.to(roomName).emit("answer", answer);
  });
  socket.on("ice", (ice, roomName) => {
    socket.to(roomName).emit("ice", ice);
  });
});

httpServer.listen(process.env.PORT, () =>
  console.log("Server Connected on port 'http://localhost:3000'")
);
