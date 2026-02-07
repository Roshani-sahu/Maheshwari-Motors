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

      console.log(`MongoDB connected: ${this.connection.connection.host}`);

      mongoose.connection.on("error", (err) => {
        console.error("MongoDB connection error:", err);
      });

      mongoose.connection.on("disconnected", () => {
        console.warn("MongoDB disconnected. Attempting to reconnect...");
      });

      return this.connection;
    } catch (error) {
      console.error("MongoDB connection failed:", error.message);
      process.exit(1);
    }
  }

  async disconnect() {
    if (this.connection) {
      await mongoose.disconnect();
      this.connection = null;
      console.log("MongoDB disconnected");
    }
  }
}

const database = new Database();

export const connectDB = () => database.connect();

export const disconnectDB = () => database.disconnect();

export default database;
