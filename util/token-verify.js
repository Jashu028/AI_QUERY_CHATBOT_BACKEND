const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();



module.exports = verifyToken = (req, res, next) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Token expired or invalid" });

    req.user = decoded;
    next();
  });
};