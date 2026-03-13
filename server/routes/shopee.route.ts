import axios from "axios";
import express from "express";
import * as fs from "fs";
import * as path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";
import { Customer, dbService } from "../services/mongodb.service.js";
import {
  authenticateToken,
  requireAdmin,
} from "../middleware/auth.middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Function to write cookies to file
const writeCookiesToFile = (cookies: string) => {
  try {
    const cookiePath = path.join(__dirname, "../cookie.txt");
    fs.writeFileSync(cookiePath, cookies, "utf8");
  } catch (error) {
    console.error("Error writing cookie file:", error);
  }
};

const router = express.Router();

// Helper function to expand shortened Shopee URLs
const expandShopeeUrl = async (url: string): Promise<string> => {
  try {
    // Follow redirects to get the final URL
    const response = await axios.get(url, {
      maxRedirects: 10,
      validateStatus: (status) => status < 400,
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    // Get the final URL after all redirects
    const finalUrl = response.request.res.responseUrl || url;
    return finalUrl;
  } catch (error: any) {
    console.error(`❌ Error expanding URL ${url}:`, error.message);
    // If expansion fails, return original URL
    return url;
  }
};

// Helper function to extract and normalize Shopee URL
const normalizeShopeeUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Extract shop_id and item_id from various formats
    // Format 1: /product/{shop_id}/{item_id}
    // Format 2: /{shop_name}/{shop_id}/{item_id}
    // Format 3: /universal-link/...
    // Format 4: Campaign/Voucher pages like /m/*, /deals/*, etc.

    const pathParts = pathname.split("/").filter((part) => part);

    // Check if this is a campaign/voucher/special page (e.g., /m/VoucherXtra, /deals/*, etc.)
    // These pages don't have shop_id/item_id, so return the clean URL as-is
    if (pathParts.length > 0) {
      const firstPart = pathParts[0];
      const campaignPaths = [
        "m",
        "deals",
        "flash_deal",
        "brands",
        "mall",
        "events",
        "shop",
        "seller",
      ];

      if (campaignPaths.includes(firstPart)) {
        // This is a campaign/special page, return as-is
        const cleanUrl = `https://shopee.vn${pathname}`;
        return cleanUrl;
      }
    }

    // Try to extract product URLs with shop_id and item_id
    if (pathParts.length >= 2) {
      // Get the last two numeric parts (shop_id and item_id)
      const shopId = pathParts[pathParts.length - 2];
      const itemId = pathParts[pathParts.length - 1];

      // Check if they are numeric
      if (/^\d+$/.test(shopId) && /^\d+$/.test(itemId)) {
        // Check if there's a shop name (3 parts minimum, first is not 'product')
        if (pathParts.length >= 3 && pathParts[0] !== "product") {
          const shopName = pathParts[0];
          return `https://shopee.vn/${shopName}/${shopId}/${itemId}`;
        } else {
          return `https://shopee.vn/product/${shopId}/${itemId}`;
        }
      }
    }

    // If no specific format matched, return the clean shopee.vn URL
    return `https://shopee.vn${pathname}`;
  } catch (error) {
    console.error(`❌ Error parsing URL ${url}:`, error);
    return null;
  }
};

// Old admin auth endpoint - DEPRECATED
// Use /api/auth/login instead
router.post("/admin/auth", (req, res) => {
  try {
    const { password } = req.body;

    // Simple password check - in production, use proper hashing
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

    if (password === ADMIN_PASSWORD) {
      res.json({
        success: true,
        message: "Authentication successful",
      });
    } else {
      res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }
  } catch (error) {
    console.error("Error in admin auth:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
});

router.post("/transform-link", async (req, res) => {
  const { links } = req.body; // Now expecting an array of links

  if (!links || !Array.isArray(links) || links.length === 0) {
    return res.status(400).json({
      error: "Links array is required and must not be empty",
    });
  }

  try {
    // Get active account to retrieve affiliateId
    const activeAccount = await dbService.getFirstActiveAccount();

    if (!activeAccount) {
      return res.status(500).json({
        error: "No active account found. Please configure an account first.",
      });
    }

    const affiliateId = activeAccount.affiliateId;
    const subId = "justj";

    // Helper function to validate Shopee links
    const isShopeeLink = (url: string): boolean => {
      const shopeePatterns = [
        /shopee\.vn/i,
        /shp\.ee/i,
        /s\.shopee\.vn/i,
        /vn\.shp\.ee/i,
      ];
      return shopeePatterns.some((pattern) => pattern.test(url));
    };

    // Transform all links (async processing)
    const results = await Promise.all(
      links.map(async (link, index) => {
        if (!link || !link.trim()) {
          return {
            originalLink: link,
            shortLink: null,
            error: "Empty link",
          };
        }

        const trimmedLink = link.trim();

        // Validate if it's a Shopee link
        if (!isShopeeLink(trimmedLink)) {
          return {
            originalLink: trimmedLink,
            shortLink: null,
            error:
              "Not a valid Shopee link. Supported formats: shopee.vn, vn.shp.ee, s.shopee.vn",
          };
        }

        try {
          // Always expand URL to get the final redirect destination
          const expandedUrl = await expandShopeeUrl(trimmedLink);

          // Normalize the URL to extract shop_id and item_id
          const normalizedUrl = normalizeShopeeUrl(expandedUrl);

          if (!normalizedUrl) {
            return {
              originalLink: trimmedLink,
              shortLink: null,
              error: "Could not extract product information from URL",
            };
          }

          // Encode the normalized URL
          const encoded = encodeURIComponent(normalizedUrl);
          const transformedLink = `https://s.shopee.vn/an_redir?origin_link=${encoded}&affiliate_id=${affiliateId}&sub_id=${subId}`;

          return {
            originalLink: trimmedLink,
            shortLink: transformedLink,
            error: null,
          };
        } catch (error: any) {
          console.error(
            `❌ Error processing link at index ${index}:`,
            error.message,
          );
          return {
            originalLink: trimmedLink,
            shortLink: null,
            error: error.message || "Failed to process link",
          };
        }
      }),
    );

    const successCount = results.filter((r) => r.shortLink).length;

    res.json({
      success: true,
      data: results,
      total: links.length,
      successCount: successCount,
    });
  } catch (error: any) {
    console.error("❌ Error transforming links:", error);

    res.status(500).json({
      success: false,
      error: "Failed to transform links",
      details: error.message,
    });
  }
});

router.post("/transform-text", async (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return res.status(400).json({
      error: "Text is required and must not be empty",
    });
  }

  try {
    // Get active account to retrieve affiliateId
    const activeAccount = await dbService.getFirstActiveAccount();

    if (!activeAccount) {
      return res.status(500).json({
        error: "No active account found. Please configure an account first.",
      });
    }

    const affiliateId = activeAccount.affiliateId;
    const subId = "justj";

    // Helper function to validate Shopee links
    const isShopeeLink = (url: string): boolean => {
      const shopeePatterns = [
        /shopee\.vn/i,
        /shp\.ee/i,
        /s\.shopee\.vn/i,
        /vn\.shp\.ee/i,
      ];
      return shopeePatterns.some((pattern) => pattern.test(url));
    };

    // Extract all URLs from text
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const foundUrls = text.match(urlRegex) || [];

    if (foundUrls.length === 0) {
      return res.json({
        success: true,
        data: {
          transformedText: text,
          links: [],
        },
        message: "No URLs found in text",
      });
    }

    // Transform URLs and build results using parallel processing
    const linkResults = await Promise.all(
      foundUrls.map(async (url, index) => {
        const trimmedUrl = url.trim();

        // Check if it's a Shopee link
        if (!isShopeeLink(trimmedUrl)) {
          // Keep original URL in text if it's not a Shopee link
          return {
            originalLink: trimmedUrl,
            shortLink: trimmedUrl,
            error: "Not a Shopee link",
          };
        }

        try {
          // Always expand URL to get the final redirect destination
          const expandedUrl = await expandShopeeUrl(trimmedUrl);

          // Normalize the URL to extract shop_id and item_id
          const normalizedUrl = normalizeShopeeUrl(expandedUrl);

          if (!normalizedUrl) {
            return {
              originalLink: trimmedUrl,
              shortLink: trimmedUrl,
              error: "Could not extract product information",
            };
          }

          // Encode the normalized URL
          const encoded = encodeURIComponent(normalizedUrl);
          const transformedLink = `https://s.shopee.vn/an_redir?origin_link=${encoded}&affiliate_id=${affiliateId}&sub_id=${subId}`;

          return {
            originalLink: trimmedUrl,
            shortLink: transformedLink,
            error: null,
          };
        } catch (error: any) {
          console.error(
            `❌ Error processing link ${index + 1}:`,
            error.message,
          );
          return {
            originalLink: trimmedUrl,
            shortLink: trimmedUrl,
            error: error.message || "Failed to process link",
          };
        }
      }),
    );

    // Replace URLs in text with transformed links
    let transformedText = text;
    linkResults.forEach((result) => {
      if (result.shortLink && result.originalLink !== result.shortLink) {
        transformedText = transformedText.replace(
          result.originalLink,
          result.shortLink,
        );
      }
    });

    const successCount = linkResults.filter(
      (r) => r.shortLink && !r.error,
    ).length;

    res.json({
      success: true,
      data: {
        transformedText,
        links: linkResults,
      },
      total: linkResults.length,
      successCount: successCount,
    });
  } catch (error: any) {
    console.error("❌ Error transforming text:", error);

    res.status(500).json({
      success: false,
      error: "Failed to transform text",
      details: error.message,
    });
  }
});

router.post("/save-info", async (req, res) => {
  try {
    const {
      info: {
        orderId,
        phone,
        bankName,
        accountNumber,
        accountName,
        affiliateLink,
      },
    } = req.body;

    // Validate required fields
    if (!orderId || !phone || !bankName || !accountNumber || !accountName) {
      return res.status(400).json({
        error: "Missing required fields",
        required: [
          "orderId",
          "phone",
          "bankName",
          "accountNumber",
          "accountName",
        ],
      });
    }

    // Check if order already exists
    const existingCustomer = await dbService.getCustomerByOrderId(orderId);
    if (existingCustomer) {
      return res.status(409).json({
        error:
          "Thông tin đơn hàng đã ghi nhận trước đó. Hãy liên hệ tới admin để được hỗ trợ: SĐT / Zalo: 0967034098",
      });
    }

    let customer: Customer;

    // Create new customer
    customer = await dbService.insertCustomer({
      phone,
      bankName,
      accountNumber,
      accountName,
      orderId,
    });

    res.json({
      message: "Info saved successfully",
      data: customer,
    });
  } catch (error) {
    console.error("Error saving info:", error);
    res.status(500).json({ error: "Failed to save info" });
  }
});

// Get customers with filters (PROTECTED - requires admin auth)
router.get("/customers", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, search } = req.query;

    const filters: {
      status?: "active" | "paid" | "deleted";
      search?: string;
    } = {};

    if (status && ["active", "paid", "deleted"].includes(status as string)) {
      filters.status = status as "active" | "paid" | "deleted";
    }

    if (search && typeof search === "string") {
      filters.search = search;
    }

    const customers =
      Object.keys(filters).length > 0
        ? await dbService.getFilteredCustomers(filters)
        : await dbService.getCustomers();

    const stats = await dbService.getStatistics();

    res.json({
      success: true,
      data: customers,
      statistics: stats,
      total: customers.length,
      filters: filters,
    });
  } catch (error) {
    console.error("Error getting customers:", error);
    res.status(500).json({ error: "Failed to get customers" });
  }
});

// Export customers to Excel (must be before parameterized routes)
router.get(
  "/customers/export",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const customers = await dbService.getAllCustomers();

      // Create Excel workbook
      const workbook = XLSX.utils.book_new();

      // Prepare data for Excel
      const excelData = [
        [
          "ID",
          "Mã Đơn Hàng",
          "Số Điện Thoại",
          "Tên Ngân Hàng",
          "Số Tài Khoản",
          "Tên Chủ Tài Khoản",
          "Ngày Tạo",
          "Cập Nhật Lần Cuối",
        ],
        ...customers.map((customer) => [
          customer.id,
          customer.orderId,
          customer.phone,
          customer.bankName,
          customer.accountNumber,
          customer.accountName,
          customer.createdAt,
          customer.updatedAt,
        ]),
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(excelData);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");

      // Generate buffer
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      const fileName = `customers_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`,
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );

      res.send(buffer);
    } catch (error) {
      console.error("Error exporting customers:", error);
      res.status(500).json({ error: "Failed to export customers" });
    }
  },
);

// Update customer status
router.patch("/customers/:id/status", async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;

    if (!["active", "paid", "deleted"].includes(status)) {
      return res.status(400).json({
        error: "Invalid status. Must be 'active', 'paid', or 'deleted'",
      });
    }

    const updatedCustomer = await dbService.updateCustomerStatus(id, status);

    if (!updatedCustomer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json({
      success: true,
      message: `Customer status updated to ${status}`,
      data: updatedCustomer,
    });
  } catch (error) {
    console.error("Error updating customer status:", error);
    res.status(500).json({ error: "Failed to update customer status" });
  }
});

// Soft delete customer
router.delete(
  "/customers/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const id = req.params.id;

      const deleted = await dbService.deleteCustomer(id);

      if (!deleted) {
        return res.status(404).json({ error: "Customer not found" });
      }

      res.json({
        success: true,
        message: "Customer deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ error: "Failed to delete customer" });
    }
  },
);

// ==================== ACCOUNT MANAGEMENT ROUTES ====================

// Get accounts with filters
router.get("/accounts", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, search } = req.query;

    const filters: {
      status?: "active" | "inactive" | "deleted";
      search?: string;
    } = {};

    if (
      status &&
      ["active", "inactive", "deleted"].includes(status as string)
    ) {
      filters.status = status as "active" | "inactive" | "deleted";
    }

    if (search && typeof search === "string") {
      filters.search = search;
    }

    const accounts =
      Object.keys(filters).length > 0
        ? await dbService.getFilteredAccounts(filters)
        : await dbService.getAccounts();

    res.json({
      success: true,
      data: accounts,
      total: accounts.length,
      filters: filters,
    });
  } catch (error) {
    console.error("Error getting accounts:", error);
    res.status(500).json({ error: "Failed to get accounts" });
  }
});

// Create new account
router.post("/accounts", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { username, affiliateId } = req.body;

    if (!username || !affiliateId) {
      return res.status(400).json({
        error: "Username and affiliateId are required",
      });
    }

    // Check if username already exists
    const existingAccount = await dbService.getAccountByUsername(username);
    if (existingAccount) {
      return res.status(409).json({
        error: "Username already exists",
      });
    }

    const newAccount = await dbService.insertAccount({
      username,
      affiliateId,
    });

    res.json({
      success: true,
      message: "Account created successfully",
      data: newAccount,
    });
  } catch (error) {
    console.error("Error creating account:", error);
    res.status(500).json({ error: "Failed to create account" });
  }
});

// Update account
router.put(
  "/accounts/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const id = req.params.id;
      const { username, affiliateId, status } = req.body;

      const updates: any = {};
      if (username) updates.username = username;
      if (affiliateId) updates.affiliateId = affiliateId;
      if (status && ["active", "inactive", "deleted"].includes(status)) {
        updates.status = status;
      }

      const updatedAccount = await dbService.updateAccount(id, updates);

      if (!updatedAccount) {
        return res.status(404).json({ error: "Account not found" });
      }

      res.json({
        success: true,
        message: "Account updated successfully",
        data: updatedAccount,
      });
    } catch (error) {
      console.error("Error updating account:", error);
      res.status(500).json({ error: "Failed to update account" });
    }
  },
);

// Update account status
router.patch("/accounts/:id/status", async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;

    if (!["active", "inactive", "deleted"].includes(status)) {
      return res.status(400).json({
        error: "Invalid status. Must be 'active', 'inactive', or 'deleted'",
      });
    }

    const updatedAccount = await dbService.updateAccountStatus(id, status);

    if (!updatedAccount) {
      return res.status(404).json({ error: "Account not found" });
    }

    res.json({
      success: true,
      message: `Account status updated to ${status}`,
      data: updatedAccount,
    });
  } catch (error) {
    console.error("Error updating account status:", error);
    res.status(500).json({ error: "Failed to update account status" });
  }
});

// Delete account (soft delete by setting status to 'deleted')
router.delete(
  "/accounts/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const id = req.params.id;

      // Soft delete by updating status to 'deleted'
      const updatedAccount = await dbService.updateAccountStatus(id, "deleted");

      if (!updatedAccount) {
        return res.status(404).json({ error: "Account not found" });
      }

      res.json({
        success: true,
        message: "Account deleted successfully",
        data: updatedAccount,
      });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ error: "Failed to delete account" });
    }
  },
);

export default router;
