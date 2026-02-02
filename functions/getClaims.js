const mongoose = require('mongoose');

const ClaimSchema = new mongoose.Schema({
  invoice: String,
  partNumber: [String],
  product: [String],
  remark: String,
  userId: String,
  timestamp: { type: Date, default: Date.now }
});

let conn = null;

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  
  try {
    if (conn == null) {
      conn = mongoose.createConnection(process.env.MONGODB_URI, { bufferCommands: false });
      await conn.asPromise();
    }
    const Claim = conn.model('Claim', ClaimSchema);

    // รับค่า Query Parameters มาจาก URL
    const { invoice, search, type, page = 1, limit = 25, mode } = event.queryStringParameters;

    // --- โหมด 1: ตรวจสอบ Invoice ซ้ำ หรือ Quick Check ---
    if (mode === 'checkDuplicate' || (invoice && !search)) {
      const claims = await Claim.find({ invoice: invoice }).sort({ timestamp: -1 });
      return { statusCode: 200, body: JSON.stringify(claims) };
    }

    // --- โหมด 2: ดึงข้อมูลลงตาราง (Search & Pagination) ---
    let query = {};
    if (search) {
      const regex = new RegExp(search, 'i'); // ค้นหาแบบไม่สนตัวพิมพ์เล็กใหญ่
      if (type === 'invoice') query.invoice = regex;
      else if (type === 'part') query.partNumber = { $in: [regex] }; // ค้นใน Array
      else query.invoice = regex; // Default
    }

    // คำนวณ Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // ดึงข้อมูล + นับจำนวนทั้งหมด
    const [claims, total] = await Promise.all([
      Claim.find(query).sort({ timestamp: -1 }).skip(skip).limit(limitNum),
      Claim.countDocuments(query)
    ]);

    return {
      statusCode: 200,
      body: JSON.stringify({
        data: claims,
        total: total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum)
      })
    };

  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};