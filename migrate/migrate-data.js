const mongoose = require('mongoose');

// Source: MongoDB Atlas
const sourceUri = 'mongodb+srv://bankingit:Bankingit2..@clusteristudio.enku8xr.mongodb.net/';

// Target: VPS MongoDB (no auth for now)
const targetUri = 'mongodb://45.136.254.203:27017/claims_app';

const ClaimSchema = new mongoose.Schema({
  invoice: String,
  partNumber: [String],
  product: [String],
  remark: String,
  userId: String,
  timestamp: { type: Date, default: Date.now }
});

async function migrateData() {
  try {
    console.log('Connecting to source database...');
    const sourceConn = mongoose.createConnection(sourceUri);
    await sourceConn.asPromise();
    
    console.log('Connecting to target database...');
    const targetConn = mongoose.createConnection(targetUri);
    await targetConn.asPromise();
    
    const SourceClaim = sourceConn.model('Claim', ClaimSchema);
    const TargetClaim = targetConn.model('Claim', ClaimSchema);
    
    console.log('Fetching data from source...');
    const claims = await SourceClaim.find({});
    console.log(`Found ${claims.length} documents to migrate`);
    
    if (claims.length === 0) {
      console.log('No data found in source database');
      return;
    }
    
    console.log('Clearing target collection...');
    await TargetClaim.deleteMany({});
    
    console.log('Migrating data...');
    await TargetClaim.insertMany(claims);
    
    console.log('Migration completed successfully!');
    
    await sourceConn.close();
    await targetConn.close();
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateData();
