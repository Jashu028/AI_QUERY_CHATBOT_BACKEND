import express from "express";
import { addFavorite, getCart, getFavorites, products, removeFavorite, updateCart } from "../controller/productController.js";
import { verifyToken } from "../util/token-verify.js";

const productRoute = express.Router();

productRoute.get("/", products);
productRoute.get("/cart", verifyToken, getCart);
productRoute.post("/cart/update", verifyToken, updateCart);
productRoute.get("/favorites", verifyToken, getFavorites);
productRoute.post("/favorites", verifyToken, addFavorite);
productRoute.delete("/favorites/:productId", verifyToken, removeFavorite);

export default productRoute;