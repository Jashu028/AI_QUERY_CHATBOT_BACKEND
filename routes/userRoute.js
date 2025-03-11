import express from "express";
import {register, refresh, checkAuth, login, logout} from "../controller/userController.js";
import { verifyToken } from "../util/token-verify.js";

const userRouter = express.Router();


userRouter.post("/register", register);
userRouter.post("/login", login);
userRouter.get("/check-auth", verifyToken, checkAuth);
userRouter.get("/logout", verifyToken, logout);
userRouter.get("/refresh", verifyToken, refresh);

export default userRouter;
