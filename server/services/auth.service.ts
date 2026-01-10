import bcrypt from "bcryptjs";
import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI || "";
const client = new MongoClient(MONGODB_URI);

interface Admin {
  _id?: any;
  username: string;
  password: string; // hashed
  role: string;
  refreshTokens: string[];
  createdAt: Date;
}

/**
 * Hash password
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compare password with hash
 */
export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Get admin by username
 */
export const getAdminByUsername = async (
  username: string
): Promise<Admin | null> => {
  try {
    await client.connect();
    const db = client.db("jtik");
    const adminsCollection = db.collection<Admin>("admins");
    const admin = await adminsCollection.findOne({ username });
    return admin;
  } catch (error) {
    console.error("Error getting admin:", error);
    return null;
  } finally {
    await client.close();
  }
};

/**
 * Create admin (for initial setup)
 */
export const createAdmin = async (
  username: string,
  password: string,
  role: string = "admin"
): Promise<Admin | null> => {
  try {
    await client.connect();
    const db = client.db("jtik");
    const adminsCollection = db.collection<Admin>("admins");

    // Check if admin already exists
    const existingAdmin = await adminsCollection.findOne({ username });
    if (existingAdmin) {
      console.log("Admin already exists");
      return null;
    }

    const hashedPassword = await hashPassword(password);
    const admin: Admin = {
      username,
      password: hashedPassword,
      role,
      refreshTokens: [],
      createdAt: new Date(),
    };

    await adminsCollection.insertOne(admin);
    return admin;
  } catch (error) {
    console.error("Error creating admin:", error);
    return null;
  } finally {
    await client.close();
  }
};

/**
 * Add refresh token to admin
 */
export const addRefreshToken = async (
  username: string,
  refreshToken: string
): Promise<boolean> => {
  try {
    await client.connect();
    const db = client.db("jtik");
    const adminsCollection = db.collection<Admin>("admins");

    await adminsCollection.updateOne(
      { username },
      { $push: { refreshTokens: refreshToken } }
    );

    return true;
  } catch (error) {
    console.error("Error adding refresh token:", error);
    return false;
  } finally {
    await client.close();
  }
};

/**
 * Remove refresh token from admin
 */
export const removeRefreshToken = async (
  username: string,
  refreshToken: string
): Promise<boolean> => {
  try {
    await client.connect();
    const db = client.db("jtik");
    const adminsCollection = db.collection<Admin>("admins");

    await adminsCollection.updateOne(
      { username },
      { $pull: { refreshTokens: refreshToken } }
    );

    return true;
  } catch (error) {
    console.error("Error removing refresh token:", error);
    return false;
  } finally {
    await client.close();
  }
};

/**
 * Verify refresh token exists for admin
 */
export const verifyRefreshTokenExists = async (
  username: string,
  refreshToken: string
): Promise<boolean> => {
  try {
    await client.connect();
    const db = client.db("jtik");
    const adminsCollection = db.collection<Admin>("admins");

    const admin = await adminsCollection.findOne({
      username,
      refreshTokens: refreshToken,
    });

    return !!admin;
  } catch (error) {
    console.error("Error verifying refresh token:", error);
    return false;
  } finally {
    await client.close();
  }
};
