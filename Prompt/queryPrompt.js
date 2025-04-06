const nlp = require('compromise');
const Product = require('../models/productModel');
const Order = require("../models/orderModel");

const previousProducts = new Map();
let isPreviousQuery = false;
let isPriceConditionMore = false;
let previousPriceCondition = null;


// ✅ Enhanced handleOrderQuery to support returns, refunds, and order inquiries
async function handleOrderQuery(query, orderId, userId) {
  const doc = nlp(query);
  const matchedOrderId = query.match(/(?:order\s*id[:\s]*)?([a-zA-Z0-9]{10})/i);
  let finalOrderId = orderId;

  if (!finalOrderId && matchedOrderId) {
    finalOrderId = matchedOrderId[1];
  }

  const isRecentOrder = /my (last|recent|previous|current) order/i.test(query);
  const mentionsOrder = /\border\b/i.test(query);
  const mentionsReturn = /\b(return|returned|returning)\b/i.test(query);
  const mentionsRefund = /\b(refund|refunded|refunds)\b/i.test(query);

  try {
    let order;
    let prompt = `# Role:
You are a helpful shopping assistant for an online store. Your task is to respond to user queries about their orders, returns, and refunds in an informative and supportive way. Your responses should be clear, friendly, and directly based on the system data provided below.

#UserQuery:\n"${query}"

#System:`;

    // 🔹 1. Try to fetch specific order by ID
    if (finalOrderId) {
      order = await Order.findOne({ orderId: finalOrderId, userId })
        .populate('products.product_Id', 'name image');

      if (!order) {
        return await returnAllOrdersFallback(prompt, userId);
      }

      return formatSingleOrderResponse(prompt, order, query);
    }

    // 🔹 2. Check if asking for recent order
    if (isRecentOrder) {
      order = await Order.findOne({ userId }).sort({ createdAt: -1 })
        .populate('products.product_Id', 'name image');

      if (!order) {
        return `${prompt}\n\nNo recent orders found for this user. Generate a helpful and friendly response encouraging them to explore our products and place their first order.`;
      }

      return formatSingleOrderResponse(prompt, order, query);
    }

    // 🔹 3. General order-related query — show all
    if (mentionsOrder || mentionsReturn || mentionsRefund) {
      return await returnAllOrdersFallback(prompt, userId);
    }

    // 🛑 If not order-related, fallback
    return `${prompt}\n\nUnable to determine intent. Politely ask the user to clarify their question and mention available support like product details, orders, returns, and refunds.`;
  } catch (err) {
    console.error("Error in handleOrderQuery:", err);
    return `#UserQuery:\n"${query}"\n\n#System:\nSorry! I had trouble retrieving your orders. Please try again shortly.`;
  }
}

function formatSingleOrderResponse(prompt, order, query) {
  const items = order.products.map(p => {
    const name = p.product_Id?.name || 'Unknown Item';
    const quantity = p.quantity;
    const amount = p.amount?.toFixed(2) || '0.00';
    return `- ${name} (Qty: ${quantity}, Price: $${amount})`;
  }).join("\n");

  const returnNote = order.returnRequested
    ? `\n**Return Status:** ${order.returnStatus}  \n**Refund Amount:** $${order.refundAmount?.toFixed(2) || '0.00'}  \n**Return Reason:** ${order.returnReason || 'N/A'}  \n**Refund Processed:** ${order.refundProcessed ? 'Yes' : 'No'}`
    : '';

  return `${prompt}\n\n### 🧾 Order Summary\n**Order ID:** ${order.orderId}  \n**Status:** ${order.orderStatus}  \n**Total Amount:** $${order.totalAmount.toFixed(2)}  \n**Placed On:** ${new Date(order.createdAt).toLocaleDateString()}${returnNote}\n\n**Items Ordered:**\n${items}\n\nLet me know if you want to track this order, request a return, ask about refunds, or anything else!`;
}

async function returnAllOrdersFallback(prompt, userId) {
  const allOrders = await Order.find({ userId })
    .sort({ createdAt: -1 })
    .populate('products.product_Id', 'name image');

  if (allOrders.length === 0) {
    return `${prompt}\n\nNo orders found for this user. Generate a warm and inviting response suggesting the user explore our products and place their first order.`;
  }

  const allOrderSummaries = allOrders.map(order => {
    const items = order.products.map(p =>
      `- ${p.product_Id?.name} (Qty: ${p.quantity}, $${p.amount})`
    ).join("\n");

    const returnInfo = order.returnRequested
      ? `\nReturn Status: ${order.returnStatus}, Refund Amount: $${order.refundAmount?.toFixed(2)}`
      : '';

    return `**Order ID:** ${order.orderId}\nStatus: ${order.orderStatus}${returnInfo}\nPlaced On: ${new Date(order.createdAt).toLocaleDateString()}\nItems:\n${items}`;
  }).join("\n---\n");

  return `${prompt}\n\n### 🧾 Your Orders\n\n${allOrderSummaries}\n\nLet me know if you want to check a specific order, request a return, track a delivery, or inquire about a refund.`;
}


// ✅ Optimized handlePolicyQuery with structured prompt
function handlePolicyQuery(query) {
  const lower = query.toLowerCase();
  let prompt = `# Role:
You are a helpful shopping assistant for an online store. Your task is to respond to user queries about products in an engaging and informative way. Response to the User query based on the informative the system provide and response should be based on that directly to the User. \n
#UserQuery:\n"${query}"\n\n#System:`;

  if (lower.includes("return")) {
    return `${prompt}\n\nProvide details about the return policy: returns allowed within 14 days, items must be unused and in original condition.`;
  }

  if (lower.includes("refund")) {
    return `${prompt}\n\nProvide refund policy: processed within 5–7 business days after receiving the return.`;
  }

  if (lower.includes("shipping")) {
    return `${prompt}\n\nMention shipping policy: free shipping over $50, estimated delivery 3–5 business days.`;
  }
  
  return `${prompt}\n\nMention general store policies and encourage the user to specify what they want to know more about.`;
}

  
  

function generatePrompt(query, matchedProducts, isMoreQuery) {
    let prompt = `
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

async function handleChatbotQuery(query, userId) {
    const queryType = classifyQuery(query);
  
    if (queryType === "order") {
      const matchedOrderId = query.match(/(?:order\s*id[:\s]*)?([a-zA-Z0-9]{6,})/i);
      const extractedOrderId = matchedOrderId ? matchedOrderId[1] : null;
      return await handleOrderQuery(query, extractedOrderId, userId);
    }
  
    if (queryType === "policy") {
      return handlePolicyQuery(query);
    }
  
    return await extractAndFetchProducts(query, userId);
  }

function classifyQuery(query) {
    const lowerQuery = query.toLowerCase();
  
    if (/order|orders|track|placed|status|delivery|cancel|refund|return/.test(lowerQuery)) {
      return "order";
    } else if (/policy|shipping|return policy|refund policy|terms|conditions/.test(lowerQuery)) {
      return "policy";
    } else {
      return "product";
    }
  }
  

module.exports = { handleChatbotQuery };