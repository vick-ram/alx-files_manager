import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'file_manager';
    const url = `mongodb://${host}:${port}`;
    this.isConnected = false;

    this.client = new MongoClient(url, { useUnifiedTopology: true });
    this.db = null;
    this.database = database;
    this.connect();
  }

  async connect() {
    try {
      await this.client.connect();
      this.db = this.client.db(this.database);
      this.isConnected = true;
    } catch (err) {
      console.error('MongoDB connection error:', err);
      this.isConnected = false;
    }
  }

  isAlive() {
    return this.client && this.isConnected;
  }

  async nbUsers() {
    try {
      return await this.db.collection('users').countDocuments();
    } catch (error) {
      return 0;
    }
  }

  async nbFiles() {
    try {
      return await this.db.collection('files').countDocuments();
    } catch (error) {
      console.error('Error counting files:', error);
      return 0;
    }
  }

  getObjectID(id) {
    return new this.client.s.options.bson.ObjectId(id);
  }
}

const dbClient = new DBClient();
export default dbClient;
