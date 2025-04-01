const express = require("express");
const {register, refresh, checkAuth, login, logout} = require("../controller/userController.js");
const {verifyToken} = require("../util/token-verify.js");

const userRouter = express.Router();


userRouter.post("/register", register);
userRouter.post("/login", login);
userRouter.get("/check-auth", verifyToken, checkAuth);
userRouter.get("/logout", verifyToken, logout);
userRouter.get("/refresh", verifyToken, refresh);

module.exports = userRouter;
