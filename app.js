import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import router from "./routes/userRoute.js";

// import User from "./models/userModel.js";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:5173", credentials: true })); // ✅ Allow frontend requests
app.use(cookieParser());
app.use("/",router);

// const ACCESS_TOKEN_SECRET = "AIQUERYPROJECT";
// const REFRESH_TOKEN_SECRET = "AIQUERYREFRESHPROJECT";

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// ✅ Generate Tokens


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
