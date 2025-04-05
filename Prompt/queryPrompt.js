const nlp = require('compromise');
const Product = require('../models/productModel');

const previousProducts = new Map();
let isPreviousQuery = false;
let isPriceConditionMore = false;
let previousPriceCondition = null;

function generatePrompt(query, matchedProducts, isMoreQuery) {
    let prompt = `# Role:
You are a helpful shopping assistant for an online store. Your task is to respond to user queries about products in an engaging and informative way. Response to the User query based on the informative the system provide and response should be based on that directly to the User.

# User Query:
"${query}"

${isMoreQuery ? "User has requested more products." : "Searching database for matching products."}

# Retrieved Products:
`;

if (matchedProducts.length > 0) {
            prompt += `Matched Products:\n${matchedProducts
                .map((p) => `-ProductId: ${p.productId} - ${p.name}: $${p.price}, Rating: ${p.rating}`)
                .join("\n")}\n\n`;
            prompt += `Generate a friendly and engaging response summarizing the new product recommendations. Each product name should be a clickable hyperlink leading to {${process.env.FRONTEND_BASE_URL}/product/:productId}. Briefly highlight their key features, such as price, rating, and unique selling points, in a conversational tone that feels natural and helpful. Format the response using markdown so that the links are properly clickable.`;
        } else {
        prompt += `No matching products were found.
# Response:
I'm sorry, but I couldn't find any products that match your request. You can try searching with different keywords, or let me know what you're looking for, and I'll do my best to assist you! 😊`;
    }

    return prompt;
}

function parsePriceQuery(query) {
    const match = query.match(/(below|under|less than|above|more than|greater than|between|from|range of)?\s*\$?(\d+)(?:\s*(and|to)\s*\$?(\d+))?/i);

    if (!match) return null;

    const [, modifier, num1, rangeKeyword, num2] = match;
    const price1 = parseInt(num1, 10);
    const price2 = num2 ? parseInt(num2, 10) : null;

    if (isNaN(price1)) return null;

    if (modifier && /below|under|less than/i.test(modifier)) {
        return { price: { $lt: price1 } };
    } 
    
    if (modifier && /above|more than|greater than/i.test(modifier)) {
        return { price: { $gt: price1 } };
    } 

    if ((modifier === "between" || modifier === "from" || modifier === "range of") && price2 && !isNaN(price2)) {
        return { price: { $gte: Math.min(price1, price2), $lte: Math.max(price1, price2) } };
    }

    if (modifier === "range of" && !price2) {
        return { price: { $lt: price1 } };
    }

    return null;
}

async function extractAndFetchProducts(query, userId) {
    const doc = nlp(query);
    const extractedNouns = doc.match('#Noun').out('array').map(n => n.toLowerCase());
    const hasProductKeyword = doc.has('products') || doc.has('product');
    const isMoreQuery = query.trim().toLowerCase() === "more" || query.includes("more products");
    const priceCondition = parsePriceQuery(query);

    console.log("Extracted Nouns:", extractedNouns);

    if (!previousProducts.has(userId)) {
        previousProducts.set(userId, []);
    }

    let matchedProducts = [];

    try {
        if (isMoreQuery && (isPreviousQuery || isPriceConditionMore)) {
            console.log("User requested more products...");
            const excludedProductIds = previousProducts.get(userId);

            matchedProducts = await Product.find({
                _id: { $nin: excludedProductIds },
                ...(previousPriceCondition || {}),
            }).limit(5);

            if (matchedProducts.length === 0) {
                return "User has requested to see more products, but there are no more products left to show. Generate a friendly and apologetic response that clearly informs the user that all available products have already been displayed. Recommend User to search for other products!";
            }

            previousProducts.set(userId, [...excludedProductIds, ...matchedProducts.map(p => p._id.toString())]);

            const prompt = generatePrompt(query, matchedProducts, true);
            return prompt + "\n\nIf you're interested in even more products, just type 'more products'!";
        }

        if (extractedNouns.length > 0) {
            isPreviousQuery = false;
            isPriceConditionMore = false;
            matchedProducts = await Product.find({ $text: { $search: extractedNouns.join(" ") } });
        }

        if (matchedProducts.length === 0 && priceCondition) {
            isPreviousQuery = false;
            const allMatchedProducts = await Product.find(priceCondition);
            previousPriceCondition = priceCondition;
            isPriceConditionMore = allMatchedProducts.length > 4;
            matchedProducts = allMatchedProducts.slice(0, 5);
        }

        if (matchedProducts.length === 0 && hasProductKeyword) {
            isPriceConditionMore = false;
            console.log("Returning first 5 products due to generic product request...");
            isPreviousQuery = true;
            matchedProducts = await Product.find().limit(5);
        }

        previousProducts.set(userId, matchedProducts.map(p => p._id.toString()));

        if (previousProducts.size > 50) {
            const firstKey = previousProducts.keys().next().value;
            previousProducts.delete(firstKey);
        }

        const prompt = generatePrompt(query, matchedProducts, false);
        
        if ((hasProductKeyword && matchedProducts.length >= 5) || (isPriceConditionMore && priceCondition)) {
            return prompt + "\n\nIf you're interested in more products, just type 'more products'!";
        }

        return prompt;
    } catch (error) {
        console.error("Error fetching products:", error);
        return "Oops! Something went wrong while searching for products. Please try again later.";
    }
}

module.exports = { extractAndFetchProducts };