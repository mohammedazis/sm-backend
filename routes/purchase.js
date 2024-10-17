const express = require('express');
const Purchase = require('../models/purchase'); // Correct Purchase model import
const ProductStock = require('../models/productStock'); // ProductStock model
const authenticateJWT = require('../middleware/authSession'); // JWT middleware for authentication

const router = express.Router();

// Utility function to calculate subtotal
const calculateSubtotal = (products) => {
  return products.reduce((total, product) => total + product.total_price, 0);
};

// Create a new purchase and update product stock
router.post('/create', authenticateJWT, async (req, res) => {
  const { name, invoice, phone_no, BuyerGst, products } = req.body;

  try {
    const createdBy = req.session.user.email; // Extract current user from JWT

    // Calculate total price for each product and subtotal for the purchase
    const updatedProducts = products.map(product => {
      const totalPrice = product.quantity * product.price; // Calculate total price for the product
      return {
        ...product,
        total_price: totalPrice,
      };
    });

    const subtotal = calculateSubtotal(updatedProducts);

    // Loop through each product in the purchase and update stock
    for (let i = 0; i < updatedProducts.length; i++) {
      const { name: productName, quantity } = updatedProducts[i];

      // Check if the product exists in stock
      let productStock = await ProductStock.findOne({ productname: productName });

      if (!productStock) {
        // If product doesn't exist in stock, create a new stock entry
        productStock = new ProductStock({
          productname: productName,
          quantity: 0, // Initialize quantity to 0 if product doesn't exist
        });
      }

      // Add the purchased quantity to stock
      productStock.quantity += quantity;

      // Save the updated stock information
      await productStock.save();
    }

    // Create a new purchase after stock updates
    const purchase = new Purchase({
      name,
      invoice,
      phone_no,
      BuyerGst,
      products: updatedProducts,
      subtotal,
      createdBy, // Add the logged-in user's name
    });

    // Save the purchase
    await purchase.save();

    res.status(201).json({ message: 'Purchase created successfully', purchase });
  } catch (error) {
    console.error('Error creating purchase:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// Get all purchases
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const purchases = await Purchase.find();
    res.status(200).json(purchases);
  } catch (error) {
    console.error('Error retrieving purchases:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// Get a purchase by ID
router.get('/:id', authenticateJWT, async (req, res) => {
  const { id } = req.params;

  try {
    const purchase = await Purchase.findById(id);
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }
    res.status(200).json(purchase);
  } catch (error) {
    console.error('Error retrieving purchase:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// Update a purchase and adjust product stock
router.patch('/update/:id', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const { name, invoice, phone_no, BuyerGst, products } = req.body;

  try {
    const purchase = await Purchase.findById(id);
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }

    // Loop through original purchase products to adjust stock
    for (let i = 0; i < purchase.products.length; i++) {
      const { name: productName, quantity } = purchase.products[i];
      const productStock = await ProductStock.findOne({ productname: productName });

      if (productStock) {
        // Subtract the old purchase quantity from stock
        productStock.quantity -= quantity;
        await productStock.save();
      }
    }

    // Loop through the new products and adjust stock
    const updatedProducts = products.map(product => {
      const totalPrice = product.quantity * product.price; // Calculate total price for the product
      return {
        ...product,
        total_price: totalPrice,
      };
    });

    for (let i = 0; i < updatedProducts.length; i++) {
      const { name: productName, quantity } = updatedProducts[i];
      let productStock = await ProductStock.findOne({ productname: productName });

      if (!productStock) {
        productStock = new ProductStock({ productname: productName, quantity: 0 });
      }

      // Add the new purchase quantity to stock
      productStock.quantity += quantity;
      await productStock.save();
    }

    // Update the purchase with new details
    purchase.name = name;
    purchase.invoice = invoice;
    purchase.phone_no = phone_no;
    purchase.BuyerGst = BuyerGst;
    purchase.products = updatedProducts;
    purchase.subtotal = calculateSubtotal(updatedProducts); // Update subtotal

    await purchase.save();

    res.status(200).json({ message: 'Purchase updated successfully', purchase });
  } catch (error) {
    console.error('Error updating purchase:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// Delete a purchase and adjust product stock
router.delete('/delete/:id', authenticateJWT, async (req, res) => {
  const { id } = req.params;

  try {
    const purchase = await Purchase.findByIdAndDelete(id);
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }

    // Loop through all products in the purchase and adjust stock
    for (let i = 0; i < purchase.products.length; i++) {
      const { name: productName, quantity } = purchase.products[i];
      const productStock = await ProductStock.findOne({ productname: productName });

      if (productStock) {
        // Subtract the purchase quantity from stock
        productStock.quantity -= quantity;
        await productStock.save();
      }
    }

    res.status(200).json({ message: 'Purchase deleted and stock adjusted' });
  } catch (error) {
    console.error('Error deleting purchase:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

module.exports = router;
