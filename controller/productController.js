const Cart = require("../models/cartModel.js");
const Product = require("../models/productModel.js");
const Review = require("../models/reviewModel.js");
const User = require("../models/userModel.js");



const products = async (req, res) => {
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

const product = async (req, res) => {
  try {
    const product = await Product.findOne({ productId: req.params.productId });

    if (!product) {
      return res.status(404).json({ message: "Product not found" }); // Stops execution
    }

    const isFavorite = req.user.id !== "guest" && product.favorites.includes(req.user.id);

    return res.json({ ...product.toObject(), favourite: isFavorite }); // Use `return` to stop execution
  } catch (error) {
    console.error("Error fetching product:", error);
    return res.status(500).json({ message: "Error fetching product", error });
  }
};


const updateCart = async (req, res) => {
  const userId = req.user.id;
  const { addedToCart, updatedCount } = req.body;

  try {
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    
    const addedProductIds = addedToCart.map(item => item.productId);
    const addedProducts = await Product.find({ productId: { $in: addedProductIds } });

    const productIdMap = new Map(addedProducts.map(p => [p.productId, p._id]));

    
    addedToCart.forEach(({ productId, quantity }) => {
      const existingItem = cart.items.find(i => i.productId === productId);
      const product_Id = productIdMap.get(productId);

      if (existingItem) {
        existingItem.quantity += quantity;
      } else if (product_Id) {
        cart.items.push({ productId, product_Id, quantity });
      }
    });
    
    
    updatedCount.forEach(({ productId, quantity }) => {
      const itemIndex = cart.items.findIndex(i => i.productId === productId);
      if (itemIndex !== -1) {
        if (quantity === 0) {
          cart.items.splice(itemIndex, 1);
        } else {
          cart.items[itemIndex].quantity = quantity;
        }
      }
    });
    
    await cart.save();
    res.status(200).json({ message: "Cart updated successfully" });
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({ message: "Server error" });
  }
};


const getCart = async (req, res) => {
  const userId = req.user.id;
  try {
    const cart = await Cart.findOne({ userId }).populate("items.product_Id");
    if (!cart) {
      return res.status(200).json({ items: [] });
    }
    res.status(200).json({ items: cart.items });
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const favorites = await Product.find({ favorites: userId });
    res.json(favorites);
  } catch (error) {
    res.status(500).json({ message: "Error fetching favorites" });
  }
};

const addFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    const product = await Product.findOne({ productId });
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (!product.favorites.includes(userId)) {
      product.favorites.push(userId);
      await product.save();
    }

    res.json({ message: "Added to favorites", product });
  } catch (error) {
    res.status(500).json({ message: "Error adding favorite" });
  }
};

const removeFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const product = await Product.findOne({ productId });
    if (!product) return res.status(404).json({ message: "Product not found" });

    product.favorites = product.favorites.filter((id) => id.toString() !== userId);
    await product.save();

    res.json({ message: "Removed from favorites", product });
  } catch (error) {
    res.status(500).json({ message: "Error removing favorite" });
  }
};

const addReview = async(req, res) => {
    try {
      const {rating, comment} = req.body;
      const {productId} = req.params;
    
      const user = await User.findById(req.user.id);

      if(!user)
        return res.status(401).json({message: "Unauthorized"});

      const product = await Product.findOne({productId});

      if(!product)
        return res.status(404).json({message: "Product Not Found"});

      const review = await Review.create({
        product_Id: product._id,
        productId,
        userId: user._id,
        userName: user.name,
        rating,
        comment
      });

      product.reviews.push(review._id);
      await product.save();
      const reviews = { id : review._id, userId: review.userId, userName: "you", rating: review.rating, comment: review.comment, createdAt: review.createdAt};
      return res.status(201).json({ message: "Review Created Successfully", reviews });
    } catch (error) {
      console.error("Error adding review:", error);
      res.status(500).json({ message: "Error adding review" });
    }
};



module.exports = {
  products,
  product,
  getCart,
  updateCart,
  addFavorite,
  getFavorites,
  removeFavorite,
  addReview
}