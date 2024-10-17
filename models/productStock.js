// models/productstock.js
const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const productStockSchema = new mongoose.Schema({
    productname: { type: String, required: true, unique: true }, // Product name should be unique
    quantity: { type: Number, required: true }, // Quantity of product in stock
    createdBy: { type: String}, // Quantity of product in stock
});

// Apply the uniqueValidator plugin to enforce unique constraints
productStockSchema.plugin(uniqueValidator, { message: 'Error, expected {PATH} to be unique.' });

module.exports = mongoose.model('ProductStock', productStockSchema);