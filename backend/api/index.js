import "dotenv/config";
import createApp from "../src/app.js";
import { connectDB } from "../src/config/database.js";
import env from "../src/config/env.js";

let app;

async function getApp() {
  if (!app) {
    await connectDB();
    app = createApp();
    console.log("✅ DB connected & app initialized");
  }
  return app;
}

// ── Vercel serverless handler ──
export default async function handler(req, res) {
  try {
    const expressApp = await getApp();
    return expressApp(req, res);
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// ── Local development server (skipped on Vercel) ──
if (!process.env.VERCEL) {
  const PORT = env.PORT || 3000;
  getApp()
    .then((localApp) => {
      localApp.listen(PORT, () => {
        console.log(`✅ Server running on PORT :: ${PORT}`);
      });
    })
    .catch((error) => {
      console.error("❌ Failed to start server:", error);
      process.exit(1);
    });
}
