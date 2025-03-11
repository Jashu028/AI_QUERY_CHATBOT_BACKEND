import Product from "../models/productModel.js";



export const products = async (req, res) => {
    try {
      const products = await Product.find().lean(); // ✅ Convert Mongoose documents to plain objects
      const formattedProducts = products.map((product) => ({
        ...product,
        id: product._id.toString(), // ✅ Convert `_id` to `id`
      }));
  
      res.json(formattedProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
};