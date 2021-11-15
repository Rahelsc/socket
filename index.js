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

  socket.on("disconnect", () => {
    console.log("a user disconnected");
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

// const io = require("socket.io")(8900, {
//   cors: { origin: "http://localhost:3000", method: ["GET", "POST"] },
// });

// let users = [];

// // check if user already exists in user array so there won't be duplicates
// const addUser = (userId, socketId) => {
//   !users.some((user) => user._id === userId) &&
//     users.push({ userId, socketId });
// };

// // removing user
// const removeUser = (socketId) => {
//   users = users.filter((user) => user.socketId !== socketId);
// };

// // find specific user to send a message to
// const getUser = (userId) => {
//   return users.find((user) => user.userId === userId);
// };

// // recieving new connection
// io.on("connection", (socket) => {
//   // upon connection
//   console.log("a user connected: ", socket);

//   //   take socket id and user id from user and add to users array if don't already exist
//   socket.on("addUser", (userId) => {
//     addUser(userId, socket.id);
//     io.emit("getUsers", users);
//   });

//   //   send and get messages
//   socket.on("sendMessage", ({ senderId, recieverId, text }) => {
//     console.log("sent");
//     const reciever = getUser(recieverId);
//     io.to(reciever.socketId).emit("getMessage", {
//       senderId,
//       text,
//     });
//   });

//   // send how many messages are waiting
//   // socket.on()

//   //   upon disconnect
//   socket.on("disconnect", () => {
//     console.log("a user disconnected");
//     removeUser(socket.id);
//     io.emit("getUsers", users);
//   });
// });
