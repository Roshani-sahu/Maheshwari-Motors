import "dotenv/config";
import createApp from "../src/app.js";
import { connectDB } from "../src/config/database.js";
import env from "../src/config/env.js";

const PORT = env.PORT || 3000;

async function startServer() {
  try {
    await connectDB();
    const app = createApp();
    app.listen(PORT, () => {
      console.log(`✅ Server running on PORT :: ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
