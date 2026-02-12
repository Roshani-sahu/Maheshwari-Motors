# Maheshwari Motors — Project Flow

## Overview

Maheshwari Motors is an **inventory management system** for an auto-parts business. The business operates with two types of firms — **GST** and **NON_GST** — which are always created as a **pair** under one business name. This allows automatic splitting of challans based on whether items are GST or non-GST.

---

## 1. System Setup (One-Time)

```
Admin registers → Admin logs in → Creates a Firm Pair (GST + NON_GST firms)
```

1. **Admin registers** using `/auth/register` (first time only, or an existing admin creates new admins via `/auth/admin/register`).
2. **Admin logs in** via `/auth/admin/login` — gets a JWT token.
3. **Admin creates a Firm Pair** via `/admin/firm-pairs` — this creates:
   - A **GST firm** (with GSTIN, bank details, etc.)
   - A **NON_GST firm** (simpler, no GSTIN needed)
   - Both firms get **their own login credentials** (username/password)

> After this, daily operations use **Firm Login** — the admin login is only for managing firms and users.

---

## 2. Login Flow

There are **two login modes**:

### Admin Login
```
POST /auth/admin/login  →  { username, password }  →  token (admin access)
```
- Used by the **business owner / super admin**
- Can manage firm pairs, create other admins, manage secondary users
- Has access to everything

### Firm Login
```
POST /auth/firm/login  →  { username, password }  →  token + firm details
```
- Used by **staff / daily operators**
- Each firm (GST / NON_GST) has its own credentials
- Login is scoped to that specific firm
- Used for all day-to-day operations (challans, bills, parties, etc.)

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
| Type | Description |
|------|-------------|
| `item` | Flat discount on a specific item |
| `party_item` | Special discount for a specific party on a specific item |
| `party_all` | Discount for a party on all items |
| `item_group` | Discount for a named group of items |
| `profit_margin` | Profit margin based discount |

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
│                    ADMIN LOGIN                       │
│                                                     │
│  Create Firm Pair ──→ GST Firm + NON_GST Firm       │
│  Create Secondary Users                             │
│  Manage Discounts                                   │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│                   FIRM LOGIN                         │
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
