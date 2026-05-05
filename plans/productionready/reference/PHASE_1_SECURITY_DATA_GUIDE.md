# Phase 1: Security & Data Implementation Guide

This guide provides technical best practices and security hardening rules for **Phase 1: Data & Security Foundation**. Adhering to these patterns is critical for a safe multi-tenant deployment.

## 1. Database Foundation (SQLite & Multi-Tenancy)

### 🚀 Performance & Concurrency
By default, SQLite is optimized for single-user access. For a production server with 100+ workers, you **must** enable WAL mode:
- **Enable WAL Mode:** Run `PRAGMA journal_mode = WAL;` and `PRAGMA synchronous = NORMAL;`. This allows concurrent reads while a write is in progress.
- **Bun optimization:** Use the native `bun:sqlite` module for maximum performance.

### 🛡️ Tenancy Isolation
- **The Golden Rule:** Every table containing user-generated or tenant-specific data (Users, Tasks, Files, TimeEntries) **must** have a `tenant_id` column.
- **Compound Constraints:** Use unique constraints like `UNIQUE(tenant_id, username)` or `UNIQUE(tenant_id, file_path)` to prevent cross-tenant collisions.
- **ORM Choice:** Use **Drizzle ORM**. It provides type-safety while allowing the raw control needed to verify `tenant_id` inclusion in every query.

## 2. RBAC Engine (Access Control)

### 🏗️ Simple Hierarchical Roles
Keep roles flat and easy to reason about:
- `SUPER_ADMIN`, `ADMIN`, `LEADER`, `WORKER`, `CLIENT`.
- **Middleware Enforcement:** RBAC checks must happen at the **middleware layer**. Reject unauthorized requests (403 Forbidden) before they reach the business logic or database.

## 3. Path Hardening & Directory Traversal

### 🚫 No Hardcoded Paths
- **Mandate:** No absolute or hardcoded file paths (e.g., `/home/user/data`) should exist in the source code.
- **Dynamic Scoping:** All paths must be derived dynamically from a `BASE_DIR` environment variable and scoped by `tenant_id`.

### 🛡️ Secure Path Resolution
To prevent directory traversal attacks (e.g., a user requesting `../../etc/passwd`):
1.  **Decode Input:** Explicitly decode user-provided path components.
2.  **Reject Null Bytes:** Immediately reject any input containing null bytes (`\0`).
3.  **Canonicalize:** Use `path.resolve()` to get the absolute canonical path.
4.  **Boundary Check:** Verify the resolved path starts with the base directory **plus a path separator**:
    ```typescript
    if (!resolvedPath.startsWith(baseDirectory + path.sep)) {
      throw new Error("Security Violation: Directory Traversal Attempted");
    }
    ```

## 4. Secrets & Auth Management

### 🛠️ Developer Safety
- Hide mock authentication behind a strict environment flag: `WOP_ALLOW_MOCK_AUTH=true`. Ensure this is **never** true in production.
- **Logging:** Configure the server logger to automatically redact sensitive fields (`pin`, `password`, `token`, `authorization`) before they hit the console or log files.

---
*Way of Pi - Secure by Design.*
