const express = require('express');
const router = express.Router();
const Supply = require('../models/Supply');
const Transaction = require('../models/Transaction');

// GET all supplies
router.get('/', async (req, res) => {
  try {
    const supplies = await Supply.find();
    res.json(supplies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new supply item
router.post('/', async (req, res) => {
  const supply = new Supply({
    sku: req.body.sku,
    name: req.body.name,
    category: req.body.category,
    unit: req.body.unit,
    currentStock: req.body.currentStock,
    minimumStockLevel: req.body.minimumStockLevel
  });

  try {
    const newSupply = await supply.save();
    res.status(201).json(newSupply);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST a transaction (e.g., receive or issue stock)
router.post('/:sku/transaction', async (req, res) => {
  const session = await Supply.startSession();
  session.startTransaction();
  try {
    const supply = await Supply.findOne({ sku: req.params.sku }).session(session);
    if (!supply) {
      throw new Error('Supply item not found');
    }

    const { transactionType, quantity } = req.body;
    let newQuantity = quantity;

    if (transactionType === 'ISSUE') {
        if (supply.currentStock < quantity) {
            throw new Error('Insufficient stock');
        }
        supply.currentStock -= quantity;
    } else if (transactionType === 'RECEIVE') {
        supply.currentStock += quantity;
    } else if (transactionType === 'ADJUST') {
        // Here quantity is the absolute new stock value
         supply.currentStock = quantity;
         // Adjust quantity for transaction log to show the diff.  This is a simplified approach.
         newQuantity = quantity - supply.currentStock;
    } else {
        throw new Error('Invalid transaction type');
    }

    supply.lastUpdated = Date.now();
    await supply.save({ session });

    const transaction = new Transaction({
      supplyId: supply._id,
      transactionType: transactionType,
      quantity: quantity // Note: depending on your logic you might log the diff instead for adjust
    });

    await transaction.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ message: 'Transaction successful', newStock: supply.currentStock });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;