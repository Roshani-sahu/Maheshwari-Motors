import express from "express";
import cors from "cors";
import routes from "./routers/index.js";
import { errorHandler, notFoundHandler } from "./middlewares/index.js";
import env from "./config/env.js";
import asyncHandler from "./utils/asyncHandler.js";

const health = (res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    Engineers: {
      Backend: "[Tushar Gour](https://www.linkedin.com/in/tushar-gour/)",
    },
  });
};

const initializeApp = asyncHandler(() => {
  const app = express();
  app.set("trust proxy", 1);

  console.log("[CORS] CORS_ORIGIN =", env.CORS_ORIGIN);

  const corsOrigin =
    env.CORS_ORIGIN === "*" ?
      (origin, cb) => {
        console.log("[CORS] Incoming origin:", origin);
        cb(null, origin || "*");
      }
    : env.CORS_ORIGIN;

  app.use(
    cors({
      origin: corsOrigin,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.get("/", (_, res) => health(res));
  app.use("/api/v1", routes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  app.listen(env.PORT, () => {
    console.log(`🚀 Server running on port ${env.PORT}`);
  });
});

export default initializeApp;
