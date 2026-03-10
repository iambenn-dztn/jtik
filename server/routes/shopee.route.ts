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
    console.log("Cookies written to file successfully");
  } catch (error) {
    console.error("Error writing cookie file:", error);
  }
};

const router = express.Router();

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
  console.log("=".repeat(50));
  console.log("📥 Received transform-link request");

  const { links } = req.body; // Now expecting an array of links

  if (!links || !Array.isArray(links) || links.length === 0) {
    return res.status(400).json({
      error: "Links array is required and must not be empty",
    });
  }

  console.log(`🔗 Processing ${links.length} link(s)`);

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

    console.log(
      `🆔 Using Affiliate ID: ${affiliateId} from account: ${activeAccount.username}`,
    );

    // Transform all links
    const results = links.map((link, index) => {
      if (!link || !link.trim()) {
        console.log(`⚠️ Skipping empty link at index ${index}`);
        return {
          originalLink: link,
          shortLink: null,
          error: "Empty link",
        };
      }

      const trimmedLink = link.trim();
      const encoded = encodeURIComponent(trimmedLink);
      const transformedLink = `https://s.shopee.vn/an_redir?origin_link=${encoded}&affiliate_id=${affiliateId}&sub_id=${subId}`;

      console.log(
        `✅ Transformed link ${index + 1}: ${trimmedLink.substring(0, 50)}...`,
      );

      return {
        originalLink: trimmedLink,
        shortLink: transformedLink,
        error: null,
      };
    });

    const successCount = results.filter((r) => r.shortLink).length;
    console.log(
      `✅ Successfully transformed ${successCount}/${links.length} links`,
    );
    console.log("=".repeat(50));

    res.json({
      success: true,
      data: results,
      total: links.length,
      successCount: successCount,
    });
  } catch (error: any) {
    console.error("❌ Error transforming links:", error);
    console.log("=".repeat(50));

    res.status(500).json({
      success: false,
      error: "Failed to transform links",
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

// Export customers to Excel
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

export default router;
