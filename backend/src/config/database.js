import mongoose from "mongoose";
import env from "./env.js";

class Database {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      if (this.connection) {
        return this.connection;
      }

      const options = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      };

      this.connection = await mongoose.connect(env.MONGODB_URI, options);

      mongoose.connection.on("error", (err) => {
        console.error("Database connection error:", err);
      });

      mongoose.connection.on("disconnected", () => {
        console.warn("Database disconnected. Attempting to reconnect...");
      });

      return this.connection;
    } catch (error) {
      console.error("Database connection failed:", error.message);
      process.exit(1);
    }
  }

  async disconnect() {
    if (this.connection) {
      await mongoose.disconnect();
      this.connection = null;
    }
  }
}

const database = new Database();
export const connectDB = () => database.connect();
export const disconnectDB = () => database.disconnect();
export default database;
