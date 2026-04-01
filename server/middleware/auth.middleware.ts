import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key";
const API_KEY = process.env.API_KEY || "default-api-key-change-in-production";

export interface AuthRequest extends Request {
  user?: {
    username: string;
    role: string;
  };
}

/**
 * Middleware để verify JWT token
 */
export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: "Access token required" });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          return res.status(401).json({ error: "Token expired" });
        }
        return res.status(403).json({ error: "Invalid token" });
      }

      req.user = decoded as { username: string; role: string };
      next();
    });
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
};

/**
 * Middleware để verify admin role
 */
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
};

/**
 * Generate access token (short-lived)
 */
export const generateAccessToken = (username: string, role: string): string => {
  return jwt.sign({ username, role }, JWT_SECRET, {
    expiresIn: "1m", // 1 minute
  });
};

/**
 * Generate refresh token (long-lived)
 */
export const generateRefreshToken = (
  username: string,
  role: string,
): string => {
  return jwt.sign({ username, role }, JWT_REFRESH_SECRET, {
    expiresIn: "7d", // 7 days
  });
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (
  token: string,
): { username: string; role: string } | null => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as {
      username: string;
      role: string;
    };
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Middleware to verify API key
 */
export const authenticateApiKey = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const apiKey = req.headers["x-api-key"] || req.query.apiKey;

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error:
          "API key required. Provide via 'x-api-key' header or 'apiKey' query parameter",
      });
    }

    if (apiKey !== API_KEY) {
      return res.status(403).json({
        success: false,
        error: "Invalid API key",
      });
    }

    next();
  } catch (error) {
    console.error("API key authentication error:", error);
    res.status(500).json({
      success: false,
      error: "Authentication failed",
    });
  }
};
