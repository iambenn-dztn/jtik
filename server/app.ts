import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { dbService } from "./services/mongodb.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to MongoDB
await dbService.connect();

// Add error handling for imports
let shopeeRouter;
try {
  const module = await import("./routes/shopee.route.js");
  shopeeRouter = module.default;
} catch (error) {
  console.error("Error importing shopee router:", error);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

// Health check endpoint (for Render)
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
  });
});

app.use("/api/shopee", shopeeRouter);

app.use("/files", express.static(path.join(__dirname)));

// Add global error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Global error handler:", err);
    res.status(500).json({ error: "Internal server error" });
  }
);

// Add unhandled rejection handlers
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  await dbService.disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Shutting down gracefully...");
  await dbService.disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `🔗 CORS Origin: ${process.env.CLIENT_URL || "http://localhost:5173"}`
  );
});
