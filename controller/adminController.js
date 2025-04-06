const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const Admin = require('../models/userModel');

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "name email")
      .populate("products.product_Id", "name price image");

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

const updateOrder = async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
  
      const updatedOrder = await Order.findOneAndUpdate(id, updates, { new: true });
      res.json(updatedOrder);
    } catch (err) {
      res.status(500).json({ error: "Failed to update order" });
    }
  };

const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
};

const deleteProduct = async (req, res) => {
    try {
      const { productId } = req.params;
      await Product.findByIdAndDelete(productId);
      res.json({ message: "Product deleted" });
    } catch (err) {
        console.log(err);
      res.status(500).json({ error: "Failed to delete product" });
    }
  };

const updateProduct = async (req, res) => {
    try {
      const { productId } = req.params;
      const updates = req.body;
  
      const updatedProduct = await Product.findByIdAndUpdate(productId, updates, { new: true });
      res.json(updatedProduct);
    } catch (err) {
      res.status(500).json({ error: "Failed to update product" });
    }
  };

const addProduct = async (req, res) => {
    try {
      const { name, productId, description, price, image } = req.body;
  
      const newProduct = new Product({ name, productId, description, price, image });
      await newProduct.save();
  
      res.status(201).json(newProduct);
    } catch (err) {
      res.status(500).json({ error: "Failed to add product" });
    }
  };

const getAdminProfile = async (req, res) => {
    try {
      const adminId = req.user.id;
  
      const admin = await Admin.findById(adminId).select('-password');
      
      if(admin.role !== req.user.role){
        return res.status(403).json({message: 'Unauthorized'});
      }

      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }
  
      res.status(200).json(admin);
    } catch (error) {
      console.error('Error fetching admin profile:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };

module.exports = {
  getAdminProfile,
  getAllOrders,
  updateOrder,
  getAllProducts,
  deleteProduct,
  updateProduct,
  addProduct,
}
  