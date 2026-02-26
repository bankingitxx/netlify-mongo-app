const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - Allow all origins for development
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// MongoDB Connection
const ClaimSchema = new mongoose.Schema({
  invoice: String,
  partNumber: [String],
  product: [String],
  remark: String,
  userId: String,
  timestamp: { type: Date, default: Date.now }
});

const Claim = mongoose.model('Claim', ClaimSchema);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/claims_app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Routes
app.get('/api/claims', async (req, res) => {
  try {
    const { invoice, search, type, page = 1, limit = 25, mode } = req.query;

    // Mode 1: Check duplicate invoice
    if (mode === 'checkDuplicate' || (invoice && !search)) {
      const claims = await Claim.find({ invoice: invoice }).sort({ timestamp: -1 });
      return res.json(claims);
    }

    // Mode 2: Search with pagination
    let query = {};
    if (search) {
      const regex = new RegExp(search, 'i');
      if (type === 'invoice') query.invoice = regex;
      else if (type === 'part') query.partNumber = { $in: [regex] };
      else query.invoice = regex;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [claims, total] = await Promise.all([
      Claim.find(query).sort({ timestamp: -1 }).skip(skip).limit(limitNum),
      Claim.countDocuments(query)
    ]);

    res.json({
      data: claims,
      total: total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/claims', async (req, res) => {
  try {
    const newClaim = new Claim(req.body);
    await newClaim.save();
    res.json({ message: "Saved" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/claims/:id', async (req, res) => {
  try {
    await Claim.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Listen on localhost only for Caddy reverse proxy
app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});
