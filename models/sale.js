// models/sale.js
const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const productSchema = new mongoose.Schema({
    productname: { type: String, required: true },
    quantity: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
});

const saleSchema = new mongoose.Schema({
    name: { type: String, required: true },
    mobile_no: { type: String, required: true, unique: true },
    products: [productSchema],
    createdBy: { type: String, }, // User who created the sale
    invoice: { type: String, required: true, unique: true },
    gst: { type: Number, required: true },
    type: { type: String, required: true }, // Now type is just a string
    date: { type: Date, default: Date.now },
});

// Apply the uniqueValidator plugin to enforce unique constraints
saleSchema.plugin(uniqueValidator, { message: 'Error, expected {PATH} to be unique.' });

module.exports = mongoose.model('Sale', saleSchema);
