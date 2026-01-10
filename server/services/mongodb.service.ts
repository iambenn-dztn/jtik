import { MongoClient, Db, Collection, ObjectId } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/jtik";
const DB_NAME = "jtik";

console.log(
  "🔗 MongoDB URI:",
  MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@")
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
  password: string;
  cookie?: string;
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

class MongoDBService {
  private client: MongoClient;
  private db: Db | null = null;
  private customers: Collection<Customer> | null = null;
  private accounts: Collection<Account> | null = null;
  private admins: Collection<AdminUser> | null = null;
  private connected: boolean = false;

  constructor() {
    console.log("MongoDB URI:", MONGODB_URI);
    this.client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      retryWrites: true,
      retryReads: true,
      maxPoolSize: 10,
      minPoolSize: 2,
      tls: true,
      tlsAllowInvalidCertificates: false,
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
      this.connected = true;

      console.log("✅ Connected to MongoDB Atlas");
      console.log("📁 Database:", this.db.databaseName);

      // List collections
      const collections = await this.db.listCollections().toArray();
      console.log(
        "📦 Collections:",
        collections.map((c) => c.name)
      );

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
    if (this.client) {
      await this.client.close();
      this.connected = false;
      console.log("MongoDB connection closed");
    }
  }

  private ensureConnected(): void {
    if (!this.connected || !this.customers || !this.accounts || !this.admins) {
      throw new Error("Database not connected. Call connect() first.");
    }
  }

  // ==================== CUSTOMER METHODS ====================

  async getCustomers(): Promise<Customer[]> {
    this.ensureConnected();
    return await this.customers!.find({ status: { $ne: "deleted" } }).toArray();
  }

  async getAllCustomers(): Promise<Customer[]> {
    this.ensureConnected();
    return await this.customers!.find({}).toArray();
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    this.ensureConnected();
    return await this.customers!.findOne({ id, status: { $ne: "deleted" } });
  }

  async getFilteredCustomers(filters: {
    status?: "active" | "paid" | "deleted";
    search?: string;
  }): Promise<Customer[]> {
    this.ensureConnected();

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

    return await this.customers!.find(query).sort({ createdAt: -1 }).toArray();
  }

  async insertCustomer(
    customer: Omit<Customer, "id" | "status" | "createdAt" | "updatedAt">
  ): Promise<Customer> {
    this.ensureConnected();

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
  }

  async updateCustomerStatus(
    id: string,
    status: "active" | "paid" | "deleted"
  ): Promise<Customer | null> {
    this.ensureConnected();

    const result = await this.customers!.findOneAndUpdate(
      { id },
      {
        $set: {
          status,
          updatedAt: new Date().toISOString(),
        },
      },
      { returnDocument: "after" }
    );

    return result || null;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    this.ensureConnected();

    const result = await this.customers!.updateOne(
      { id },
      {
        $set: {
          status: "deleted",
          updatedAt: new Date().toISOString(),
        },
      }
    );

    return result.modifiedCount > 0;
  }

  async getStatistics(): Promise<{
    total: number;
    active: number;
    paid: number;
    deleted: number;
  }> {
    this.ensureConnected();

    const [total, active, paid, deleted] = await Promise.all([
      this.customers!.countDocuments({}),
      this.customers!.countDocuments({ status: "active" }),
      this.customers!.countDocuments({ status: "paid" }),
      this.customers!.countDocuments({ status: "deleted" }),
    ]);

    return { total, active, paid, deleted };
  }

  // ==================== ACCOUNT METHODS ====================

  async getAccounts(): Promise<Account[]> {
    this.ensureConnected();
    return await this.accounts!.find({ status: { $ne: "deleted" } }).toArray();
  }

  async getAllAccounts(): Promise<Account[]> {
    this.ensureConnected();
    return await this.accounts!.find({}).toArray();
  }

  async getAccountById(id: string): Promise<Account | null> {
    this.ensureConnected();
    return await this.accounts!.findOne({ id, status: { $ne: "deleted" } });
  }

  async getAccountByUsername(username: string): Promise<Account | null> {
    this.ensureConnected();
    return await this.accounts!.findOne({
      username,
      status: { $ne: "deleted" },
    });
  }

  async getFirstActiveAccount(): Promise<Account | null> {
    this.ensureConnected();
    console.log(1111);
    return await this.accounts!.findOne({
      status: "active",
    });
  }

  async getFilteredAccounts(filters: {
    status?: "active" | "inactive" | "deleted";
    search?: string;
  }): Promise<Account[]> {
    this.ensureConnected();

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
  }

  async insertAccount(
    account: Omit<Account, "id" | "status" | "createdAt" | "updatedAt">
  ): Promise<Account> {
    this.ensureConnected();

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
  }

  async updateAccount(
    id: string,
    updates: Partial<Omit<Account, "id" | "createdAt">>
  ): Promise<Account | null> {
    this.ensureConnected();

    const result = await this.accounts!.findOneAndUpdate(
      { id },
      {
        $set: {
          ...updates,
          updatedAt: new Date().toISOString(),
        },
      },
      { returnDocument: "after" }
    );

    return result || null;
  }

  async updateAccountStatus(
    id: string,
    status: "active" | "inactive" | "deleted"
  ): Promise<Account | null> {
    this.ensureConnected();

    const result = await this.accounts!.findOneAndUpdate(
      { id },
      {
        $set: {
          status,
          updatedAt: new Date().toISOString(),
        },
      },
      { returnDocument: "after" }
    );

    return result || null;
  }

  async deleteAccount(id: string): Promise<boolean> {
    this.ensureConnected();

    const result = await this.accounts!.updateOne(
      { id },
      {
        $set: {
          status: "deleted",
          updatedAt: new Date().toISOString(),
        },
      }
    );

    return result.modifiedCount > 0;
  }

  // ==================== UTILITY METHODS ====================

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // ==================== ADMIN METHODS ====================

  async getAdminByUsername(username: string): Promise<AdminUser | null> {
    this.ensureConnected();
    return await this.admins!.findOne({
      username,
      status: "active",
    });
  }

  async getAdminById(id: string): Promise<AdminUser | null> {
    this.ensureConnected();
    return await this.admins!.findOne({
      id,
      status: "active",
    });
  }

  async getAllAdmins(): Promise<AdminUser[]> {
    this.ensureConnected();
    return await this.admins!.find({ status: "active" }).toArray();
  }

  async insertAdmin(
    admin: Omit<AdminUser, "id" | "createdAt" | "updatedAt">
  ): Promise<AdminUser> {
    this.ensureConnected();

    const now = new Date().toISOString();
    const newAdmin: AdminUser = {
      id: this.generateId(),
      ...admin,
      createdAt: now,
      updatedAt: now,
    };

    await this.admins!.insertOne(newAdmin);
    return newAdmin;
  }

  async updateAdminLastLogin(id: string): Promise<AdminUser | null> {
    this.ensureConnected();

    const result = await this.admins!.findOneAndUpdate(
      { id },
      {
        $set: {
          lastLogin: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
      { returnDocument: "after" }
    );

    return result || null;
  }

  async updateAdminPassword(
    id: string,
    hashedPassword: string
  ): Promise<AdminUser | null> {
    this.ensureConnected();

    const result = await this.admins!.findOneAndUpdate(
      { id },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date().toISOString(),
        },
      },
      { returnDocument: "after" }
    );

    return result || null;
  }
}

// Export singleton instance
export const dbService = new MongoDBService();
