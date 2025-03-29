const express = require("express");
const { addFavorite, getCart, getFavorites, products, removeFavorite, updateCart, product } = require("../controller/productController.js");
const verifyToken = require("../util/token-verify.js");

const productRoute = express.Router();

productRoute.get("/", products);
productRoute.get("/product/:productId", product);
productRoute.get("/cart", verifyToken, getCart);
productRoute.post("/cart/update", verifyToken, updateCart);
productRoute.get("/favorites", verifyToken, getFavorites);
productRoute.post("/favorites", verifyToken, addFavorite);
productRoute.delete("/favorites/:productId", verifyToken, removeFavorite);

module.exports = productRoute;