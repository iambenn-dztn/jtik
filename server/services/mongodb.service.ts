import { MongoClient, Db, Collection, ObjectId } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/jtik";
const DB_NAME = "jtik";

console.log(
  "🔗 MongoDB URI:",
  MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@"),
); // Log URI (hidden password)

export interface Customer {
  _id?: ObjectId;
  id: string;
  phone: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  orderId: string;
  status: "active" | "paid" | "deleted";
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  _id?: ObjectId;
  id: string;
  username: string;
  affiliateId: string;
  status: "active" | "inactive" | "deleted";
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  _id?: ObjectId;
  id: string;
  username: string;
  password: string; // hashed password
  email?: string;
  role: "admin" | "superadmin";
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export interface ShortenedUrl {
  _id?: ObjectId;
  id: string;
  shortCode: string; // e.g., "A0du"
  longUrl: string; // The full affiliate link
  originalUrl: string; // The original Shopee link before transformation
  clicks: number;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string; // Optional expiration date
}

export interface LinkConversionStats {
  _id?: ObjectId;
  date: string; // Format: YYYY-MM-DD
  totalLinks: number; // Total links processed
  successfulLinks: number; // Successfully transformed links
  failedLinks: number; // Failed transformations
  createdAt: string;
  updatedAt: string;
}

export interface CrawlData {
  _id?: ObjectId;
  id: string;
  name: string;
  metadata: Record<string, any>; // JSON object
  createdAt: string;
  updatedAt: string;
}

class MongoDBService {
  private static readonly MONGO_OPTIONS = {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 30000,
    retryWrites: true,
    retryReads: true,
    maxPoolSize: 5,
    minPoolSize: 1,
    tls: true,
    tlsAllowInvalidCertificates: false,
  };

  private client: MongoClient;
  private db: Db | null = null;
  private customers: Collection<Customer> | null = null;
  private accounts: Collection<Account> | null = null;
  private admins: Collection<AdminUser> | null = null;
  private shortenedUrls: Collection<ShortenedUrl> | null = null;
  private conversionStats: Collection<LinkConversionStats> | null = null;
  private crawlData: Collection<CrawlData> | null = null;
  private connected: boolean = false;
  private reconnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  constructor() {
    console.log("MongoDB URI:", MONGODB_URI);
    this.client = this.createClient();
    this.setupEventListeners();
  }

  private createClient(): MongoClient {
    return new MongoClient(MONGODB_URI, MongoDBService.MONGO_OPTIONS);
  }

  private setupEventListeners(): void {
    // Setup event listeners for connection issues
    this.client.on("close", () => {
      console.warn("⚠️ MongoDB connection closed");
      this.connected = false;
    });

    this.client.on("error", (error) => {
      console.error("❌ MongoDB connection error:", error);
      this.connected = false;
    });

    this.client.on("timeout", () => {
      console.warn("⏱️ MongoDB connection timeout");
      this.connected = false;
    });
  }

  async connect(): Promise<void> {
    if (this.connected) return;

    try {
      await this.client.connect();
      this.db = this.client.db(DB_NAME);
      this.customers = this.db.collection<Customer>("customers");
      this.accounts = this.db.collection<Account>("accounts");
      this.admins = this.db.collection<AdminUser>("admins");
      this.shortenedUrls = this.db.collection<ShortenedUrl>("shortenedUrls");
      this.conversionStats =
        this.db.collection<LinkConversionStats>("conversionStats");
      this.crawlData = this.db.collection<CrawlData>("crawlData");
      this.connected = true;

      console.log("✅ Connected to MongoDB Atlas");
      console.log("📁 Database:", this.db.databaseName);

      // List collections
      const collections = await this.db.listCollections().toArray();
      console.log(
        "📦 Collections:",
        collections.map((c) => c.name),
      );

      // Create indexes on shortenedUrls collection for fast lookups and uniqueness
      await this.shortenedUrls!.createIndex({ shortCode: 1 }, { unique: true });
      await this.shortenedUrls!.createIndex({ longUrl: 1 }, { unique: true });

      // Create index on conversionStats for date (unique per day)
      await this.conversionStats!.createIndex({ date: 1 }, { unique: true });

      // Create index on crawlData for name (unique)
      await this.crawlData!.createIndex({ name: 1 }, { unique: true });

      // Count documents
      if (collections.find((c) => c.name === "customers")) {
        const count = await this.db.collection("customers").countDocuments();
        console.log(`👥 Customers: ${count} documents`);
      }
    } catch (error) {
      console.error("❌ MongoDB connection error:", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.close();
        this.connected = false;
        this.db = null;
        this.customers = null;
        this.accounts = null;
        this.admins = null;
        this.shortenedUrls = null;
        this.conversionStats = null;
        this.crawlData = null;
        console.log("MongoDB connection closed gracefully");
      }
    } catch (error) {
      console.error("Error closing MongoDB connection:", error);
    }
  }

  private async isHealthy(): Promise<boolean> {
    try {
      if (!this.db) return false;
      await this.db.admin().ping();
      return true;
    } catch (error) {
      return false;
    }
  }

  private async reconnect(): Promise<void> {
    if (this.reconnecting) {
      // Already reconnecting, wait
      let attempts = 0;
      while (this.reconnecting && attempts < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }
      return;
    }

    this.reconnecting = true;

    try {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        throw new Error(
          `Failed to reconnect after ${this.maxReconnectAttempts} attempts`,
        );
      }

      this.reconnectAttempts++;
      console.log(
        `🔄 Reconnecting to MongoDB (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`,
      );

      // Close existing connection
      try {
        await this.client.close();
      } catch (e) {
        console.log("Error closing existing connection:", e);
      }

      // Reuse singleton client - just recreate and setup listeners
      this.client = this.createClient();
      this.setupEventListeners();

      this.connected = false;
      await this.connect();
      this.reconnectAttempts = 0; // Reset on success
      console.log("✅ Reconnection successful");
    } catch (error) {
      console.error(
        `❌ Reconnection attempt ${this.reconnectAttempts} failed:`,
        error,
      );
      throw error;
    } finally {
      this.reconnecting = false;
    }
  }

  private async ensureConnected(): Promise<void> {
    // If reconnecting, wait
    if (this.reconnecting) {
      let attempts = 0;
      while (this.reconnecting && attempts < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }
      return;
    }

    if (
      !this.connected ||
      !this.customers ||
      !this.accounts ||
      !this.admins ||
      !this.shortenedUrls ||
      !this.conversionStats ||
      !this.crawlData
    ) {
      console.warn("⚠️ Database not connected, attempting reconnection...");
      await this.reconnect();
      return;
    }

    // Health check
    const healthy = await this.isHealthy();
    if (!healthy) {
      console.warn("⚠️ Health check failed, reconnecting...");
      await this.reconnect();
    }
  }

  private async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string = "operation",
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await this.ensureConnected();
        return await operation();
      } catch (error: any) {
        lastError = error;
        console.error(
          `${operationName} failed (attempt ${attempt}/3):`,
          error.message,
        );

        // Check if it's a connection error
        if (
          error.name === "MongoTopologyClosedError" ||
          error.name === "MongoNetworkError" ||
          error.message?.includes("Topology is closed")
        ) {
          this.connected = false;
          if (attempt < 3) {
            await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
            continue;
          }
        }
        throw error;
      }
    }

    throw lastError;
  }

  // ==================== CUSTOMER METHODS ====================

  async getCustomers(): Promise<Customer[]> {
    return this.withRetry(
      () => this.customers!.find({ status: { $ne: "deleted" } }).toArray(),
      "getCustomers",
    );
  }

  async getAllCustomers(): Promise<Customer[]> {
    return this.withRetry(
      () => this.customers!.find({}).toArray(),
      "getAllCustomers",
    );
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    return this.withRetry(
      () => this.customers!.findOne({ id, status: { $ne: "deleted" } }),
      "getCustomerById",
    );
  }

  async getCustomerByOrderId(orderId: string): Promise<Customer | null> {
    return this.withRetry(
      () =>
        this.customers!.findOne({
          orderId,
          status: { $ne: "deleted" },
        }),
      "getCustomerByOrderId",
    );
  }

  async getFilteredCustomers(filters: {
    status?: "active" | "paid" | "deleted";
    search?: string;
  }): Promise<Customer[]> {
    return this.withRetry(async () => {
      const query: any = {};

      if (filters.status) {
        query.status = filters.status;
      } else {
        query.status = { $ne: "deleted" };
      }

      if (filters.search) {
        const searchRegex = { $regex: filters.search, $options: "i" };
        query.$or = [
          { phone: searchRegex },
          { orderId: searchRegex },
          { accountName: searchRegex },
          { bankName: searchRegex },
        ];
      }

      return await this.customers!.find(query)
        .sort({ createdAt: -1 })
        .toArray();
    }, "getFilteredCustomers");
  }

  async insertCustomer(
    customer: Omit<Customer, "id" | "status" | "createdAt" | "updatedAt">,
  ): Promise<Customer> {
    return this.withRetry(async () => {
      const now = new Date().toISOString();
      const newCustomer: Customer = {
        id: this.generateId(),
        ...customer,
        status: "active",
        createdAt: now,
        updatedAt: now,
      };

      await this.customers!.insertOne(newCustomer);
      return newCustomer;
    }, "insertCustomer");
  }

  async updateCustomerStatus(
    id: string,
    status: "active" | "paid" | "deleted",
  ): Promise<Customer | null> {
    return this.withRetry(async () => {
      const result = await this.customers!.findOneAndUpdate(
        { id },
        {
          $set: {
            status,
            updatedAt: new Date().toISOString(),
          },
        },
        { returnDocument: "after" },
      );

      return result || null;
    }, "updateCustomerStatus");
  }

  async deleteCustomer(id: string): Promise<boolean> {
    return this.withRetry(async () => {
      const result = await this.customers!.updateOne(
        { id },
        {
          $set: {
            status: "deleted",
            updatedAt: new Date().toISOString(),
          },
        },
      );

      return result.modifiedCount > 0;
    }, "deleteCustomer");
  }

  async getStatistics(): Promise<{
    total: number;
    active: number;
    paid: number;
    deleted: number;
  }> {
    return this.withRetry(async () => {
      const [total, active, paid, deleted] = await Promise.all([
        this.customers!.countDocuments({}),
        this.customers!.countDocuments({ status: "active" }),
        this.customers!.countDocuments({ status: "paid" }),
        this.customers!.countDocuments({ status: "deleted" }),
      ]);

      return { total, active, paid, deleted };
    }, "getStatistics");
  }

  // ==================== ACCOUNT METHODS ====================

  async getAccounts(): Promise<Account[]> {
    return this.withRetry(
      () => this.accounts!.find({ status: { $ne: "deleted" } }).toArray(),
      "getAccounts",
    );
  }

  async getAllAccounts(): Promise<Account[]> {
    return this.withRetry(
      () => this.accounts!.find({}).toArray(),
      "getAllAccounts",
    );
  }

  async getAccountById(id: string): Promise<Account | null> {
    return this.withRetry(
      () => this.accounts!.findOne({ id, status: { $ne: "deleted" } }),
      "getAccountById",
    );
  }

  async getAccountByUsername(username: string): Promise<Account | null> {
    return this.withRetry(
      () =>
        this.accounts!.findOne({
          username,
          status: { $ne: "deleted" },
        }),
      "getAccountByUsername",
    );
  }

  async getFirstActiveAccount(): Promise<Account | null> {
    return this.withRetry(
      () =>
        this.accounts!.findOne({
          status: "active",
        }),
      "getFirstActiveAccount",
    );
  }

  async getFilteredAccounts(filters: {
    status?: "active" | "inactive" | "deleted";
    search?: string;
  }): Promise<Account[]> {
    return this.withRetry(async () => {
      const query: any = {};

      if (filters.status) {
        query.status = filters.status;
      } else {
        query.status = { $ne: "deleted" };
      }

      if (filters.search) {
        query.username = { $regex: filters.search, $options: "i" };
      }

      return await this.accounts!.find(query).sort({ createdAt: -1 }).toArray();
    }, "getFilteredAccounts");
  }

  async insertAccount(
    account: Omit<Account, "id" | "status" | "createdAt" | "updatedAt">,
  ): Promise<Account> {
    return this.withRetry(async () => {
      const now = new Date().toISOString();
      const newAccount: Account = {
        id: this.generateId(),
        ...account,
        status: "active",
        createdAt: now,
        updatedAt: now,
      };

      await this.accounts!.insertOne(newAccount);
      return newAccount;
    }, "insertAccount");
  }

  async updateAccount(
    id: string,
    updates: Partial<Omit<Account, "id" | "createdAt">>,
  ): Promise<Account | null> {
    return this.withRetry(async () => {
      const result = await this.accounts!.findOneAndUpdate(
        { id },
        {
          $set: {
            ...updates,
            updatedAt: new Date().toISOString(),
          },
        },
        { returnDocument: "after" },
      );

      return result || null;
    }, "updateAccount");
  }

  async updateAccountStatus(
    id: string,
    status: "active" | "inactive" | "deleted",
  ): Promise<Account | null> {
    return this.withRetry(async () => {
      const result = await this.accounts!.findOneAndUpdate(
        { id },
        {
          $set: {
            status,
            updatedAt: new Date().toISOString(),
          },
        },
        { returnDocument: "after" },
      );

      return result || null;
    }, "updateAccountStatus");
  }

  async deleteAccount(id: string): Promise<boolean> {
    return this.withRetry(async () => {
      const result = await this.accounts!.updateOne(
        { id },
        {
          $set: {
            status: "deleted",
            updatedAt: new Date().toISOString(),
          },
        },
      );

      return result.modifiedCount > 0;
    }, "deleteAccount");
  }

  // ==================== UTILITY METHODS ====================

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // ==================== ADMIN METHODS ====================

  async getAdminByUsername(username: string): Promise<AdminUser | null> {
    return this.withRetry(
      () =>
        this.admins!.findOne({
          username,
          status: "active",
        }),
      "getAdminByUsername",
    );
  }

  async getAdminById(id: string): Promise<AdminUser | null> {
    return this.withRetry(
      () =>
        this.admins!.findOne({
          id,
          status: "active",
        }),
      "getAdminById",
    );
  }

  async getAllAdmins(): Promise<AdminUser[]> {
    return this.withRetry(
      () => this.admins!.find({ status: "active" }).toArray(),
      "getAllAdmins",
    );
  }

  async insertAdmin(
    admin: Omit<AdminUser, "id" | "createdAt" | "updatedAt">,
  ): Promise<AdminUser> {
    return this.withRetry(async () => {
      const now = new Date().toISOString();
      const newAdmin: AdminUser = {
        id: this.generateId(),
        ...admin,
        createdAt: now,
        updatedAt: now,
      };

      await this.admins!.insertOne(newAdmin);
      return newAdmin;
    }, "insertAdmin");
  }

  async updateAdminLastLogin(id: string): Promise<AdminUser | null> {
    return this.withRetry(async () => {
      const result = await this.admins!.findOneAndUpdate(
        { id },
        {
          $set: {
            lastLogin: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
        { returnDocument: "after" },
      );

      return result || null;
    }, "updateAdminLastLogin");
  }

  async updateAdminPassword(
    id: string,
    hashedPassword: string,
  ): Promise<AdminUser | null> {
    return this.withRetry(async () => {
      const result = await this.admins!.findOneAndUpdate(
        { id },
        {
          $set: {
            password: hashedPassword,
            updatedAt: new Date().toISOString(),
          },
        },
        { returnDocument: "after" },
      );

      return result || null;
    }, "updateAdminPassword");
  }

  async getShortenedUrlByCode(shortCode: string): Promise<ShortenedUrl | null> {
    return this.withRetry(
      () => this.shortenedUrls!.findOne({ shortCode }),
      "getShortenedUrlByCode",
    );
  }

  async getShortenedUrlByLongUrl(
    longUrl: string,
  ): Promise<ShortenedUrl | null> {
    return this.withRetry(
      () => this.shortenedUrls!.findOne({ longUrl }),
      "getShortenedUrlByLongUrl",
    );
  }

  async createShortenedUrl(
    data: Omit<ShortenedUrl, "id" | "clicks" | "createdAt" | "updatedAt">,
  ): Promise<ShortenedUrl> {
    return this.withRetry(async () => {
      const now = new Date().toISOString();
      const newUrl: ShortenedUrl = {
        id: this.generateId(),
        ...data,
        clicks: 0,
        createdAt: now,
        updatedAt: now,
      };

      try {
        await this.shortenedUrls!.insertOne(newUrl);
        return newUrl;
      } catch (error: any) {
        if (error.code === 11000) {
          throw new Error(
            `Duplicate short code: ${data.shortCode}. Please retry with a different code.`,
          );
        }
        throw error;
      }
    }, "createShortenedUrl");
  }

  async incrementUrlClicks(shortCode: string): Promise<ShortenedUrl | null> {
    return this.withRetry(async () => {
      const result = await this.shortenedUrls!.findOneAndUpdate(
        { shortCode },
        {
          $inc: { clicks: 1 },
          $set: { updatedAt: new Date().toISOString() },
        },
        { returnDocument: "after" },
      );

      return result || null;
    }, "incrementUrlClicks");
  }

  async getAllShortenedUrls(): Promise<ShortenedUrl[]> {
    return this.withRetry(
      () => this.shortenedUrls!.find({}).sort({ createdAt: -1 }).toArray(),
      "getAllShortenedUrls",
    );
  }

  async deleteShortenedUrl(shortCode: string): Promise<boolean> {
    return this.withRetry(async () => {
      const result = await this.shortenedUrls!.deleteOne({ shortCode });
      return result.deletedCount > 0;
    }, "deleteShortenedUrl");
  }

  // ==================== CONVERSION STATS METHODS ====================

  async trackLinkConversion(
    totalLinks: number,
    successfulLinks: number,
    failedLinks: number,
  ): Promise<void> {
    return this.withRetry(async () => {
      const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
      const now = new Date().toISOString();

      // Use upsert to increment stats for today
      await this.conversionStats!.updateOne(
        { date: today },
        {
          $inc: {
            totalLinks,
            successfulLinks,
            failedLinks,
          },
          $set: {
            updatedAt: now,
          },
          $setOnInsert: {
            createdAt: now,
          },
        },
        { upsert: true },
      );
    }, "trackLinkConversion");
  }

  async getConversionStatsByDate(
    date: string,
  ): Promise<LinkConversionStats | null> {
    return this.withRetry(
      () => this.conversionStats!.findOne({ date }),
      "getConversionStatsByDate",
    );
  }

  async getConversionStatsRange(
    startDate: string,
    endDate: string,
  ): Promise<LinkConversionStats[]> {
    return this.withRetry(
      () =>
        this.conversionStats!.find({
          date: { $gte: startDate, $lte: endDate },
        })
          .sort({ date: -1 })
          .toArray(),
      "getConversionStatsRange",
    );
  }

  async getAllConversionStats(
    limit: number = 30,
  ): Promise<LinkConversionStats[]> {
    return this.withRetry(
      () =>
        this.conversionStats!.find({})
          .sort({ date: -1 })
          .limit(limit)
          .toArray(),
      "getAllConversionStats",
    );
  }

  // ==================== CRAWL DATA METHODS ====================

  async upsertCrawlData(
    data: Omit<CrawlData, "id" | "createdAt" | "updatedAt">,
  ): Promise<{ data: CrawlData; created: boolean }> {
    return this.withRetry(async () => {
      const now = new Date().toISOString();

      // Try to find existing record by name
      const existing = await this.crawlData!.findOne({ name: data.name });

      if (existing) {
        // Update existing record
        const result = await this.crawlData!.findOneAndUpdate(
          { name: data.name },
          {
            $set: {
              metadata: data.metadata,
              updatedAt: now,
            },
          },
          { returnDocument: "after" },
        );

        return { data: result!, created: false };
      } else {
        // Insert new record
        const newData: CrawlData = {
          id: this.generateId(),
          ...data,
          createdAt: now,
          updatedAt: now,
        };

        await this.crawlData!.insertOne(newData);
        return { data: newData, created: true };
      }
    }, "upsertCrawlData");
  }
}

// Export singleton instance
export const dbService = new MongoDBService();
