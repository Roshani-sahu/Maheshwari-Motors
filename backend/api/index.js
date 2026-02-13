import "dotenv/config";
import createApp from "../src/app.js";
import { connectDB } from "../src/config/database.js";

let isConnected = false;

const app = createApp();

export default async function handler(req, res) {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
  return app(req, res);
}
