import express from "express";
import { verifyToken } from "../util/token-verify.js";
import { history, message } from "../controller/chatController.js";

const chatRoute = express.Router();

chatRoute.get("/history", verifyToken, history);
chatRoute.post("/sendMessage", verifyToken, message);

export default chatRoute;