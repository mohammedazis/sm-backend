const express = require('express');
const Sale = require('../models/sale'); // Sale model
const ProductStock = require('../models/productStock'); // ProductStock model
const authenticateSession = require('../middleware/authSession'); // Middleware for session authentication

const router = express.Router();

// Create a new sale and update product stock accordingly
router.post('/create', authenticateSession, async (req, res) => {
  const { name, mobile_no, products, invoice, gst, type } = req.body;

  try {
    const createdBy = req.session.user.email; // Extract current user from session

    // Loop through each product in the sale and check stock
    for (let i = 0; i < products.length; i++) {
      const { productname, quantity } = products[i];

      // Check if the product exists in stock
      const productStock = await ProductStock.findOne({ productname });

      if (!productStock) {
        return res.status(404).json({ message: `Product '${productname}' not found in stock` });
      }

      // Check if there's enough stock to fulfill the sale
      if (productStock.quantity < quantity) {
        return res.status(400).json({
          message: `Insufficient stock for product '${productname}'. Available: ${productStock.quantity}, Requested: ${quantity}`
        });
      }

      // Reduce the stock quantity
      productStock.quantity -= quantity;

      // Save the updated stock information
      await productStock.save();
    }

    // Create a new sale after stock validation
    const sale = new Sale({
      name,
      mobile_no,
      products,
      createdBy,
      invoice,
      gst,
      type, // Add type (string input)
    });

    // Save the sale
    await sale.save();

    res.status(201).json({ message: 'Sale created successfully', sale });
  } catch (error) {
    console.error('Error creating sale:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// Get all sales
router.get('/', authenticateSession, async (req, res) => {
  try {
    const sales = await Sale.find();
    res.status(200).json(sales);
  } catch (error) {
    console.error('Error retrieving sales:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// Get a sale by ID
router.get('/:id', authenticateSession, async (req, res) => {
  const { id } = req.params;

  try {
    const sale = await Sale.findById(id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    res.status(200).json(sale);
  } catch (error) {
    console.error('Error retrieving sale:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// Update a sale and adjust product stock
router.put('/update/:id', authenticateSession, async (req, res) => {
  const { id } = req.params;
  const { name, mobile_no, products, invoice, gst, type } = req.body;

  try {
    const sale = await Sale.findById(id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    // Loop through original sale products to restore stock
    for (let i = 0; i < sale.products.length; i++) {
      const { productname, quantity } = sale.products[i];
      const productStock = await ProductStock.findOne({ productname });

      if (productStock) {
        // Restore stock by adding back the old sale quantity
        productStock.quantity += quantity;
        await productStock.save();
      }
    }

    // Loop through the new products and adjust stock
    for (let i = 0; i < products.length; i++) {
      const { productname, quantity } = products[i];
      const productStock = await ProductStock.findOne({ productname });

      if (!productStock) {
        return res.status(404).json({ message: `Product '${productname}' not found in stock` });
      }

      if (productStock.quantity < quantity) {
        return res.status(400).json({
          message: `Insufficient stock for product '${productname}'. Available: ${productStock.quantity}, Requested: ${quantity}`
        });
      }

      // Reduce the stock quantity for the new sale
      productStock.quantity -= quantity;
      await productStock.save();
    }

    // Update the sale with new details
    sale.name = name;
    sale.mobile_no = mobile_no;
    sale.products = products;
    sale.invoice = invoice;
    sale.gst = gst;
    sale.type = type;

    await sale.save();

    res.status(200).json({ message: 'Sale updated successfully', sale });
  } catch (error) {
    console.error('Error updating sale:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// Delete a sale and restore product stock
router.delete('/delete/:id', authenticateSession, async (req, res) => {
  const { id } = req.params;

  try {
    const sale = await Sale.findByIdAndDelete(id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    // Restore stock for all products in the sale
    // for (let i = 0; i < sale.products.length; i++) {
    //   const { productname, quantity } = sale.products[i];
    //   const productStock = await ProductStock.findOne({ productname });

    //   if (productStock) {
    //     // Add the sold quantity back to the stock
    //     productStock.quantity += quantity;
    //     await productStock.save();
    //   }
    // }

    // Delete the sale
    // await sale.remove();

    res.status(200).json({ message: 'Sale deleted and stock restored' });
  } catch (error) {
    console.error('Error deleting sale:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

module.exports = router;
