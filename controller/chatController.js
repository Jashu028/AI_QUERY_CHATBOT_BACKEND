const Chat = require('../models/chatModel.js');
const dotenv = require('dotenv');
const {handleChatbotQuery} = require('../Prompt/queryPrompt.js');
const OpenAI = require('openai');

dotenv.config();



const message = async (req, res) => {
  try {
    const { content } = req.body;
    const userId = req.user.id;

    let chat = await Chat.findOne({ userId });

    if (!chat) {
      chat = new Chat({ userId, messages: [] });
    }

    const prompt = await handleChatbotQuery(content, userId);
    console.log(prompt)
    const userMessage = { sender: "user", content };
    chat.messages.push(userMessage);

    const client = new OpenAI({
      apikey: process.env.OPENAI_API_KEY,
    });

    const completion = await client.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
            {
                role: "user",
                content: prompt,
            },
        ],
        max_tokens: 500,
    });

    const botReply = completion.choices[0].message.content;
    console.log(botReply)
    const botMessage = { sender: "bot", content: botReply };
    chat.messages.push(botMessage);

    await chat.save();

    return res.status(200).json(botMessage);
  } catch (error) {
    console.error("Error Processing Message:", error);
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