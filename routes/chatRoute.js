const express = require("express");
const verifyToken = require("../util/token-verify.js");
const { history, message } = require("../controller/chatController.js");

const chatRoute = express.Router();

chatRoute.get("/history", verifyToken, history);
chatRoute.post("/sendMessage", verifyToken, message);

module.exports = chatRoute;