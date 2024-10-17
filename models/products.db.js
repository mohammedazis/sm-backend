const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const productSchema = new mongoose.Schema({
  product_Name: { type: String, required: true, unique: true }, // Name of the product
  product_description: { type: String, required: true }, // Product description
  createdBy: { type: String }, // User who created the product
  hsn: { type: String, required: true }, // HSN code (or similar identifier)
  uniquecode: { type: String, required: true, unique: true }, // Unique code for the product
  date: { type: Date, default: Date.now }, // Creation date
});

// Apply the uniqueValidator plugin to the schema
productSchema.plugin(uniqueValidator, { message: 'Error, expected {PATH} to be unique.' });

module.exports = mongoose.model('Product', productSchema);
