import express from "express";
import { getCart, products, updateCart } from "../controller/productController.js";
import { verifyToken } from "../util/token-verify.js";

const productRoute = express.Router();

productRoute.get("/", products);
productRoute.get("/cart", verifyToken, getCart);
productRoute.post("/cart/update", verifyToken, updateCart);

export default productRoute;