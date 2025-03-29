const Chat = require('../models/chatModel.js');
const dotenv = require('dotenv');
const {extractAndFetchProducts} = require('../Prompt/queryPrompt.js');
const { GoogleGenerativeAI } = require('@google/generative-ai'); // demo implmentation using Gemini API before using OPENAI API

dotenv.config();



const message = async (req, res) => {
  try {
    const { content } = req.body;
    const userId = req.user.id;

    let chat = await Chat.findOne({ userId });

    if (!chat) {
      chat = new Chat({ userId, messages: [] });
    }

    const prompt = await extractAndFetchProducts(content, userId);
    const userMessage = { sender: "user", content };
    chat.messages.push(userMessage);

    console.log("🔹 Prompt for ChatGPT API:\n", prompt);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent(prompt);
    console.log(result.response.text());

    const botReply = result.response.text()
    console.log("🤖 ChatGPT Response:", botReply);

    const botMessage = { sender: "bot", content: botReply };
    chat.messages.push(botMessage);

    await chat.save();

    return res.status(200).json(botMessage);
  } catch (error) {
    console.error("❌ Error Processing Message:", error);
    res.status(500).json({ message: "Error processing message" });
  }
};

const history = async (req, res) => {
    try {
      const chat = await Chat.findOne({ userId: req.user.id });
  
      if (!chat) {
        return res.status(200).json([]);
      }
  
      return res.status(200).json(chat.messages);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error retrieving chat history" });
    }
};

module.exports = {
  message,
  history
}