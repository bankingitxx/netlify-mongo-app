// functions/saveData.js
const mongoose = require('mongoose');

// กำหนดหน้าตาข้อมูล (Schema)
const DataSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
  createdAt: { type: Date, default: Date.now }
});

const Entry = mongoose.model('Entry', DataSchema);

exports.handler = async (event, context) => {
  // รับเฉพาะ Method POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // เชื่อมต่อ MongoDB (ถ้ายังไม่เชื่อม)
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
    }

    // รับข้อมูลที่ส่งมาจากหน้าเว็บ
    const data = JSON.parse(event.body);

    // บันทึกลงฐานข้อมูล
    const newEntry = new Entry(data);
    await newEntry.save();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "บันทึกสำเร็จ!" })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};