import { MongoClient, Db, Collection, ObjectId } from "mongodb";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/jtik";
const DB_NAME = "jtik";

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
  status: "active" | "inactive" | "deleted";
  createdAt: string;
  updatedAt: string;
}

class MongoDBService {
  private client: MongoClient;
  private db: Db | null = null;
  private customers: Collection<Customer> | null = null;
  private accounts: Collection<Account> | null = null;
  private connected: boolean = false;

  constructor() {
    this.client = new MongoClient(MONGODB_URI);
  }

  async connect(): Promise<void> {
    if (this.connected) return;

    try {
      await this.client.connect();
      this.db = this.client.db(DB_NAME);
      this.customers = this.db.collection<Customer>("customers");
      this.accounts = this.db.collection<Account>("accounts");
      this.connected = true;

      // Create indexes
      await this.customers.createIndex({ id: 1 }, { unique: true });
      await this.customers.createIndex({ phone: 1 });
      await this.customers.createIndex({ status: 1 });
      await this.accounts.createIndex({ id: 1 }, { unique: true });
      await this.accounts.createIndex({ username: 1 }, { unique: true });

      console.log("✅ Connected to MongoDB:", DB_NAME);
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
    if (!this.connected || !this.customers || !this.accounts) {
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

  async insertCustomer(customer: Omit<Customer, "id" | "status" | "createdAt" | "updatedAt">): Promise<Customer> {
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

  async updateCustomerStatus(id: string, status: "active" | "paid" | "deleted"): Promise<Customer | null> {
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
    return await this.accounts!.findOne({ username, status: { $ne: "deleted" } });
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

  async insertAccount(account: Omit<Account, "id" | "status" | "createdAt" | "updatedAt">): Promise<Account> {
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

  async updateAccount(id: string, updates: Partial<Omit<Account, "id" | "createdAt">>): Promise<Account | null> {
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

  async updateAccountStatus(id: string, status: "active" | "inactive" | "deleted"): Promise<Account | null> {
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
}

// Export singleton instance
export const dbService = new MongoDBService();
