import "dotenv/config";
import createApp from "../src/app.js";
import { connectDB } from "../src/config/database.js";

let app;

export default async function handler(req, res) {
  try {
    if (!app) {
      await connectDB();
      app = createApp();
      console.log("✅ DB connected & app initialized");
    }

    return app(req, res);
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
