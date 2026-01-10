import axios from "axios";
import express from "express";
import * as fs from "fs";
import * as path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";
import { Customer, dbService } from "../services/mongodb.service.js";
import { refreshCookie } from "../services/shoppee-services.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Function to read cookies from file
const getCookiesFromFile = () => {
  try {
    const cookiePath = path.join(__dirname, "../cookie.txt");
    if (fs.existsSync(cookiePath)) {
      return fs.readFileSync(cookiePath, "utf8").trim();
    }
    return "";
  } catch (error) {
    console.error("Error reading cookie file:", error);
    return "";
  }
};

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

// Admin authentication endpoint
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
  const { link } = req.body;

  let data = `{"operationName":"batchGetCustomLink","query":"\\n    query batchGetCustomLink($linkParams: [CustomLinkParam!], $sourceCaller: SourceCaller){\\n      batchCustomLink(linkParams: $linkParams, sourceCaller: $sourceCaller){\\n        shortLink\\n        longLink\\n        failCode\\n      }\\n    }\\n    ","variables":{"linkParams":[{"originalLink":"${link}","advancedLinkParams":{"subId1":"j99"}}],"sourceCaller":"CUSTOM_LINK_CALLER"}}`;

  const makeRequest = async (cookieValue: string) => {
    const config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://affiliate.shopee.vn/api/v3/gql?q=batchCustomLink",
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9",
        "af-ac-enc-dat": "70d1b1fcf1abbeb6",
        "af-ac-enc-sz-token":
          "9rsD0YiBuBShnVw0xLDBWA==|WzZWuGXyCumpIkv9q/S9uqE3P9arVcgB/wQ+rnHQ9das4axOQWjJ3lyRjrOxxIP3x/5Pz6+aDYo1AA==|Msg7T/CPlPe6+h6v|08|3",
        "affiliate-program-type": "1",
        "content-type": "application/json; charset=UTF-8",
        "csrf-token": "cJJuDdPv-Bbq9P9cp9LUbOWcW18n7oJtMiSg",
        origin: "https://affiliate.shopee.vn",
        priority: "u=1, i",
        referer: "https://affiliate.shopee.vn/offer/custom_link",
        "sec-ch-ua":
          '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
        "x-sap-ri": "9e5756693f02ea40b2ae43310501c220169acec1a1b5bf439023",
        "x-sap-sec":
          "LJL/msfDowfN4xIz5wlz5xvzuwmr5ilz7wyd5jBzOplV5ZlzFwmx5jIzUwlR5aszK2mZ5xvzMwlJ5bxz+wmO5C/zJplw5bIzcuyW5YDzWwl25CKz/wlr5xWzF2l65jnz92yz5GDzNwmI5gEz4wmj5Z/zDpms5gxzrplp5jDz8wyN5GxzLwmP5wlzjwxz5wlz5wjTUona5wlz0XwhUDRX52lz5wlzVI7n+EUz52lzpwCz5xRqfjWz5YEsdwxz5wlzWmKz5jls5wmhjnIm5wlzf0HD7wlz5zQm5wlA5plz3J4Go2lz5ygw5ulzewCz5wlzK8e0XFqd5wlzQAZFiev65ulz5wmWVsDy5wl1Xpynw5r9zzNc5bVu52lz5wml+ull5wzz5ulz5CpGwZQq75uRacjq5wltjmKz5wyjr1K36RuB8qm+1SgaWXWO46IvXTgAtCqPlaDsjEikDir7ZTVVM2Svg6OOkuc9uB8bZwIPy6YSy/jvwo9cs/DJYw7Nohmm7CagTdFK1fIA+6hONU4JaCE4ZoGJhlXtkL/JdtR/b48e8GyfEDnikkP26tgTIfNLt6IBMdP7yWb8lcC1STrZaWsYB4rMb7C+/5b2jrlQtBavMoa/loTiVBIpigi8JkMZH+ab+8RDG2WA7lhU03BBm1PwAWlksreVDr6+JG8R/2hVeEsV9hZI2l8XT4EwKW6p5iH8jCHL+JwPizOgf4+IPcbcPdd85wQz5wzRxAhiCupZT2Dz5wyDIh78Vulz5wmWjQj2obJuGvq14Gr64ffebbnYEhk0pejt2bDJnN4ICmlXvMU2nZme7aPWo0zd/09uZSov7sW6Xbrriqw7qzbHqTd1MCZMfgkVIWiDB8O3jYJZY5y8BN0kypLHvppqxWuBq8vQXK+oZ6fGnFu40foBm/uxOR18tuNqWaQLsb/QX5d2eSLqumRTJvt/OqQcrRMwGeMGe6so96aQMOb46XZR5wlz4wlz5fmzVbBY5wlz7l5sq44Yh6JMClosgplz5wlz5wlz5wlzd2lz5Yiz9R768sIpHfSob5iv+nCWA+TMVyeROC5LAJYlfEfCoW5/1M5x7Yfkx+4OlFLMr/5LTmdtmEfth8dHbr+vR0QcnWR7Akxz5wlz5wlz5wlzrplz5Ci6qJoyj/WaoFycxNbx2qchtfszSwlz5ZApqOj9FtPiKD2cuj+8HYJcGI5BFrI+NCjHbOobgLZaol0Jbplz5wlH5wlz3DR6ar0CHVM6CJNcDjBBPUNouBjtAhgxol6Bbd7Y0oEIGOq4D4EQQZwOqmAVFtC17PkOb4oZEqIz5wlzJwlz5jYw9IhPt0Fo5wlz5wlz5wlu5wlzrb134n7TWPmk6j3ZzjnBm6qbgf8YUmLYK+zubpQz5wmAldigxWKXKuQz5wlkoegd6UFN62lz5wl=",
        "x-sz-sdk-version": "1.12.21",
        Cookie: cookieValue,
      },
      data: data,
    };
    return axios.request(config);
  };

  try {
    // First attempt with existing cookies
    const cookie = getCookiesFromFile();

    if (!cookie) {
      throw new Error("No cookies found in file");
    }
    console.log("Using cookies from file:", cookie);
    const response = await makeRequest(cookie);
    console.log("response", JSON.stringify(response.data));
    if (response.data.errors) {
      throw new Error("Shopee API returned errors");
    }
    res.json({ data: response.data.data });
  } catch (error) {
    console.error("Shopee API error, attempting to refresh cookies:", error);

    try {
      // Refresh cookies and retry (temporarily disabled due to Playwright dependency)
      const newCookies = await refreshCookie();
      console.log("Refreshed cookies:", newCookies);

      // Write new cookies to file
      writeCookiesToFile(newCookies as unknown as string);

      // Retry with new cookies
      const retryResponse = await makeRequest(newCookies as unknown as string);
      console.log("retryResponse", retryResponse.data.data);

      res.json({ data: retryResponse.data.data });
      // res.status(500).json({ error: "Cookie refresh temporarily disabled" });
    } catch (refreshError) {
      console.error(
        "Failed to refresh cookies or retry request:",
        refreshError
      );
      res
        .status(500)
        .json({ error: "Failed to transform link after refreshing cookies" });
    }
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

// Get customers with filters
router.get("/customers", async (req, res) => {
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
router.delete("/customers/:id", async (req, res) => {
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
});

// Export customers to Excel
router.get("/customers/export", async (req, res) => {
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

    const fileName = `customers_${new Date().toISOString().split("T")[0]}.xlsx`;

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.send(buffer);
  } catch (error) {
    console.error("Error exporting customers:", error);
    res.status(500).json({ error: "Failed to export customers" });
  }
});

// ==================== ACCOUNT MANAGEMENT ROUTES ====================

// Get accounts with filters
router.get("/accounts", async (req, res) => {
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
router.post("/accounts", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: "Username and password are required",
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
      password, // In production, hash this password
    });

    // Don't return password in response
    const { password: _, ...accountResponse } = newAccount;

    res.json({
      success: true,
      message: "Account created successfully",
      data: accountResponse,
    });
  } catch (error) {
    console.error("Error creating account:", error);
    res.status(500).json({ error: "Failed to create account" });
  }
});

// Update account
router.put("/accounts/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { username, password, status } = req.body;

    const updates: any = {};
    if (username) updates.username = username;
    if (password) updates.password = password; // In production, hash this
    if (status && ["active", "inactive", "deleted"].includes(status)) {
      updates.status = status;
    }

    const updatedAccount = await dbService.updateAccount(id, updates);

    if (!updatedAccount) {
      return res.status(404).json({ error: "Account not found" });
    }

    // Don't return password in response
    const { password: _, ...accountResponse } = updatedAccount;

    res.json({
      success: true,
      message: "Account updated successfully",
      data: accountResponse,
    });
  } catch (error) {
    console.error("Error updating account:", error);
    res.status(500).json({ error: "Failed to update account" });
  }
});

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

    // Don't return password in response
    const { password: _, ...accountResponse } = updatedAccount;

    res.json({
      success: true,
      message: `Account status updated to ${status}`,
      data: accountResponse,
    });
  } catch (error) {
    console.error("Error updating account status:", error);
    res.status(500).json({ error: "Failed to update account status" });
  }
});

// Soft delete account
router.delete("/accounts/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const deleted = await dbService.deleteAccount(id);

    if (!deleted) {
      return res.status(404).json({ error: "Account not found" });
    }

    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ error: "Failed to delete account" });
  }
});

export default router;
