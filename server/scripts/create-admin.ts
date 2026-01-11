import bcrypt from "bcrypt";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "";
const SALT_ROUNDS = 10;

async function createAdmin(
  username: string,
  password: string,
  role: string = "admin"
) {
  if (!username || !password) {
    console.log(
      "❌ Usage: npx tsx scripts/create-admin.ts <username> <password> [role]"
    );
    console.log("   role: admin (default) | superadmin");
    process.exit(1);
  }

  if (!["admin", "superadmin"].includes(role)) {
    console.log("❌ Invalid role. Must be 'admin' or 'superadmin'");
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db("jtik");
    const adminsCollection = db.collection("admins");

    // Check if admin already exists
    const existingAdmin = await adminsCollection.findOne({ username });
    if (existingAdmin) {
      console.log("❌ Admin already exists:", username);
      console.log("💡 Use update-admin-password.ts to change password");
      process.exit(1);
    }

    // Hash password
    console.log("🔐 Hashing password...");
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create new admin
    const newAdmin = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      username,
      password: hashedPassword,
      role,
      status: "active",
      refreshTokens: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await adminsCollection.insertOne(newAdmin);

    console.log("✅ Admin created successfully");
    console.log("👤 Username:", username);
    console.log("🔑 Password:", password);
    console.log("👮 Role:", role);
    console.log("⚠️  Please save these credentials securely!");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Get arguments from command line
const username = process.argv[2];
const password = process.argv[3];
const role = process.argv[4] || "admin";

createAdmin(username, password, role);
