import bcrypt from "bcrypt";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "";
const SALT_ROUNDS = 10;

async function updateAdminPassword(username: string, newPassword: string) {
  if (!username || !newPassword) {
    console.log(
      "❌ Usage: npx tsx scripts/update-admin-password.ts <username> <new_password>"
    );
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db("jtik");
    const adminsCollection = db.collection("admins");

    // Check if admin exists
    const admin = await adminsCollection.findOne({ username });
    if (!admin) {
      console.log("❌ Admin not found:", username);
      process.exit(1);
    }

    // Hash new password
    console.log("🔐 Hashing password...");
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update admin password
    const result = await adminsCollection.updateOne(
      { username },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    if (result.modifiedCount > 0) {
      console.log("✅ Password updated successfully for:", username);
      console.log("🔑 New password:", newPassword);
    } else {
      console.log("⚠️  No changes made");
    }
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Get arguments from command line
const username = process.argv[2];
const newPassword = process.argv[3];

updateAdminPassword(username, newPassword);
