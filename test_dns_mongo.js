const dns = require('dns');
// Force Google DNS for SRV lookups
dns.setServers(['8.8.8.8', '8.8.4.4']);

const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://shailendra8052:Sonu3722@cluster0.kqjxhuj.mongodb.net/?appName=Cluster0";

async function run() {
  try {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    console.log("Connected successfully to MongoDB server via SRV with Google DNS!");
    await client.close();
  } catch (err) {
    console.error("Connection failed:", err.message);
  }
}
run();
