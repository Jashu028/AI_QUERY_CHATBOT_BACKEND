const express = require("express");
const {verifyToken, verifyAdmin} = require("../util/token-verify.js");
const { getAllOrders, updateOrder, getAllProducts, addProduct, updateProduct, deleteProduct, getAdminProfile } = require("../controller/adminController.js");

const adminRoute = express.Router();

adminRoute.get("/orders", verifyToken, verifyAdmin, getAllOrders);
adminRoute.patch("/orders/:orderId", verifyToken, verifyAdmin, updateOrder);
adminRoute.get("/products", verifyToken, verifyAdmin, getAllProducts);
adminRoute.post("/products", verifyToken, verifyAdmin, addProduct);
adminRoute.patch("/products/:productId", verifyToken, verifyAdmin, updateProduct);
adminRoute.delete("/products/:productId", verifyToken, verifyAdmin, deleteProduct);
adminRoute.get("/profile", verifyToken, verifyAdmin, getAdminProfile);

module.exports = adminRoute;