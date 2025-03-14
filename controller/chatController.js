import Chat from "../models/chatModel.js";

export const message =  async (req, res) => {
    try {
      const { content } = req.body;
      const userId = req.user.id;
  
      let chat = await Chat.findOne({ userId });
  
      if (!chat) {
        chat = new Chat({ userId, messages: [] });
      }
  
      
      // 🔍 Use MongoDB Full-Text Search for better matching
    //   fetchProductsFromDB(content);
    //   fetchFilteredProducts(content);
    //   const product = await Product.findOne({ $text: { $search: content } });
    //   console.log("Received user query:", content);
    //   console.log(product);
      // ✅ Store User Message
      const userMessage = { sender: "user", content };
      chat.messages.push(userMessage);
  
      // ✅ Generate AI Bot Response
      const botMessage = {
        sender: "bot",
        content: `This is an AI response to: "${content}"`,
      };
      chat.messages.push(botMessage);
  
      await chat.save();
  
      return res.status(200).json(botMessage);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error processing message" });
    }
  };

  export const history = async (req, res) => {
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