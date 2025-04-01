const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();



const verifyToken = (req, res, next) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Token expired or invalid" });

    req.user = decoded;
    next();
  });
};


const verifyOptionalToken = (req, res, next) => {
  const token = req.cookies.accessToken;

  // Ensure req.user is always an object
  req.user = { id: "guest" };

  if (!token) {
    return next();
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return next();
    }

    req.user = decoded; // Assign authenticated user data
    next();
  });
};


module.exports = {
  verifyToken,
  verifyOptionalToken
}
