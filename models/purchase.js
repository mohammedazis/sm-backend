const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const purchaseSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Buyer's name
  invoice: { type: String, required: true, unique: true }, // Unique invoice number
  phone_no: { type: String, required: true }, // Buyer's unique phone number
  BuyerGst: { type: String }, // Buyer's GST
  products: [
    {
      name: { type: String, required: true }, // Product name
      quantity: { type: Number, required: true }, // Quantity purchased
      price: { type: Number, required: true }, // Price per unit
      total_price: { type: Number, required: true } // Total price for the product
    }
  ],
  subtotal: { type: Number }, // Subtotal of the purchase
  createdBy: { type: String, required: true }, // Current logged-in user
  date: { type: Date, default: Date.now }, // Date of purchase
});

// Applying unique validator for the schema
purchaseSchema.plugin(uniqueValidator, { message: '{PATH} must be unique.' });

module.exports = mongoose.model('Purchase', purchaseSchema);
