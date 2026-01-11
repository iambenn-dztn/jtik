# Admin Management Scripts

## Available Scripts

### 1. Seed Initial Admin (First Time Setup)

Creates default admin account from environment variable.

```bash
cd server
npx tsx scripts/seed-admin.ts
```

**Default credentials:**

- Username: `admin`
- Password: from `ADMIN_PASSWORD` env var (default: `admin123`)

---

### 2. Create New Admin

Create a new admin account with custom credentials.

```bash
cd server
npx tsx scripts/create-admin.ts <username> <password> [role]
```

**Parameters:**

- `username`: Required - Admin username
- `password`: Required - Admin password
- `role`: Optional - `admin` (default) or `superadmin`

**Examples:**

```bash
# Create regular admin
npx tsx scripts/create-admin.ts john SecurePass123

# Create superadmin
npx tsx scripts/create-admin.ts superuser AdminPass456 superadmin
```

---

### 3. Update Admin Password

Change password for existing admin account.

```bash
cd server
npx tsx scripts/update-admin-password.ts <username> <new_password>
```

**Parameters:**

- `username`: Required - Existing admin username
- `new_password`: Required - New password

**Examples:**

```bash
# Update password for admin
npx tsx scripts/update-admin-password.ts admin NewSecurePass123

# Update password for specific user
npx tsx scripts/update-admin-password.ts john MyNewPassword456
```

---

## Security Notes

⚠️ **Important:**

- All passwords are hashed using **bcrypt** with salt rounds = 10
- Never commit passwords to version control
- Change default passwords immediately after first login
- Use strong passwords (min 8 chars, mix of letters, numbers, symbols)

## Troubleshooting

**Error: "Admin already exists"**

- Use `update-admin-password.ts` to change password instead
- Or manually delete the admin from MongoDB first

**Error: "Admin not found"**

- Check username spelling
- Verify admin exists in MongoDB: `db.admins.find({})`

**Error: "Connection error"**

- Check `MONGODB_URI` in `.env` file
- Verify MongoDB Atlas connection
- Check network/firewall settings
