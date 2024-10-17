const express = require('express');
const Product = require('../models/products.db');
const authenticateSession = require('../middleware/authSession'); // Updated session-based authentication middleware
const router = express.Router();

// Create a new product
router.post('/create', authenticateSession, async (req, res) => {
  const { product_Name, product_description, hsn, uniquecode } = req.body;

  try {
    const createdBy = req.session.user.email; // Extracted from session
    console.log('Created By:', createdBy);
    const product = new Product({ product_Name, product_description, createdBy, hsn, uniquecode });
    await product.save();
    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    console.error('Error retrieving products:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// Find a product by name
router.get('/find/:name', async (req, res) => {
  const { name } = req.params;
  try {
    const product = await Product.findOne({ product_Name: name });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (error) {
    console.error('Error finding product:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// Update a product by name
router.patch('/update/:name', authenticateSession, async (req, res) => {
  const { name } = req.params;
  const { product_Name, product_description, hsn, uniquecode } = req.body;

  try {
    const updatedProduct = await Product.findOneAndUpdate(
      { product_Name: name },
      { product_Name, product_description, hsn, uniquecode },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product updated successfully', updatedProduct });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// Delete a product by name
router.delete('/delete/:name', authenticateSession, async (req, res) => {
  const { name } = req.params;

  try {
    const deletedProduct = await Product.findOneAndDelete({ product_Name: name });
    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

module.exports = router;
