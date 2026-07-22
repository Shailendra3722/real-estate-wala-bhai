const { MongoClient } = require('mongodb');

const uri = "mongodb://shailendra8052:Sonu3722@ac-e0nmwcf-shard-00-00.kqjxhuj.mongodb.net:27017,ac-e0nmwcf-shard-00-01.kqjxhuj.mongodb.net:27017,ac-e0nmwcf-shard-00-02.kqjxhuj.mongodb.net:27017/real_estate_wala_bhai?ssl=true&replicaSet=atlas-y44gx4-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";

async function run() {
  try {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    console.log("Connected successfully to MongoDB server");
    await client.close();
  } catch (err) {
    console.error("Connection failed:", err.message);
  }
}
run();
