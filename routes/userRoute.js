import express from "express";
import {register, refresh, checkAuth, login, logout} from "../controller/userController.js";
import { verifyToken } from "../util/token-verify.js";

const router = express.Router();


router.post("/register", register);
router.post("/login", login);
router.get("/check-auth", verifyToken, checkAuth);
router.get("/logout", logout);
router.get("/refresh", refresh)

export default router;
