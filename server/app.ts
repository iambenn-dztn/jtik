import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { rateLimit } from "express-rate-limit";
import { dbService } from "./services/mongodb.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🔄 Server starting with auto-reload enabled...");

// Connect to MongoDB
await dbService.connect();

// Add error handling for imports
let shopeeRouter;
let authRouter;
try {
  const shopeeModule = await import("./routes/shopee.route.js");
  shopeeRouter = shopeeModule.default;

  const authModule = await import("./routes/auth.route.js");
  authRouter = authModule.default;
} catch (error) {
  console.error("Error importing routers:", error);
  process.exit(1);
}

const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);

// Rate limiting configurations
// General API rate limiter - 100 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Auth rate limiter - 5 login attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error:
      "Too many authentication attempts from this IP, please try again later.",
  },
  skipSuccessfulRequests: true, // Don't count successful requests
  standardHeaders: true,
  legacyHeaders: false,
});

// Transform link rate limiter - 20 requests per minute
const transformLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 requests per minute
  message: {
    error: "Too many link transformation requests, please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
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

// Apply general rate limiter to all API routes
app.use("/api", apiLimiter);

// Apply stricter rate limiting to auth endpoints (before router)
// app.use("/api/auth/login", authLimiter);
// app.use("/api/auth/change-password", authLimiter);

// Apply transform link rate limiter (before router)
app.use("/api/shopee/transform-link", transformLimiter);

// Mount routers
app.use("/api/shopee", shopeeRouter);
app.use("/api/auth", authRouter);

app.use("/files", express.static(path.join(__dirname)));

// Add global error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error("Global error handler:", err);
    res.status(500).json({ error: "Internal server error" });
  },
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

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `🔗 CORS Origin: ${process.env.CLIENT_URL || "http://localhost:5173"}`,
  );
});
