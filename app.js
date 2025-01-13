import express from "express";
import { Server } from "socket.io";
import http from "http";
import { Chess } from "chess.js";
import path from "path";
import { fileURLToPath } from "url"; // Required for __dirname with ES Modules

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const server = http.createServer(app); //linking http server with express server
const io = new Server(server); //socket will run on that linked server

const chess = new Chess(); //all chess rules
let players = {};
let currentPlayer = "w";

app.set("view engine", "ejs"); //setting ejs as the template engine
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index", { title: "Chess Game" });
});

io.on("connection", (socket) => {
  console.log("connected");

  if (!players.white) {
    players.white = socket.id;
    socket.emit("playerRole", "w");
  } else if (!players.black) {
    players.black = socket.id;
    socket.emit("playerRole", "b");
  } else {
    socket.emit("spectatorRole");
  }

  socket.on("disconnect", () => {
    if (socket.id === players.white) {
      delete players.white;
    } else if (socket.id === players.black) {
      delete players.black;
    }
    console.log("disconnected");
  });

  socket.on("move", (move) => {
    try {
      if(chess.turn() === 'w' && socket.id !== players.white) return;
      if(chess.turn() === 'b' && socket.id !== players.black) return;

      const result = chess.move(move); //whatever move you gave in the parameter chess.move will try to move that move and store it in result
      if(result){
        currentPlayer = chess.turn();
        io.emit("move",move)
        io.emit("boardState",chess.fen()) //fen gives the fen equation of the board to give its current state
      }
      else{
        console.log("Invalid move : ", move);
        socket.emit("invalidMove", move); //the invalid move will only come to me (therefore, socket.emit and not io.emit)
      }
    } catch (err) {
      console.log(err);
      socket.emit("invalidMove", move);
    }
  });
});

server.listen(3000, () => {
  console.log("listening on port 3000");
});
