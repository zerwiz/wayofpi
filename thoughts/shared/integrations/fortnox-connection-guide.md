# Fortnox Integration — Connection Guide

> Target: WOP-012 Phase 5 — Push approved tickets as invoices to Fortnox

---

## 1. Prerequisites

| Item | Details | Status |
|------|---------|--------|
| Fortnox developer account | Request via [fortnox.se/developer](https://www.fortnox.se/developer) or contact support to add Developer Portal to existing company | **Needed** |
| Client-ID + Client-Secret | Generated in Developer Portal under "Create Integration" | **Needed** |
| Sandbox test database | Create in Developer Portal → "My Sandboxes" | **Needed** |
| Redirect URI | OAuth callback URL (e.g. `https://app.wayofpi.se/integrations/fortnox/callback`) | **Needed** |
| Scopes | `invoice`, `customer`, `article`, `project`, `companyinformation`, `settings` | **Needed** |
| Fortnox license | Customer needs at least "Kundfaktura" license for invoice scope | **Customer** |

### Required Fortnox Licenses by Scope
| Scope | Required License |
|-------|-----------------|
| `invoice` | Order or Kundfaktura |
| `customer` | Kundfaktura or Order |
| `article` | Order or Kundfaktura |
| `project` | Bokföring or Order or Kundfaktura |
| `companyinformation` | Any |
| `settings` | Any |

---

## 2. OAuth 2.0 Authorization Code Flow

Fortnox uses a modified OAuth2 Authorization Code flow. Each tenant (customer) must authorize the integration once.

### Step-by-step

```
┌─────────────┐         ┌──────────────────┐         ┌──────────┐
│  Way of Pi   │         │  Fortnox OAuth    │         │ Customer │
│  (Backend)   │         │  Server           │         │ Browser  │
└──────┬──────┘         └────────┬─────────┘         └────┬─────┘
       │                         │                        │
       │  1. Redirect user to    │                        │
       │     Fortnox auth URL    │                        │
       │────────────────────────>│                        │
       │                         │                        │
       │                         │   2. Login + consent   │
       │                         │<───────────────────────│
       │                         │                        │
       │                         │   3. Auth code (10min) │
       │                         │───────────────────────>│
       │                         │                        │
       │  4. Auth code via       │                        │
       │     redirect_uri        │                        │
       │<────────────────────────│                        │
       │                         │                        │
       │  5. POST /oauth-v1/token│                        │
       │     (code + client_id + │                        │
       │      client_secret)     │                        │
       │────────────────────────>│                        │
       │                         │                        │
       │  6. Access Token (1h)   │                        │
       │     + Refresh Token(45d)│                        │
       │<────────────────────────│                        │
       │                         │                        │
       │  7. Store tokens in DB  │                        │
       │     for this tenant     │                        │
```

### Authorization URL
```
GET https://apps.fortnox.se/oauth-v1/auth
  ?client_id={Client-ID}
  &redirect_uri=https%3A%2F%2Fapp.wayofpi.se%2Fintegrations%2Ffortnox%2Fcallback
  &scope=invoice,customer,article,project,companyinformation,settings
  &state={anti-csrf-token}
  &access_type=offline
  &response_type=code
```

### Token Exchange
```
POST https://apps.fortnox.se/oauth-v1/token
Content-Type: application/x-www-form-urlencoded
Authorization: Basic {base64(client_id:client_secret)}

code={auth_code}&grant_type=authorization_code&redirect_uri={redirect_uri}
```

### Token Refresh
```
POST https://apps.fortnox.se/oauth-v1/token
Content-Type: application/x-www-form-urlencoded
Authorization: Basic {base64(client_id:client_secret)}

grant_type=refresh_token&refresh_token={refresh_token}
```

### Token Lifetimes
| Token | Valid For | Notes |
|-------|-----------|-------|
| Authorization Code | 10 minutes | Single-use, discarded after exchange |
| Access Token | 1 hour | Used for API calls; auto-refresh 5 min before expiry |
| Refresh Token | 45 days | Regenerates on every refresh (old one invalidated) |
| Client-ID / Secret | Permanent | Regenerate manually if compromised |

---

## 3. API Endpoints (Relevant to WOP-012)

### Base URL: `https://api.fortnox.se/3/`

### Customers
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/customers` | List customers (find by org number) |
| GET | `/customers/{id}` | Get single customer |
| POST | `/customers` | Create customer (auto-sync from WOP) |
| PUT | `/customers/{id}` | Update customer |

### Articles (Price List Items)
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/articles` | List articles |
| POST | `/articles` | Create article (e.g. "Arbetstimmar" "Material") |
| PUT | `/articles/{id}` | Update article (price, VAT) |

### Invoices
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/invoices` | List invoices (filter by date, customer) |
| POST | `/invoices` | Create invoice from approved ticket |
| PUT | `/invoices/{id}` | Update draft invoice |
| PUT | `/invoices/{id}/bookkeep` | Finalize invoice (bookkeep) |
| PUT | `/invoices/{id}/cancel` | Cancel invoice |
| PUT | `/invoices/{id}/credit` | Credit invoice |
| GET | `/invoices/{id}/send` | Send as e-invoice |
| GET | `/invoices/{id}/email` | Send as email |

### Projects
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/projects` | List projects (Resultatenheter) |
| POST | `/projects` | Create project |
| PUT | `/projects/{id}` | Update project |

### Rate Limits
- **25 requests per 5 seconds** per access token (= 300 req/min)
- If exceeded: HTTP 429 with `Retry-After` header

---

## 4. Invoice Payload (From Approved Ticket)

```json
{
  "CustomerNumber": "CUST001",
  "InvoiceDate": "2026-05-09",
  "DueDate": "2026-06-08",
  "DeliveryDate": "2026-05-09",
  "Currency": "SEK",
  "Language": "SV",
  "ProjectNumber": "PROJ001",
  "YourReference": "Project: Nya Badrum Kungsgatan",
  "OurReference": "John Leader",
  "Comments": "ÄTA-arbeten godkända av kund via Way of Pi",
  "InvoiceRows": [
    {
      "ArticleNumber": "ARBETE_TIM",
      "Description": "Bergschaktning — 4 timmar (ticket_abc123)",
      "DeliveredQuantity": 4,
      "Unit": "h",
      "Price": 650,
      "VAT": 25,
      "CostCenter": "CC001",
      "ProjectNumber": "PROJ001"
    },
    {
      "ArticleNumber": "MATR_CEMENT",
      "Description": "Cement 25kg x 3 — material till ticket_abc123",
      "DeliveredQuantity": 3,
      "Unit": "st",
      "Price": 189,
      "VAT": 25,
      "ProjectNumber": "PROJ001"
    }
  ],
  "EmailInformation": {
    "EmailAddressTo": "kund@example.com",
    "EmailSubject": "Faktura — ÄTA-arbeten v.19",
    "EmailBody": "Hej, här kommer faktura för godkända ÄTA-arbeten. Se bifogad PDF för detaljer."
  },
  "ExternalLink": "https://app.wayofpi.se/evidence/ticket_abc123"
}
```

### ROT/RUT Split (Private Clients)
```json
{
  "CustomerNumber": "PRIV001",
  "InvoiceRows": [
    {
      "ArticleNumber": "ARBETE_TIM",
      "Description": "Renovering badrum — 8 timmar",
      "DeliveredQuantity": 8,
      "Price": 650
    },
    {
      "ArticleNumber": "ROT_AVDRAG",
      "Description": "ROT-avdrag 30% på arbete (automatiskt)",
      "DeliveredQuantity": 1,
      "Price": -1560
    }
  ],
  "RotRut": {
    "Type": "ROT",
    "Amount": 1560,
    "Description": "Renovering badrum — 30% ROT-avdrag"
  }
}
```

---

## 5. Architecture — Way of Pi Implementation

### File Structure
```
server/
  integrations/
    fortnox.ts           # Fortnox client wrapper (OAuth, API calls)
    fortnox-callback.ts   # OAuth callback handler
    fortnox-sync.ts       # Sync logic: push approved tickets as invoices
    sync-log.ts           # Shared sync log table + retry logic
```

### Database Tables to Add

```sql
-- Tenant Fortnox credentials (encrypted)
CREATE TABLE IF NOT EXISTS fortnox_connections (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id TEXT NOT NULL,
    client_secret_encrypted TEXT NOT NULL,  -- Encrypted at rest
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    access_token_expires_at TEXT,
    refresh_token_expires_at TEXT,
    fortnox_customer_id TEXT,               -- Default customer mapping
    article_mapping_json TEXT DEFAULT '{}', -- {labor: "ARBETE_TIM", material: "MATR_*"}
    rot_enabled BOOLEAN DEFAULT 0,
    active BOOLEAN DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Sync log for invoice pushes
CREATE TABLE IF NOT EXISTS fortnox_sync_log (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    ticket_id TEXT REFERENCES tickets(id),
    invoice_id TEXT,                          -- Fortnox invoice ID
    direction TEXT DEFAULT 'out',            -- 'out' (push to Fortnox), 'in' (callback from Fortnox)
    status TEXT DEFAULT 'pending',           -- 'pending', 'success', 'error', 'retry'
    payload_json TEXT,                        -- What was sent
    response_json TEXT,                       -- What Fortnox returned
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    processed_at TEXT
);
```

### Config (Tenant Settings Page)
| Setting | Type | Description |
|---------|------|-------------|
| Client ID | string | From Fortnox Developer Portal |
| Client Secret | string | Encrypted at rest |
| OAuth Status | badge | Connected / Not connected / Expired |
| Labor Article# | string | e.g. "ARBETE_TIM" |
| Material Article# prefix | string | e.g. "MATR_" |
| Project sync | toggle | Sync projects as Resultatenheter |
| ROT enabled | toggle | Enable ROT deduction for private clients |
| Default due days | number | 30 (standard Swedish payment terms) |

### Sync Flow
```
Ticket status → "approved"
       ↓
[Webhook: /api/integrations/fortnox/sync]
       ↓
1. Read tenant fortnox_connection
2. Decrypt tokens
3. Check if access token expired → refresh if needed
4. Build invoice payload from ticket:
   a. Map customer (find/create in Fortnox)
   b. Map articles (labor hours + materials)
   c. Apply ROT/RUT if private client
   d. Set ProjectNumber
   e. Add ExternalLink to evidence
5. POST /invoices to Fortnox
6. Store response in fortnox_sync_log
7. Mark ticket.status → "invoiced"
8. Store Fortnox invoice_ref on ticket
       ↓
[If failure: retry 3x with exponential backoff]
```

### Webhook Callback (Payment Status)
Fortnox can push payment status back via webhook. Implementation:
```
Fortnox payment received
       ↓
Webhook → POST /api/integrations/fortnox/payment-callback
       ↓
1. Look up ticket by invoice_id in fortnox_sync_log
2. Mark ticket.payment_status → "paid"
3. Notify project leader (in-app + email)
```

---

## 6. Node.js SDK Option

There is an existing open-source SDK: [`@anikghosh256/fortnox-node-sdk`](https://github.com/anikghosh256/fortnox-node-sdk)

- **License**: MIT
- **Dependencies**: Zero (uses native `fetch`)
- **Bun compatible**: Yes (native fetch, no Node.js-specific APIs)
- **Auto token refresh**: Built-in (5 min before expiry)
- **Resources**: Articles, Customers, Orders, Invoices, Price Lists, Prices

```typescript
import { FortnoxClient } from '@anikghosh256/fortnox-node-sdk';

const client = new FortnoxClient({
  clientId: '...',
  clientSecret: '...',
  redirectUri: 'https://app.wayofpi.se/integrations/fortnox/callback',
  scopes: ['invoice', 'customer', 'article', 'project', 'companyinformation'],
  initialAccessToken: loadedAccessToken,
  initialRefreshToken: loadedRefreshToken,
  onTokenRefresh: async (tokens) => {
    await saveTokens(tenantId, tokens);
  },
});

// Create invoice from approved ticket
const invoice = await client.invoices.create({
  CustomerNumber: customerNo,
  InvoiceDate: ticket.approved_at,
  DueDate: addDays(ticket.approved_at, 30),
  Currency: 'SEK',
  InvoiceRows: buildRows(ticket),
  ProjectNumber: projectNo,
  ExternalLink: `https://app.wayofpi.se/evidence/${ticket.id}`,
});
```

**Alternative**: Build a lightweight wrapper ourselves using `fetch` + our existing `jose` JWT library (already in dependencies). The SDK is convenient but adds a dependency. Since Bun has native fetch, a ~100-line wrapper is feasible.

---

## 7. Development Checklist

- [ ] Register as Fortnox developer (request via support if org exists in Fortnox)
- [ ] Create integration in Developer Portal → get Client-ID + Client-Secret
- [ ] Create sandbox test database
- [ ] Set redirect URI: `http://localhost:5173/integrations/fortnox/callback` (dev) + production URL
- [ ] Add `fortnox_connections` table to schema.sql + db.ts
- [ ] Add `fortnox_sync_log` table to schema.sql + db.ts
- [ ] Create `server/integrations/fortnox.ts` — client wrapper (OAuth + API)
- [ ] Create `server/integrations/fortnox-callback.ts` — OAuth callback route
- [ ] Create `server/integrations/fortnox-sync.ts` — push approved tickets as invoices
- [ ] Create `server/integrations/sync-log.ts` — shared retry/audit
- [ ] Add Fortnox settings page in Admin UI (tenant config)
- [ ] Add "Connected to Fortnox" badge + "Sync Now" button
- [ ] Test in sandbox: create ticket → approve → push invoice → verify in Fortnox
- [ ] Handle webhook callback for payment status

---

## 8. Common Errors & Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `Auth code or ClientID supplied is invalid` | OAuth checkbox not checked in Developer Portal | Check "Allow OAuth2" in integration settings |
| `Missing rights to list/create invoice` | User lacks Kundfaktura license | Customer needs appropriate Fortnox license |
| `Access token expired` | Auto-refresh failed | Implement `onTokenRefresh` callback to persist new tokens |
| `Refresh token expired` | No activity for 45 days | User must re-authenticate the integration |
| HTTP 429 | Rate limit exceeded | Backoff + retry (25 req/5s per token) |
| `CustomerNumber not found` | Customer not synced | Auto-create customer from WOP project client |

---

**References:**
- Fortnox Developer Portal: https://www.fortnox.se/developer
- Fortnox API Docs: https://apps.fortnox.se/apidocs
- Fortnox Node.js SDK: https://github.com/anikghosh256/fortnox-node-sdk
- OAuth Authorization Guide: https://www.fortnox.se/developer/authorization
- Scopes Reference: https://www.fortnox.se/developer/guides-and-good-to-know/scopes
