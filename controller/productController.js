import Cart from "../models/cartModel.js";
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


//Cart functionality

//Add and Update Cart
export const updateCart = async (req, res) => {
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


export const getCart = async (req, res) => {
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


// Favortites products

export const getFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const favorites = await Product.find({ favorites: userId });
    res.json(favorites);
  } catch (error) {
    res.status(500).json({ message: "Error fetching favorites" });
  }
};

export const addFavorite = async (req, res) => {
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

export const removeFavorite = async (req, res) => {
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