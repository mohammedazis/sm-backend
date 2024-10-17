const express = require('express');
const SaleReturn = require('../models/salereturn.js'); // SaleReturn model
const ProductStock = require('../models/productStock'); // ProductStock model
const authenticateJWT = require('../middleware/authSession.js'); // JWT middleware for authentication

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const saleReturns = await SaleReturn.find();
    res.status(200).json(saleReturns);
  } catch (error) {
    console.error('Error retrieving sale returns:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



// Create a new sale return and update product stock accordingly
router.post('/create', authenticateJWT, async (req, res) => {
  const { name, mobile_no, invoice, products, date } = req.body;

  try {
    const createdBy = req.user.name; // Extract current user from JWT

    // Loop through each returned product and update stock
    for (let i = 0; i < products.length; i++) {
      const { name: productName, quantity } = products[i];

      // Check if the product exists in stock
      let productStock = await ProductStock.findOne({ productname: productName });

      if (!productStock) {
        // If the product doesn't exist in stock, create a new entry
        productStock = new ProductStock({
          productname: productName,
          quantity: 0, // Initialize the quantity
        });
      }

      // Add the returned quantity back to stock
      productStock.quantity += Number(quantity);

      // Save the updated stock information
      await productStock.save();
    }

    // Create a new sale return
    const saleReturn = new SaleReturn({
      name,
      mobile_no,    // Store the mobile number of the customer
      invoice,
      products,
      createdBy,    // Add the logged-in user's name
      date: date || Date.now(), // Store the date, or default to the current date
    });

    // Save the sale return record
    await saleReturn.save();

    res.status(201).json({ message: 'Sale return processed successfully', saleReturn });
  } catch (error) {
    console.error('Error processing sale return:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// Get all sale returns or a specific sale return by id
router.get('/:id?', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  
  try {
    if (id) {
      // Get a specific sale return by id
      const saleReturn = await SaleReturn.findById(id);
      if (!saleReturn) {
        return res.status(404).json({ message: 'Sale return not found' });
      }
      res.json(saleReturn);
    } else {
      // Get all sale returns
      const saleReturns = await SaleReturn.find();
      res.json(saleReturns);
    }
  } catch (error) {
    console.error('Error fetching sale return:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// Delete a sale return by id and update product stock accordingly
router.delete('/:id', authenticateJWT, async (req, res) => {
  const { id } = req.params;

  try {
    // Find the sale return by id
    const saleReturn = await SaleReturn.findById(id);
    if (!saleReturn) {
      return res.status(404).json({ message: 'Sale return not found' });
    }

    // Update stock before deleting the sale return
    for (let i = 0; i < saleReturn.products.length; i++) {
      const { name: productName, quantity } = saleReturn.products[i];

      // Check if the product exists in stock
      let productStock = await ProductStock.findOne({ productname: productName });
      if (productStock) {
        // Subtract the returned quantity from stock
        productStock.quantity -= quantity;

        // Ensure the quantity doesn't fall below zero
        if (productStock.quantity < 0) productStock.quantity = 0;

        await productStock.save();
      }
    }

    // Delete the sale return record
    await SaleReturn.findByIdAndDelete(id);

    res.json({ message: 'Sale return deleted successfully' });
  } catch (error) {
    console.error('Error deleting sale return:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// Update a sale return and adjust stock accordingly
router.patch('/:id', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const { name, mobile_no, invoice, products, date } = req.body;

  try {
    const saleReturn = await SaleReturn.findById(id);
    if (!saleReturn) {
      return res.status(404).json({ message: 'Sale return not found' });
    }

    // Adjust stock for old returned products (reverse the previous stock changes)
    for (let i = 0; i < saleReturn.products.length; i++) {
      const { name: productName, quantity } = saleReturn.products[i];

      let productStock = await ProductStock.findOne({ productname: productName });
      if (productStock) {
        productStock.quantity -= quantity;
        if (productStock.quantity < 0) productStock.quantity = 0;
        await productStock.save();
      }
    }

    // Adjust stock for new products
    for (let i = 0; i < products.length; i++) {
      const { name: productName, quantity } = products[i];

      let productStock = await ProductStock.findOne({ productname: productName });
      if (!productStock) {
        productStock = new ProductStock({ productname: productName, quantity: 0 });
      }

      productStock.quantity += quantity;
      await productStock.save();
    }

    // Update sale return details
    saleReturn.name = name || saleReturn.name;
    saleReturn.mobile_no = mobile_no || saleReturn.mobile_no;
    saleReturn.invoice = invoice || saleReturn.invoice;
    saleReturn.products = products || saleReturn.products;
    saleReturn.date = date || saleReturn.date;

    await saleReturn.save();

    res.json({ message: 'Sale return updated successfully', saleReturn });
  } catch (error) {
    console.error('Error updating sale return:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

module.exports = router;
