import express from "express";
import { products } from "../controller/productController.js";

const productRoute = express.Router();

productRoute.get("/", products);

export default productRoute;