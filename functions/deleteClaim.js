const mongoose = require('mongoose');
const ClaimSchema = new mongoose.Schema({ /* ...Fields... */ }, { strict: false }); // strict false เพื่อให้ลบได้โดยไม่ต้องระบุ schema เป๊ะๆ

let conn = null;

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'DELETE') return { statusCode: 405, body: 'Method Not Allowed' };
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    if (conn == null) {
      conn = mongoose.createConnection(process.env.MONGODB_URI, { bufferCommands: false });
      await conn.asPromise();
    }
    const Claim = conn.model('Claim', ClaimSchema);
    
    const { id } = event.queryStringParameters;
    await Claim.findByIdAndDelete(id);

    return { statusCode: 200, body: JSON.stringify({ message: "Deleted" }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};