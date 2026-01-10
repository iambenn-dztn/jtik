import { Router, Request, Response } from "express";
import {
  getAdminByUsername,
  comparePassword,
  addRefreshToken,
  removeRefreshToken,
  verifyRefreshTokenExists,
  createAdmin,
} from "../services/auth.service.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  authenticateToken,
  AuthRequest,
} from "../middleware/auth.middleware.js";

const router = Router();

/**
 * POST /api/auth/login
 * Login admin
 */
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    // Get admin from database
    const admin = await getAdminByUsername(username);
    if (!admin) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, admin.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate tokens
    const accessToken = generateAccessToken(admin.username, admin.role);
    const refreshToken = generateRefreshToken(admin.username, admin.role);

    // Store refresh token
    await addRefreshToken(admin.username, refreshToken);

    res.json({
      accessToken,
      refreshToken,
      user: {
        username: admin.username,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

/**
 * POST /api/auth/logout
 * Logout admin (invalidate refresh token)
 */
router.post("/logout", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token required" });
    }

    // Verify and decode token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(400).json({ error: "Invalid refresh token" });
    }

    // Remove refresh token from database
    await removeRefreshToken(decoded.username, refreshToken);

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token required" });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    // Check if refresh token exists in database
    const tokenExists = await verifyRefreshTokenExists(
      decoded.username,
      refreshToken
    );
    if (!tokenExists) {
      return res.status(401).json({ error: "Refresh token not found" });
    }

    // Generate new access token
    const accessToken = generateAccessToken(decoded.username, decoded.role);

    res.json({ accessToken });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({ error: "Token refresh failed" });
  }
});

/**
 * GET /api/auth/me
 * Get current admin info (protected route)
 */
router.get(
  "/me",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Get full admin info
      const admin = await getAdminByUsername(req.user.username);
      if (!admin) {
        return res.status(404).json({ error: "Admin not found" });
      }

      res.json({
        username: admin.username,
        role: admin.role,
        createdAt: admin.createdAt,
      });
    } catch (error) {
      console.error("Get current admin error:", error);
      res.status(500).json({ error: "Failed to get admin info" });
    }
  }
);

/**
 * POST /api/auth/setup
 * Create initial admin account (should be disabled in production)
 */
router.post("/setup", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    // Create admin
    const admin = await createAdmin(username, password, "admin");
    if (!admin) {
      return res.status(400).json({ error: "Admin already exists" });
    }

    res.json({
      message: "Admin created successfully",
      username: admin.username,
    });
  } catch (error) {
    console.error("Setup error:", error);
    res.status(500).json({ error: "Setup failed" });
  }
});

export default router;
