import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { v4 as uuidv4 } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database interface
export interface Customer {
  id: string;
  phone: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  orderId: string;
  createdAt: string;
  updatedAt: string;
  status: "active" | "paid" | "deleted";
}

export interface Account {
  id: string;
  username: string;
  password: string;
  createdAt: string;
  updatedAt: string;
  status: "active" | "inactive" | "deleted";
  deletedAt?: string;
}

class JSONDatabaseService {
  private customerDbPath: string;
  private accountDbPath: string;
  private customerData: { customers: Customer[] } = { customers: [] };
  private accountData: { accounts: Account[] } = { accounts: [] };

  constructor() {
    this.customerDbPath = path.join(__dirname, "../customer.json");
    this.accountDbPath = path.join(__dirname, "../account.json");
    this.initializeDatabase();
  }

  private initializeDatabase() {
    // Initialize customer database
    if (!fs.existsSync(this.customerDbPath)) {
      this.customerData = { customers: [] };
      this.saveCustomerData();
    } else {
      try {
        const fileContent = fs.readFileSync(this.customerDbPath, "utf8");
        this.customerData = JSON.parse(fileContent);

        // Migration: Add default status to existing customers
        let needsSave = false;
        this.customerData.customers.forEach((customer) => {
          if (!customer.status) {
            customer.status = "active";
            needsSave = true;
          }
        });

        if (needsSave) {
          this.saveCustomerData();
          console.log("Migrated existing customers with default status");
        }
      } catch (error) {
        console.error("Error reading customer database file:", error);
        this.customerData = { customers: [] };
        this.saveCustomerData();
      }
    }

    // Initialize account database
    if (!fs.existsSync(this.accountDbPath)) {
      this.accountData = { accounts: [] };
      this.saveAccountData();
    } else {
      try {
        const fileContent = fs.readFileSync(this.accountDbPath, "utf8");
        this.accountData = JSON.parse(fileContent);
      } catch (error) {
        console.error("Error reading account database file:", error);
        this.accountData = { accounts: [] };
        this.saveAccountData();
      }
    }
  }

  private saveCustomerData() {
    try {
      fs.writeFileSync(
        this.customerDbPath,
        JSON.stringify(this.customerData, null, 2),
        "utf8"
      );
    } catch (error) {
      console.error("Error saving customer database file:", error);
    }
  }

  private saveAccountData() {
    try {
      fs.writeFileSync(
        this.accountDbPath,
        JSON.stringify(this.accountData, null, 2),
        "utf8"
      );
    } catch (error) {
      console.error("Error saving account database file:", error);
    }
  }

  private getNextId(): string {
    return uuidv4();
  }

  // Insert new customer
  public insertCustomer(
    customer: Omit<Customer, "id" | "createdAt" | "updatedAt" | "status">
  ): Customer {
    const now = new Date().toISOString();
    const newCustomer: Customer = {
      ...customer,
      id: this.getNextId(),
      createdAt: now,
      updatedAt: now,
      status: "active",
    };

    this.customerData.customers.push(newCustomer);
    this.saveCustomerData();

    return newCustomer;
  }

  // Get all customers
  public getAllCustomers(): Customer[] {
    return this.customerData.customers.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // Get customers (exclude deleted by default)
  public getCustomers(): Customer[] {
    return this.customerData.customers.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // Get customers with filters
  public getFilteredCustomers(filters: {
    status?: "active" | "paid" | "deleted";
    search?: string;
  }): Customer[] {
    let customers = this.customerData.customers;

    // Filter by status
    if (filters.status) {
      customers = customers.filter(
        (customer) => customer.status === filters.status
      );
    } else {
      // Default: exclude deleted customers unless specifically requested
      customers = customers.filter((customer) => customer.status !== "deleted");
    }

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      customers = customers.filter(
        (customer) =>
          customer.orderId.toLowerCase().includes(searchTerm) ||
          customer.phone.toLowerCase().includes(searchTerm)
      );
    }

    return customers.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // Update customer status
  public updateCustomerStatus(
    id: string,
    status: "active" | "paid" | "deleted"
  ): Customer | null {
    const customer = this.customerData.customers.find((c) => c.id === id);
    if (!customer) {
      return null;
    }

    customer.status = status;
    customer.updatedAt = new Date().toISOString();
    this.saveCustomerData();
    return customer;
  }

  // Soft delete customer
  public deleteCustomer(id: string): boolean {
    const customer = this.customerData.customers.find((c) => c.id === id);
    if (!customer) {
      return false;
    }

    customer.status = "deleted";
    customer.updatedAt = new Date().toISOString();
    this.saveCustomerData();
    return true;
  }

  // Get statistics
  public getStatistics() {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const allCustomers = this.customerData.customers;
    const recentCustomers = allCustomers.filter(
      (customer) => new Date(customer.createdAt) >= twentyFourHoursAgo
    );
    const paidCustomers = allCustomers.filter((c) => c.status === "paid");
    const deletedCustomers = allCustomers.filter((c) => c.status === "deleted");

    return {
      total: allCustomers.length,
      recent24h: recentCustomers.length,
      paid: paidCustomers.length,
      deleted: deletedCustomers.length,
      active: allCustomers.filter((c) => c.status === "active").length,
    };
  }

  // ==================== ACCOUNT METHODS ====================

  // Get all accounts
  public getAccounts(): Account[] {
    return this.accountData.accounts.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // Get accounts with filters
  public getFilteredAccounts(filters: {
    status?: "active" | "inactive" | "deleted";
    search?: string;
  }): Account[] {
    let accounts = this.accountData.accounts;

    // Filter by status
    if (filters.status) {
      accounts = accounts.filter(
        (account) => account.status === filters.status
      );
    } else {
      // Default: exclude deleted accounts unless specifically requested
      accounts = accounts.filter((account) => account.status !== "deleted");
    }

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      accounts = accounts.filter((account) =>
        account.username.toLowerCase().includes(searchTerm)
      );
    }

    return accounts.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // Insert new account
  public insertAccount(
    account: Omit<Account, "id" | "createdAt" | "updatedAt" | "status">
  ): Account {
    const now = new Date().toISOString();
    const newAccount: Account = {
      ...account,
      id: this.getNextId(),
      createdAt: now,
      updatedAt: now,
      status: "active",
    };

    this.accountData.accounts.push(newAccount);
    this.saveAccountData();
    return newAccount;
  }

  // Update account
  public updateAccount(
    id: string,
    updates: Partial<Omit<Account, "id" | "createdAt" | "updatedAt">>
  ): Account | null {
    const account = this.accountData.accounts.find((a) => a.id === id);
    if (!account) {
      return null;
    }

    Object.assign(account, updates, { updatedAt: new Date().toISOString() });
    this.saveAccountData();
    return account;
  }

  // Update account status
  public updateAccountStatus(
    id: string,
    status: "active" | "inactive" | "deleted"
  ): Account | null {
    const account = this.accountData.accounts.find((a) => a.id === id);
    if (!account) {
      return null;
    }

    account.status = status;
    account.updatedAt = new Date().toISOString();

    if (status === "deleted") {
      account.deletedAt = new Date().toISOString();
    }

    this.saveAccountData();
    return account;
  }

  // Soft delete account
  public deleteAccount(id: string): boolean {
    const account = this.accountData.accounts.find((a) => a.id === id);
    if (!account) {
      return false;
    }

    account.status = "deleted";
    account.deletedAt = new Date().toISOString();
    account.updatedAt = new Date().toISOString();
    this.saveAccountData();
    return true;
  }

  // Get account by username (for authentication)
  public getAccountByUsername(username: string): Account | null {
    return (
      this.accountData.accounts.find(
        (account) =>
          account.username === username && account.status !== "deleted"
      ) || null
    );
  }

  // Close database connection (not needed for JSON, but keeping interface consistent)
  public close() {
    // No-op for JSON database
  }
}

// Export singleton instance
export const dbService = new JSONDatabaseService();
export default JSONDatabaseService;
