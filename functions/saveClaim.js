const mongoose = require('mongoose');

const ClaimSchema = new mongoose.Schema({
  invoice: String,
  partNumber: [String], // เป็น Array ตามโค้ดเดิม
  product: [String],    // เป็น Array
  remark: String,
  userId: String,
  timestamp: { type: Date, default: Date.now }
});

let conn = null;

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    if (conn == null) {
      conn = mongoose.createConnection(process.env.MONGODB_URI, { bufferCommands: false });
      await conn.asPromise();
    }
    const Claim = conn.model('Claim', ClaimSchema);
    
    const data = JSON.parse(event.body);
    const newClaim = new Claim(data);
    await newClaim.save();

    return { statusCode: 200, body: JSON.stringify({ message: "Saved" }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};