// routes/purchasereturn.js
const express = require('express');
const PurchaseReturn = require('../models/purchasereturn'); // PurchaseReturn model
const ProductStock = require('../models/productStock'); // ProductStock model
const authenticateJWT = require('../middleware/authSession'); // JWT middleware for authentication

const router = express.Router();

// Create a new purchase return and update product stock accordingly
router.post('/create-purchasereturn', authenticateJWT, async (req, res) => {
  const { name, phone_no, invoice, BuyerGst, products, date } = req.body;

  try {
    const createdBy = req.user.name; // Extract current logged-in user from JWT

    // Loop through each product in the return and update stock
    for (let i = 0; i < products.length; i++) {
      const { name: productName, quantity } = products[i];

      // Check if the product exists in stock
      const productStock = await ProductStock.findOne({ productname: productName });

      if (!productStock) {
        return res.status(404).json({ message: `Product '${productName}' not found in stock` });
      }

      // Add the returned quantity back to stock
      productStock.quantity += quantity;

      // Save the updated stock information
      await productStock.save();
    }

    // Create a new purchase return record
    const purchaseReturn = new PurchaseReturn({
      name,
      phone_no,
      invoice,
      BuyerGst,
      products,
      createdBy,
      date: date || Date.now() // Set the return date, default to current date
    });

    // Save the purchase return
    await purchaseReturn.save();

    res.status(201).json({ message: 'Purchase return processed successfully', purchaseReturn });
  } catch (error) {
    console.error('Error processing purchase return:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// Read all purchase returns
router.get('/all-purchasereturns', authenticateJWT, async (req, res) => {
  try {
    const purchaseReturns = await PurchaseReturn.find();
    res.status(200).json({ message: 'All purchase returns fetched successfully', purchaseReturns });
  } catch (error) {
    console.error('Error fetching purchase returns:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// Read a single purchase return by invoice
router.get('/purchasereturn/:invoice', authenticateJWT, async (req, res) => {
  try {
    const purchaseReturn = await PurchaseReturn.findOne({ invoice: req.params.invoice });
    if (!purchaseReturn) {
      return res.status(404).json({ message: 'Purchase return with this invoice not found' });
    }
    res.status(200).json({ message: 'Purchase return found', purchaseReturn });
  } catch (error) {
    console.error('Error fetching purchase return by invoice:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// Update a purchase return by invoice
router.put('/update-purchasereturn/:invoice', authenticateJWT, async (req, res) => {
  const { name, phone_no, BuyerGst, products, date } = req.body;

  try {
    // Find the purchase return by invoice and update the record
    const purchaseReturn = await PurchaseReturn.findOneAndUpdate(
      { invoice: req.params.invoice },
      { name, phone_no, BuyerGst, products, date: date || Date.now() },
      { new: true }
    );

    if (!purchaseReturn) {
      return res.status(404).json({ message: 'Purchase return with this invoice not found' });
    }

    res.status(200).json({ message: 'Purchase return updated successfully', purchaseReturn });
  } catch (error) {
    console.error('Error updating purchase return:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// Delete a purchase return by invoice
router.delete('/delete-purchasereturn/:invoice', authenticateJWT, async (req, res) => {
  try {
    // Find the purchase return by invoice and delete the record
    const purchaseReturn = await PurchaseReturn.findOneAndDelete({ invoice: req.params.invoice });

    if (!purchaseReturn) {
      return res.status(404).json({ message: 'Purchase return with this invoice not found' });
    }

    res.status(200).json({ message: 'Purchase return deleted successfully' });
  } catch (error) {
    console.error('Error deleting purchase return:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

module.exports = router;
