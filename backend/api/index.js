import "dotenv/config";
import initializeApp from "../src/app.js";
import { connectDB } from "../src/config/database.js";

try {
  await connectDB();
  initializeApp();
} catch (error) {
  console.error("Error during startup:", error);
}
