const io = require("socket.io")(8900, {
  cors: { origin: "http://localhost:3000" },
});

let users = [];
let counters = {}

// check if user already exists in user array so there won't be duplicates
const addUser = (userId, socketId) => {
  !users.some((user) => user._id === userId) &&
    users.push({ userId, socketId });
};

// removing user
const removeUser = (socketId) => {
  users = users.filter((user) => user.socketId !== socketId);
};

// find specific user to send a message to
const getUser = (userId) => {
  return users.find((user) => user.userId === userId);
};

// recieving new connection
io.on("connection", (socket) => {
  // upon connection
  console.log("a user connected.");

  //   take socket id and user id from user and add to users array if don't already exist
  socket.on("addUser", (userId) => {
    addUser(userId, socket.id);
    io.emit("getUsers", users);
  });

  //   send and get messages
  socket.on("sendMessage", ({ senderId, recieverId, text }) => {
    const reciever = getUser(recieverId);
    io.to(reciever.socketId).emit("getMessage", {
      senderId,
      text,
    });
  });

  // send how many messages are waiting
  // socket.on()
  

  //   upon disconnect
  socket.on("disconnect", () => {
    console.log("a user disconnected");
    removeUser(socket.id);
    io.emit("getUsers", users);
  });
});
