import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  productId: {type: String, required:true},
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  rating: { type: Number, default: 0 },
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

const Product = mongoose.model("Product", productSchema);
export default Product;
