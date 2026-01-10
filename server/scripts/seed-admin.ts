import { createAdmin } from "../services/auth.service.js";

/**
 * Script to create initial admin user
 * Usage: tsx server/scripts/seed-admin.ts
 */
async function seedAdmin() {
  try {
    console.log("🌱 Seeding admin user...");

    // Create default admin
    const username = "admin";
    const password = process.env.ADMIN_PASSWORD || "admin123";

    const admin = await createAdmin(username, password, "admin");

    if (admin) {
      console.log("✅ Admin user created successfully");
      console.log("👤 Username:", username);
      console.log("🔑 Password:", password);
      console.log("⚠️  Please change the password after first login!");
    } else {
      console.log("ℹ️  Admin user already exists");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding admin:", error);
    process.exit(1);
  }
}

seedAdmin();
