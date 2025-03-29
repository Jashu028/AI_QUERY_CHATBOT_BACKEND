const nlp = require('compromise');
const Product = require('../models/productModel');

const previousProducts = new Map();
let isPreviousQuery = false;

function generatePrompt(query, matchedProducts, searchQuery, isMoreQuery) {
    let prompt = `User Query: "${query}"\n\n`;

    if (isMoreQuery) {
        prompt += "User requested more products.\n\n";
    } else {
        prompt += `Search Keywords: ${searchQuery}\n\n`;
    }

    if (matchedProducts.length > 0) {
        prompt += `Matched Products:\n${matchedProducts
            .map((p) => `-ProductId: ${p.productId} - ${p.name}: $${p.price}, Rating: ${p.rating}`)
            .join("\n")}\n\n`;
        prompt += `Generate a friendly and engaging response summarizing the new product recommendations. Each product name should be a clickable hyperlink leading to {localhost:5173/product/:productId}. Briefly highlight their key features, such as price, rating, and unique selling points, in a conversational tone that feels natural and helpful. Format the response using markdown so that the links are properly clickable.`;
    } else {
        prompt += `No matching products were found. Provide a general response.`;
    }

    return prompt;
}

async function extractAndFetchProducts(query, userId) {
    const doc = nlp(query);
    const extractedNouns = doc.match('#Noun').out('array').map(n => n.toLowerCase());
    const hasPriceFilter = doc.has('under #Value') || doc.has('below #Value') || /\$(\d+)/.test(query);
    const hasProductKeyword = doc.has('products') || doc.has('product');
    const isMoreQuery = query.trim().toLowerCase() === "more" || query.includes("more products");

    console.log("Extracted Nouns:", extractedNouns);

    if (!previousProducts.has(userId)) {
        previousProducts.set(userId, []);
    }

    let matchedProducts = [];

    try {
        if (isMoreQuery && isPreviousQuery) {
            console.log("User requested more products...");
            const excludedProductIds = previousProducts.get(userId);

            matchedProducts = await Product.find({ _id: { $nin: excludedProductIds } }).limit(5);

            if (matchedProducts.length === 0) {
                return "You've already seen all available products. Let me know if you're looking for something specific!";
            }

            previousProducts.set(userId, [...excludedProductIds, ...matchedProducts.map(p => p._id.toString())]);

            const prompt = generatePrompt(query, matchedProducts, "more products", true);
            isPreviousQuery = false;
            return prompt + "\n\nIf you're interested in even more products, just type 'more products'!";
        }

        if (extractedNouns.length > 0) {
            isPreviousQuery = false;
            matchedProducts = await Product.find({ $text: { $search: extractedNouns.join(" ") } });
        }

        if (matchedProducts.length === 0 && hasProductKeyword) {
            console.log("Returning first 5 products due to generic product request...");
            isPreviousQuery = true;
            matchedProducts = await Product.find().limit(5);
        }

        if (matchedProducts.length === 0 && hasPriceFilter && hasProductKeyword) {
            isPreviousQuery = false;
            console.log("Returning first 5 products due to price filter...");
            matchedProducts = await Product.find().limit(5);
        }

        previousProducts.set(userId, matchedProducts.map(p => p._id.toString()));

        const prompt = generatePrompt(query, matchedProducts, extractedNouns.join(" "), false);
        
        if (hasProductKeyword && !hasPriceFilter) {
            return prompt + "\n\nIf you're interested in more products, just type 'more products'!";
        }

        return prompt;
    } catch (error) {
        console.error("Error fetching products:", error);
        return "No matching products found.";
    }
}


module.exports = {extractAndFetchProducts};