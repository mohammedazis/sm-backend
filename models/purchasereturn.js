// models/purchasereturn.js
const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const purchaseReturnSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Buyer's name
  invoice: { type: String, required: true, unique: true }, // Unique invoice number
  phone_no: { type: String, required: true, unique: true }, // Buyer's unique phone number
  BuyerGst: { type: String }, // Buyer's GST (optional)
  products: [
    {
      name: { type: String, required: true }, // Product name
      quantity: { type: Number, required: true }, // Quantity returned
    }
  ],
  createdBy: { type: String, required: true }, // User who processed the return
  date: { type: Date, default: Date.now } // Date of return, defaults to now
});

// Applying unique validator for fields that should be unique
purchaseReturnSchema.plugin(uniqueValidator);

module.exports = mongoose.model('PurchaseReturn', purchaseReturnSchema);
