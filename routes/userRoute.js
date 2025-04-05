const express = require("express");
const {register, refresh, checkAuth, login, logout, resetPassword, forgot, verifyMail} = require("../controller/userController.js");
const {verifyToken} = require("../util/token-verify.js");

const userRouter = express.Router();


userRouter.post("/register", register);
userRouter.post("/login", login);
userRouter.get("/check-auth", verifyToken, checkAuth);
userRouter.get("/logout", verifyToken, logout);
userRouter.get("/refresh", verifyToken, refresh);
userRouter.post("/forget-password", forgot);
userRouter.post("/reset-password/:token", resetPassword);
userRouter.get("/verify-account/:token", verifyMail);

module.exports = userRouter;
