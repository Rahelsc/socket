const jwt = require("jsonwebtoken");
const { callbackify } = require("util");
require("dotenv").config();
const app = require("express")();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: {
    origin: ["http://localhost:3000"],
  },
});

let users = [];

// check if user already exists in user array so there won't be duplicates
const addUser = (user) => {
  !users.some((u) => u._id === user._id) &&
    users.push({
      _id: user._id,
      username: user.username,
      profilePicture: user.profilePicture,
    });
};

// removing user
const removeUser = (user) => {
  users = users.filter((u) => u._id !== user._id);
};

// middleware for authentication
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    // verify token and get user details
    const user = await jwt.verify(token, process.env.SECRET_KEY);
    console.log("user: ", user.user);
    // save the user data to socket object to be used later on
    socket.user = user.user;
    next();
  } catch (error) {
    // for invalid token close connection
    console.log("error: ", error.message);
    return next(new Error(error.message));
  }
});

io.on("connection", (socket) => {
  console.log("a user connected");
  socket.join(socket.user._id);
  addUser(socket.user);
  io.emit("getUsers", users);

  socket.on("disconnect", () => {
    console.log("a user disconnected");
    removeUser(socket.user);
    io.emit("getUsers", users);
  });

  socket.on("my message", (msg) => {
    console.log("message: ", msg);
    io.emit("my broadcast", `server ${msg}`);
  });

  socket.on("join", (roomName) => {
    console.log(("join: ", roomName));
    socket.join(roomName);
  });

  socket.on("message", ({ message, roomName }) => {
    console.log("message: " + message.text + " in " + roomName);
    // send to all users except sender
    socket.to(roomName).emit("message", message);
    // callbackify({ status: "ok" });
  });
});

http.listen(process.env.SERVER_PORT, () => {
  console.log(`listening on *:${process.env.SERVER_PORT}`);
});
