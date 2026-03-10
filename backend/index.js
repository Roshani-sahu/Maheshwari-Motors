import "dotenv/config";
import initializeApp from "./src/app.js";
import { connectDB } from "./src/config/database.js";

class Index {
  async startServer() {
    try {
      await connectDB();
      initializeApp();
    } catch (error) {
      console.error("Error during startup:", error);
    }
  }
}

new Index().startServer();
