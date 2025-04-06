const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

// 🔧 Custom function to generate 10-character alphanumeric orderId
function generateShortOrderId() {
  const uuid = uuidv4().replace(/-/g, '');
  const shortId = parseInt(uuid.slice(0, 12), 16).toString(36);
  return shortId.slice(0, 10);
}

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    default: generateShortOrderId,
    unique: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  products: [
    {
      product_Id: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
      productId: { type: String, required: true },
      quantity: { type: Number, required: true },
      amount: { type: Number, required: true },
    },
  ],
  totalAmount: {
    type: Number,
    required: true,
  },
  orderStatus: {
    type: String,
    enum: ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"],
    default: "Pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  returnRequested: {
    type: Boolean,
    default: false,
  },
  returnStatus: {
    type: String,
    enum: ["Not Requested", "Requested", "Approved", "Rejected", "Processed"],
    default: "Not Requested",
  },
  refundAmount: {
    type: Number,
    default: 0,
  },
  refundProcessed: {
    type: Boolean,
    default: false,
  },
  returnReason: {
    type: String,
  },

});

module.exports = mongoose.model("Order", orderSchema);
