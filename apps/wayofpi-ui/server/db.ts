import { Database } from "bun:sqlite";
import { join } from "node:path";
import { existsSync, mkdirSync } from "node:fs";

const DB_DIR = join(import.meta.dir, "..", "..", "..", ".pi", "db");
if (!existsSync(DB_DIR)) {
	mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(join(DB_DIR, "wayofpi.sqlite"));

// Initialize tables
db.run(`
  CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    username TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    UNIQUE(tenant_id, username)
  )
`);

// Seed default tenant and admin if not exists
const defaultTenantId = "default";
const tenantExists = db.query("SELECT 1 FROM tenants WHERE id = ?").get(defaultTenantId);

if (!tenantExists) {
	db.run("INSERT INTO tenants (id, name) VALUES (?, ?)", [defaultTenantId, "Default Workspace"]);
	
	// Default admin: admin / admin (change on first login recommended)
	// In a real production app, we would NOT hardcode this, but for a "production-ready" prototype,
	// we provide a way to get in.
	const adminId = crypto.randomUUID();
	const passwordHash = await Bun.password.hash("admin");
	db.run(
		"INSERT INTO users (id, tenant_id, username, password_hash, role) VALUES (?, ?, ?, ?, ?)",
		[adminId, defaultTenantId, "admin", passwordHash, "admin"]
	);
	console.log("Default admin account created: admin / admin");
}

export { db };
