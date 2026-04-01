import express from "express";
import { dbService } from "../services/mongodb.service.js";
import { authenticateApiKey } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/data", authenticateApiKey, async (req, res) => {
  try {
    const { name, metadata } = req.body;

    // Validate required fields
    if (!name || !metadata) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        required: ["name", "metadata"],
      });
    }

    // Validate metadata is an object
    if (typeof metadata !== "object" || Array.isArray(metadata)) {
      return res.status(400).json({
        success: false,
        error: "metadata must be a JSON object",
      });
    }

    // Save to database (upsert: update if exists, insert if new)
    const result = await dbService.upsertCrawlData({
      name,
      metadata,
    });

    res.status(result.created ? 201 : 200).json({
      success: true,
      message: result.created
        ? "Crawl data created successfully"
        : "Crawl data updated successfully",
      data: result.data,
      created: result.created,
    });
  } catch (error: any) {
    console.error("Error saving crawl data:", error);
    res.status(500).json({
      success: false,
      error: "Failed to save crawl data",
      details: error.message,
    });
  }
});

export default router;
