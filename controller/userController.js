const User = require("../models/userModel.js");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const nodemailer = require('nodemailer');
dotenv.config();

const generateAccessToken = (user) => jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
const generateRefreshToken = (user) => jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
const generateVerificationToken = (userId) => jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "15m" });


const sendverifymail = async(name, email, token)=>{
  try {    
    const transporter = nodemailer.createTransport({
      host : 'smtp.gmail.com',
      port : 587,
      secure : false,
      requireTLS : true,
      auth:{
        user : process.env.USERMAIL,
        pass : process.env.USERPASSWORD 
      }
    });

    const htmlcontent = `
  <div style="text-align: center;">
    <p>Hi ${name},</p>
    <p>Please click the button below to verify your email:</p>
    <a href="${process.env.FRONTEND_BASE_URL}/verify-account/${token}" 
       style="
         display: inline-block;
         padding: 10px 20px;
         color: #fff;
         background-color: #007bff;
         text-decoration: none;
         border-radius: 5px;
         font-weight: bold;
         margin-top: 20px;">
      Verify Your Email
    </a>
  </div>
`;
    const mailoptions = {
      from : process.env.USERMAIL,
      to : email,
      subject : 'For Verification mail',
      html : htmlcontent,
    };

    transporter.sendMail(mailoptions, (error,info)=>{
      if(error){
        console.log(error);
      }
      else{
        console.log('Email has been sent '+info.response);
      }
    });

  } catch (error) {
    console.log(error.message);
  }
}

const sendResetLink = async(name, email, resetLink)=>{
  try {    
    const transporter = nodemailer.createTransport({
      host : 'smtp.gmail.com',
      port : 587,
      secure : false,
      requireTLS : true,
      auth:{
        user : process.env.USERMAIL,
        pass : process.env.USERPASSWORD 
      }
    });

    const htmlcontent = `
  <div style="text-align: center;">
    <p>Hi ${name},</p>
    <p>Please click the button below to Reset your Password:</p>
    <a href="${resetLink}" 
       style="
         display: inline-block;
         padding: 10px 20px;
         color: #fff;
         background-color: #007bff;
         text-decoration: none;
         border-radius: 5px;
         font-weight: bold;
         margin-top: 20px;">
      Reset Password
    </a>
  </div>
`;
    const mailoptions = {
      from : process.env.USERMAIL,
      to : email,
      subject : 'For Reset Password mail',
      html : htmlcontent,
    };

    transporter.sendMail(mailoptions, (error,info)=>{
      if(error){
        console.log(error);
      }
      else{
        console.log('Email has been sent '+info.response);
      }
    });

  } catch (error) {
    console.log(error.message);
  }
}

const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(401).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ name, email, password: hashedPassword });
    const user = await newUser.save();

    if (!user) {
      return res.status(404).json({ error: "Registration has failed!" });
    }

    const token = generateVerificationToken(user._id);
    await sendverifymail(name, email, token);

    return res.status(201).json({
      message: "Your registration has been successful, Please verify your Email",
    });

  } catch (error) {
    console.error("Registration Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!user.isVerified) {
      return res.status(401).json({ error: "Account is not verified!" });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const accessToken = generateAccessToken({
      id: user.id,
      name: user.name,
      email: user.email,
    });
    const refreshToken = generateRefreshToken({
      id: user.id,
      name: user.name,
      email: user.email,
    });

    res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    maxAge: 15 * 60 * 1000,
  });
  
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });


    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const verifyMail = async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isVerified) {
      return res.status(200).json({ message: "Account already verified" });
    }

    user.isVerified = true;
    await user.save();

    res.status(200).json({ message: "Account verified successfully!" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Invalid or expired token" });
  }
};


const forgot = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "User not found" });

    const token = generateVerificationToken(user._id);
    const resetLink = `${process.env.FRONTEND_BASE_URL}/reset-password/${token}`;

    sendResetLink(user.name, email, resetLink);

    return res.status(200).json({ message: "Password reset link sent to email" });
  } catch (error) {
    console.error("Forgot password error:", error.message);
    res.status(500).json({ error: "Something went wrong" });
  }
};


const resetPassword = async (req, res) => { 
  try {
    const { token } = req.params;
    const { password } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    user.password = await bcrypt.hash(password, 10);
    await user.save();
    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.log(err)
    res.status(400).json({ error: "Invalid or expired token" });
  }
};

const refresh =  (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(403).json({ message: "Refresh token missing" });

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid refresh token" });

    const newAccessToken = generateAccessToken({ id: user.id, name: user.name, email: user.email });
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 60 * 1000,
    });

    res.json({ message: "Token refreshed" });
  });
};

const logout =  (req, res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.status(200).json({ message: "Logged out successfully" });
};

const checkAuth = (req, res) => {
  res.status(200).json({ user: req.user });
};


module.exports = {
  register,
  login,
  refresh,
  logout,
  checkAuth,
  verifyMail,
  forgot,
  resetPassword
}
