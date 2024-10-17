// models/salereturndamage.js
const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const saleReturnDamageSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Customer name
  mobile_no: { type: String, required: true }, // Customer mobile number
  invoice: { type: String, required: true }, // Original sale invoice number
  products: [
    {
      name: { type: String, required: true }, // Product name
      quantity: { type: Number, required: true }, // Quantity returned
    },
  ],
  createdBy: { type: String, required: true }, // User who processed the return
  date: { type: Date, default: Date.now }, // Date of return, defaults to now
});

// Applying unique validator for the schema
saleReturnDamageSchema.plugin(uniqueValidator);

module.exports = mongoose.model('SaleReturnDamage', saleReturnDamageSchema);