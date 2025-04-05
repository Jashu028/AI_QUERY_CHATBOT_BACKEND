const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const userRoute = require('./routes/userRoute.js');
const productRoute = require('./routes/productRoute.js');
const chatRoute = require('./routes/chatRoute.js');

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_BASE_URL, credentials: true })); // ✅ Allow frontend requests
app.use(cookieParser());
app.use("/",userRoute);
app.use("/products", productRoute);
app.use("/chat", chatRoute);

app._router.stack.forEach((middleware) => {
  if (middleware.route) {
    console.log(middleware.route.path);
  }
});


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
