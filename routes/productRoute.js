const express = require("express");
const { addFavorite, getCart, getFavorites, products, removeFavorite, updateCart, product, addReview, getProductReviews, placeOrder, getMyOrders, productReturn } = require("../controller/productController.js");
const {verifyToken, verifyOptionalToken} = require("../util/token-verify.js");

const productRoute = express.Router();

productRoute.get("/", products);
productRoute.get("/product/:productId", verifyOptionalToken, product);
productRoute.get("/cart", verifyToken, getCart);
productRoute.post("/cart/update", verifyToken, updateCart);
productRoute.get("/favorites", verifyToken, getFavorites);
productRoute.post("/favorites", verifyToken, addFavorite);
productRoute.delete("/favorites/:productId", verifyToken, removeFavorite);
productRoute.post("/review/:productId", verifyToken, addReview);
productRoute.get("/review/:productId",verifyOptionalToken, getProductReviews);
productRoute.post("/order", verifyToken, placeOrder);
productRoute.get("/order", verifyToken, getMyOrders);
productRoute.put('/order/:orderId/return', verifyToken, productReturn);

module.exports = productRoute;