# Maheshwari Motors — Project Flow

## Overview

Maheshwari Motors is an **inventory management system** for an auto-parts business.

The **main user** (business owner) has **3 credentials**:

1. **Admin credential** — for user management, firm setup, system config
2. **GST Firm credential** — for daily operations on the GST firm
3. **NON_GST Firm credential** — for daily operations on the NON_GST firm

**Secondary users** (staff) only get firm credentials — no admin access.

There is only **ONE admin credential** in the entire project.

---

## 1. Initial Setup (One-Time)

```
Register Admin (one-time) → Admin Login → Create Firm Pair → Done
```

1. **Register admin** — `POST /auth/admin/register` (works ONLY if no admin exists yet)
   - Creates the single admin credential: `username`, `email`, `password`, `name`
2. **Admin logs in** — `POST /auth/admin/login` → gets JWT token
3. **Create Firm Pair** — `POST /admin/firm-pairs`
   - Creates **GST firm** (with GSTIN, bank details, has its own username/password)
   - Creates **NON_GST firm** (simpler, has its own username/password)
   - Both are linked as a pair under one business name

After this, the main user has all 3 credentials ready.

---

## 2. Login Flow

The main user (business owner) has **3 logins**:

### Admin Login (for management only)

```
POST /auth/admin/login  →  { username, password }  →  token (admin access)
```

- Only **one admin** exists in the whole system
- Used for: creating firm pairs, managing secondary users, system config
- NOT used for daily challan/bill operations

### Firm Login (for daily operations)

```
POST /auth/firm/login  →  { username, password }  →  token + firm details
```

- Each firm (GST / NON_GST) has its own username/password
- Login is scoped to that specific firm
- Used for: challans, bills, parties, transactions, purchases
- Both the main user and secondary users use this

### Who gets what?

| User Type | Admin Login | GST Firm Login | NON_GST Firm Login |
| --------- | :---------: | :------------: | :----------------: |
| Main User |     Yes     |      Yes       |        Yes         |
| Secondary |     No      | Assigned only  |   Assigned only    |

### Session Management

- Each login creates a **session** (supports multi-device)
- Users can view active sessions, revoke specific sessions, or revoke all other sessions
- Tokens include `device_name` and `device_type` for identification

---

## 3. Master Data Setup

Before creating challans/bills, set up the master data:

```
Items  →  Parties  →  Suppliers  →  Categories  →  Discounts
```

### Items (Shared Across Firms)

- Create items with `item_name`, `amount` (MRP), `threshold` (low stock alert)
- Each item has an **`is_gst` flag** (1 = GST, 0 = NON_GST) — this determines which firm's challan it goes into
- Items have **separate stock**: `gst_stock` and `nongst_stock`

### Parties (Per Firm)

- Parties (customers) are created **under a specific firm**
- Each party has a **balance** (positive = overpaid, negative = due)
- Party balance auto-updates when bills are created or payments are made

### Suppliers

- Suppliers are shared across the system
- Used for purchase entries

### Categories

- Simple tag system for organizing items

### Discounts (5 Types)

| Type            | Description                                              |
| --------------- | -------------------------------------------------------- |
| `item`          | Flat discount on a specific item                         |
| `party_item`    | Special discount for a specific party on a specific item |
| `party_all`     | Discount for a party on all items                        |
| `item_group`    | Discount for a named group of items                      |
| `profit_margin` | Profit margin based discount                             |

Each discount has 3 columns: `percent1`, `percent2`, `fixed_amount`.

---

## 4. Sales Flow (Challan → Bill → Payment)

This is the **core business flow**:

```
Create Challan  →  Convert to Bill  →  Record Payment  →  Close
```

### Step 1: Create Challan

```
POST /firms/:firmId/challans
Body: { party_id, items: [{ item_id, quantity, rate, is_gst }] }
```

- A challan is a **delivery note** (goods dispatched but not yet billed)
- The system **auto-splits** items by `is_gst`:
  - GST items → GST firm's challan (stock deducted from `gst_stock`)
  - NON_GST items → NON_GST firm's challan (no stock deduction)
- If items are mixed, **two linked challans** are created automatically
- Discounts **auto-apply** from discount rules (can be overridden)

### Step 2: Convert Challan(s) to Bill

```
POST /firms/:firmId/bills
Body: { party_id, challan_ids: [...], apply_balance }
```

- Select one or more **unconverted challans** for a party
- A **bill** is generated with total amount, discounts, etc.
- If `apply_balance: true`, party's existing balance is applied
- Party balance is updated (amount becomes due)

### Step 3: Record Payment

```
POST /firms/:firmId/transactions/sale
Body: { bill_id, amount, payment_mode, utr, remarks }
```

- Create a **transaction** against the bill
- Bill status changes: `due` → `partial` → `paid`
- Party balance is updated accordingly
- Payment modes: `cash`, `bank`, `cheque`, `upi`

### Step 4: Bill Return (Optional)

```
POST /firms/:firmId/bills/:billId/return
Body: { return_amount }
```

- Handle goods returns
- Adjusts bill amount and party balance

---

## 5. Purchase Flow

```
Create Purchase  →  Record Payment
```

### Create Purchase

```
POST /firms/:firmId/purchases
Body: { supplier_id, purchase_type, items: [{ item_id, quantity, rate }] }
```

- Records goods received from a supplier
- `purchase_type`: `GST` or `NON_GST`
- Stock is automatically increased

### Record Purchase Payment

```
POST /firms/:firmId/transactions/purchase
Body: { purchase_id, amount, payment_mode, utr, remarks }
```

---

## 6. Stock Management

- **Automatic**: Stock is adjusted on challan create/delete, purchase create/delete
- **Manual**: Admin can manually set stock via `PATCH /items/:itemId/stock`
- **Alerts**: When stock falls below `threshold`, a **stock alert** is auto-created
- **Low Stock Report**: `GET /items/low-stock` shows all items below threshold

---

## 7. Dashboard & Reports

### Main Dashboard

```
GET /dashboard  →  Overall business summary across all firms
```

### Firm Dashboard

```
GET /firms/:firmId/dashboard?period=all_time
```

- Periods: `today`, `last_month`, `last_year`, `all_time`
- Shows: total sales, total purchases, outstanding dues, top parties, etc.

---

## 8. User Management

### Secondary Users

- Admin can create **secondary users** (staff with limited access)
- Assign specific firms to each user via `PUT /users/:id/firms`
- Secondary users can only access their assigned firms

---

## Visual Flow Summary

```
┌─────────────────────────────────────────────────────┐
│              MAIN USER (3 credentials)              │
│                                                     │
│  [Admin Login]     → Manage firms, users, config    │
│  [GST Firm Login]  → Daily ops (GST challans/bills) │
│  [NON_GST Login]   → Daily ops (NON_GST challans)   │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│           SECONDARY USERS (firm logins only)         │
│                                                     │
│  [GST Firm Login]  → If assigned                    │
│  [NON_GST Login]   → If assigned                    │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│                  DAILY OPERATIONS                     │
│                                                     │
│  Setup: Items → Parties → Suppliers → Discounts     │
│                                                     │
│  Sales:  Challan ──→ Bill ──→ Payment ──→ Done      │
│          (auto-split GST/NON_GST)                   │
│                                                     │
│  Purchase: Purchase Entry ──→ Payment ──→ Done      │
│                                                     │
│  Reports: Dashboard, Low Stock, Transactions        │
└─────────────────────────────────────────────────────┘
```
