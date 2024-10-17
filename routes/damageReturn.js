const express = require('express');
const SaleReturnDamage = require('../models/salereturndamage'); // SaleReturnDamage model
const authenticateSession = require('../middleware/authSession'); // Session middleware for authentication
const router = express.Router();

// Create a new sale return for damaged products (does not update product stock)
router.post('/create-damage', authenticateSession, async (req, res) => {
  const { name, mobile_no, invoice, products, date } = req.body;

  try {
    const createdBy = req.user.name; // Extract current user from session

    // Create a new sale return for damaged products
    const saleReturnDamage = new SaleReturnDamage({
      name,
      mobile_no,    // Store the mobile number of the customer
      invoice,
      products,     // List of damaged products
      createdBy,    // Add the logged-in user's name
      date: date || Date.now(), // Store the date, or default to the current date
    });

    // Save the sale return record for damaged products
    await saleReturnDamage.save();

    res.status(201).json({ message: 'Sale return for damaged products processed successfully', saleReturnDamage });
  } catch (error) {
    console.error('Error processing sale return for damaged products:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// Read all sale returns for damaged products
router.get('/all-damages', authenticateSession, async (req, res) => {
  try {
    const damagedReturns = await SaleReturnDamage.find();
    res.status(200).json({ message: 'All sale returns for damaged products fetched successfully', damagedReturns });
  } catch (error) {
    console.error('Error fetching sale returns for damaged products:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// Read a single sale return by invoice
router.get('/damage/:invoice', authenticateSession, async (req, res) => {
  try {
    const saleReturnDamage = await SaleReturnDamage.findOne({ invoice: req.params.invoice });
    if (!saleReturnDamage) {
      return res.status(404).json({ message: 'Sale return with this invoice not found' });
    }
    res.status(200).json({ message: 'Sale return found', saleReturnDamage });
  } catch (error) {
    console.error('Error fetching sale return by invoice:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// Update a sale return for damaged products
router.patch('/update-damage/:invoice', authenticateSession, async (req, res) => {
  const { name, mobile_no, products, date } = req.body;

  try {
    // Find the sale return by invoice and update
    const saleReturnDamage = await SaleReturnDamage.findOneAndUpdate(
      { invoice: req.params.invoice },
      { name, mobile_no, products, date: date || Date.now() },
      { new: true }
    );

    if (!saleReturnDamage) {
      return res.status(404).json({ message: 'Sale return with this invoice not found' });
    }

    res.status(200).json({ message: 'Sale return updated successfully', saleReturnDamage });
  } catch (error) {
    console.error('Error updating sale return:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// Delete a sale return for damaged products
router.delete('/delete-damage/:invoice', authenticateSession, async (req, res) => {
  try {
    // Find the sale return by invoice and delete
    const saleReturnDamage = await SaleReturnDamage.findOneAndDelete({ invoice: req.params.invoice });

    if (!saleReturnDamage) {
      return res.status(404).json({ message: 'Sale return with this invoice not found' });
    }

    res.status(200).json({ message: 'Sale return deleted successfully' });
  } catch (error) {
    console.error('Error deleting sale return:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

module.exports = router;