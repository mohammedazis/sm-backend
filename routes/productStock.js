const express = require('express');
const ProductStock = require('../models/productStock'); // Import the ProductStock model
const authenticateSession = require('../middleware/authSession'); // Session middleware for authentication

const router = express.Router();

// Create a new product stock entry
router.post('/create', authenticateSession, async (req, res) => {
  const { productname, quantity } = req.body;
const createdBy = req.session.user.email; // Extracted from session
  try {
    // Create and save the new product stock entry
    const productStock = new ProductStock({
      productname,
      quantity,
      createdBy,
    });

    await productStock.save();
    res.status(201).json({ message: 'Product stock created successfully', productStock });
    console.log(productStock,req.sessionID)
  } catch (error) {
    console.error('Error creating product stock:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all product stocks
router.get('/', async (req, res) => {
  try {
    const stocks = await ProductStock.find();
    res.status(200).json(stocks);
  } catch (error) {
    console.error('Error retrieving product stocks:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Find product stock by product name
router.get('/find/:productname', async (req, res) => {
  const { productname } = req.params;

  try {
    const stock = await ProductStock.findOne({ productname });
    if (!stock) {
      return res.status(404).json({ message: 'Product not found in stock' });
    }
    res.status(200).json(stock);
  } catch (error) {
    console.error('Error finding product stock:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update product stock by product name
router.patch('/update/:productname', authenticateSession, async (req, res) => {
  const { productname } = req.params;
  const { quantity } = req.body;

  try {
    const updatedStock = await ProductStock.findOneAndUpdate(
      { productname },
      { quantity },
      { new: true } // Return the updated document
    );

    if (!updatedStock) {
      return res.status(404).json({ message: 'Product not found in stock' });
    }
    res.status(200).json({ message: 'Product stock updated successfully', updatedStock });
  } catch (error) {
    console.error('Error updating product stock:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete product stock by product name
router.delete('/delete/:productname', authenticateSession, async (req, res) => {
  const { productname } = req.params;

  try {
    const deletedStock = await ProductStock.findOneAndDelete({ productname });

    if (!deletedStock) {
      return res.status(404).json({ message: 'Product not found in stock' });
    }
    res.status(200).json({ message: 'Product stock deleted successfully' });
  } catch (error) {
    console.error('Error deleting product stock:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
