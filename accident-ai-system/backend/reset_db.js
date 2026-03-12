require('dotenv').config();
const mongoose = require('mongoose');

async function resetDb() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ai_accident_system');
  await mongoose.connection.db.collection('users').drop().catch(() => console.log('users: already empty'));
  await mongoose.connection.db.collection('accidents').drop().catch(() => console.log('accidents: already empty'));
  console.log('Old records cleared. Please re-register on the website.');
  process.exit(0);
}

resetDb().catch(e => { console.error(e); process.exit(1); });
