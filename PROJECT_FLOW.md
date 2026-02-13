# Maheshwari Motors — Project Flow

> This guide explains the full project in simple terms. If you're new here, read this first.

---

## What is this project?

Maheshwari Motors is an **inventory + billing system** for an auto-parts business. It handles:

- Managing items (auto parts), parties (customers), suppliers
- Creating delivery notes (challans) and converting them into bills
- Recording payments and tracking who owes what
- Stock management with low-stock alerts
- Discount rules that auto-apply during billing
- GST and NON_GST operations as separate firms

---

## The Big Picture

```
ONE User Account
├── Admin credential   → manage staff, view overall dashboard
├── GST Firm credential   → daily GST operations (challans, bills, etc.)
└── NON_GST Firm credential   → daily NON_GST operations
```

A **User** is the central entity. Each user has:

- **2 embedded firms** (GST + NON_GST) — these are NOT separate collections, they're objects inside the User document
- **1 admin credential** (only for the main user, staff don't get this)

There's only **ONE main user** in the entire system. The main user can create **secondary users** (staff) who also get their own GST + NON_GST firm credentials.

---

## Data Ownership: Shared vs Firm-Scoped

This is the most important concept to understand:

### Shared Data (filtered by `user_id` only)

These are visible regardless of which firm you're logged into:

| Data         | Description                |
| ------------ | -------------------------- |
| Items        | Auto parts with stock info |
| Parties      | Customers                  |
| Suppliers    | Where you buy parts from   |
| Categories   | Tags for organizing items  |
| Discounts    | Discount rules             |
| Stock Alerts | Low stock warnings         |

### Firm-Scoped Data (filtered by `user_id` + `is_gst`)

These are different for GST firm vs NON_GST firm:

| Data         | Description                 |
| ------------ | --------------------------- |
| Challans     | Delivery notes              |
| Bills        | Invoices from challans      |
| Transactions | Payment records             |
| Purchases    | Goods bought from suppliers |
| Dashboard    | Firm-specific stats         |

**How it works:** When you login as GST firm, your token contains `firm_type: "GST"`. The server sets `req.isGst = 1` and automatically filters all firm-scoped data to show only GST records. No firmId needed in URLs.

---

## Step-by-Step Flow

### Step 1: First-Time Setup (One Time Only)

```
POST /auth/admin/register → Creates the main user with admin + both firms
```

This creates:

- The main admin username/password
- The GST firm username/password + firm details (GSTIN, bank info, etc.)
- The NON_GST firm username/password + firm details

After this, the main user has **3 logins** ready.

### Step 2: Login

**Admin Login** (for management):

```
POST /auth/admin/login → { username, password } → token (role: "admin")
```

**Firm Login** (for daily work):

```
POST /auth/firm/login → { username, password } → token (role: "firm", firm_type: "GST" or "NON_GST")
```

The firm login response includes full firm details (name, GSTIN, bank info, etc.) so the app can display them.

### Step 3: Set Up Master Data

Before you can create challans and bills, you need:

```
1. Create Items     → POST /items (with image upload)
2. Create Parties   → POST /parties (customers)
3. Create Suppliers → POST /suppliers (optional, for purchases)
4. Create Categories → POST /categories (optional, for organizing items)
5. Create Discounts → POST /discounts (optional, auto-apply to challans)
```

**About Items:**

- Each item has `is_gst` flag: `1` = GST item, `0` = NON_GST item
- Items have **two stock counts**: `gst_stock` and `nongst_stock`
- Items have a `threshold` — if total stock drops below this, a stock alert is created

### Step 4: Create Challans (Delivery Notes)

```
POST /challans (requires firm token)
```

A challan is "I delivered these items to this party, but haven't billed yet".

**The auto-split magic:**
When you create a challan with mixed items (some GST, some NON_GST), the server automatically splits them:

- GST items → a challan under GST firm (stock deducted from `gst_stock`)
- NON_GST items → a challan under NON_GST firm (no stock deduction)
- Both challans are linked via `linked_challan_id`

**Discounts auto-apply:**
The server checks discount rules and applies them:

1. `party_item` (specific party + specific item) → highest priority
2. `item` (flat discount on item) → second priority
3. `party_all` (party gets discount on everything) → lowest priority

You can override by sending `discount` in the item or challan body.

### Step 5: Create Bills (Invoices)

```
POST /bills (requires firm token)
```

Select one or more **unconverted challans** for a party → the server creates a bill.

```json
{
  "party_id": "...",
  "challan_ids": ["...", "..."],
  "apply_balance": false,
  "delivered_amount": 45000
}
```

- `apply_balance: true` → party's existing balance is applied to reduce the bill
- `delivered_amount` → if less than total, the difference becomes `return_amount` and credits the party

The challans are marked as `converted_to_bill = true`.

### Step 6: Record Payments

**Option A: Quick payment directly on bill:**

```
POST /bills/:billId/payment → { "amount": 25000 }
```

**Option B: Create a sale transaction (more details):**

```
POST /transactions/sale → { "bill_id": "...", "amount": 25000, "payment_mode": "bank", "utr": "..." }
```

Both update the bill's `paid_amount` and change status:

- `paid_amount < amount` → status stays `"due"`
- `paid_amount = amount` → status changes to `"paid"`
- `paid_amount > amount` → status changes to `"overpaid"`, excess goes to party balance

### Step 7: Handle Returns (Optional)

```
POST /bills/:billId/return → { "return_amount": 5000 }
```

Reduces the bill amount and credits the party balance.

---

## Purchase Flow

For buying items from suppliers:

```
1. POST /purchases → Create purchase (stock auto-increases)
2. POST /purchases/:id/payment → Record payment
   OR
   POST /transactions/purchase → Record with more details
```

Purchases have `purchase_type`: `"GST"` or `"NON_GST"` — stock is added to the matching counter.

---

## Stock Management

| Action                   | gst_stock Change | nongst_stock Change |
| ------------------------ | ---------------- | ------------------- |
| GST challan created      | -quantity        | —                   |
| GST challan deleted      | +quantity        | —                   |
| NON_GST challan created  | —                | — (no deduction)    |
| GST purchase created     | +quantity        | —                   |
| NON_GST purchase created | —                | +quantity           |
| Manual stock update      | Set directly     | Set directly        |

When total stock (`gst_stock + nongst_stock`) drops below `threshold`, a **stock alert** is auto-created. When stock goes back above threshold, it's auto-resolved.

---

## Discount System

5 types of discounts, applied in this priority during challan creation:

| Type            | What it does                                           | Fields used                                                   |
| --------------- | ------------------------------------------------------ | ------------------------------------------------------------- |
| `party_item`    | Special price for Party X on Item Y (highest priority) | party_id, item_id, percent1, percent2, fixed_amount           |
| `item`          | Flat discount on Item Y for everyone                   | item_id, percent1, percent2, fixed_amount                     |
| `party_all`     | Party X gets discount on ALL items                     | party_id, percent1, percent2, fixed_amount                    |
| `item_group`    | Discount on a named group of items                     | item_group_name, item_ids[], percent1, percent2, fixed_amount |
| `profit_margin` | Profit margin tracking (not auto-applied)              | item_id, profit_percent                                       |

**Discount calculation:**

```
price after percent1 = price × (1 - percent1/100)
price after percent2 = above × (1 - percent2/100)
final price = above - fixed_amount
```

---

## Dashboard

### Admin Dashboard (`GET /dashboard`)

Shows overall counts (items, parties, challans, bills for both firms), total revenue (GST + NON_GST), recent challans and bills.

### Firm Dashboard (`GET /dashboard/firm?period=monthly`)

Shows stats for the current firm only:

- Challan count, bill count, total revenue, pending amount
- Transaction count, purchase count, purchase amount
- Monthly revenue chart data

Periods: `monthly` (current month) or `yearly` (current year).

---

## Session Management

- Each login creates a **session** with device info
- Users can see all their active sessions: `GET /auth/sessions`
- Revoke a specific session (logout another device): `DELETE /auth/sessions/:id`
- Revoke all other sessions: `DELETE /auth/sessions`
- Changing password revokes all sessions for that role

---

## Staff Management (Admin Only)

The main user can:

1. Create secondary users: `POST /admin/users`
2. Each staff gets their own GST + NON_GST firm credentials
3. Staff can ONLY do firm login (no admin access)
4. Deactivate/reactivate staff: `POST /admin/users/:id/deactivate`
5. Delete staff: `DELETE /admin/users/:id`

**Key rule:** Only ONE main user exists. Staff are "secondary" type.

---

## Visual Summary

```
┌─────────────────────────────────────────────────────┐
│            MAIN USER (1 per system)                 │
│                                                     │
│  Admin Login     → Staff mgmt, overall dashboard    │
│  GST Firm Login  → Challans, bills, transactions    │
│  NON_GST Login   → Challans, bills, transactions    │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│          SECONDARY USERS (staff, no admin)           │
│                                                     │
│  GST Firm Login  → Same operations, same data       │
│  NON_GST Login   → Same operations, same data       │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│                DAILY WORKFLOW                         │
│                                                     │
│  SETUP:                                             │
│    Items → Parties → Suppliers → Discounts          │
│                                                     │
│  SALES FLOW:                                        │
│    Create Challan (auto-split GST/NON_GST)          │
│         ↓                                           │
│    Convert Challans → Bill                          │
│         ↓                                           │
│    Record Payment → Bill becomes "paid"             │
│                                                     │
│  PURCHASE FLOW:                                     │
│    Create Purchase (stock auto-adds)                │
│         ↓                                           │
│    Record Payment                                   │
│                                                     │
│  MONITORING:                                        │
│    Dashboard · Stock Alerts · Transaction Summary   │
└─────────────────────────────────────────────────────┘
```
