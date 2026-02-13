# Maheshwari Motors — API Reference

> **Base URL:** `https://api-maheshwari-motors.koyeb.app/api/v1`
> **Auth:** All endpoints (except register & login) require `Authorization: Bearer <token>` header.
> **Response format:** Every response is `{ success, message, data }`.

---

## How Authentication Works

There are **2 login types**:

1. **Admin Login** → gives a token with `role: "admin"` — used for user management, dashboard overview
2. **Firm Login** → gives a token with `role: "firm"` and `firm_type: "GST" or "NON_GST"` — used for all daily operations

The server reads the token and automatically knows:
- `req.user` — the User document
- `req.role` — `"admin"` or `"firm"`
- `req.firmType` — `"GST"` or `"NON_GST"` (only when role is firm)
- `req.isGst` — `1` or `0` (only when role is firm)

**No firmId in URLs.** The server uses the token to determine which firm's data to show.

---

## Pagination (applies to all list endpoints)

All list endpoints support these query params:

| Param    | Type   | Default | Description                   |
| -------- | ------ | ------- | ----------------------------- |
| `page`   | number | 1       | Page number                   |
| `limit`  | number | 5       | Items per page (max 10)       |
| `search` | string | —       | Search by name (where applicable) |

Response includes `meta`:
```json
{
  "data": [...],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 5,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## Auth (9 endpoints)

| #  | Method | Endpoint                    | Auth Required | Purpose                            |
| -- | ------ | --------------------------- | ------------- | ---------------------------------- |
| 1  | POST   | `/auth/admin/register`      | No            | One-time main user + admin setup   |
| 2  | POST   | `/auth/admin/login`         | No            | Admin login → token                |
| 3  | POST   | `/auth/firm/login`          | No            | Firm login → token + firm details  |
| 4  | POST   | `/auth/logout`              | Yes           | Logout current session             |
| 5  | GET    | `/auth/me`                  | Yes           | Get current user profile           |
| 6  | PUT    | `/auth/change-password`     | Yes           | Change password for current role   |
| 7  | GET    | `/auth/sessions`            | Yes           | List all active sessions           |
| 8  | DELETE | `/auth/sessions/:sessionId` | Yes           | Revoke a specific session          |
| 9  | DELETE | `/auth/sessions`            | Yes           | Revoke all sessions except current |

### Register Main User
```
POST /auth/admin/register
```
```json
{
  "name": "Maheshwari Motors",
  "email": "owner@example.com",
  "phone": "9876543210",
  "admin": { "username": "admin", "password": "admin123" },
  "gst_firm": {
    "username": "gstfirm", "password": "gst123",
    "name": "MM GST Firm", "phone": "9876543210", "email": "gst@mm.com",
    "address": "123 Main St", "city": "Jaipur", "state": "Rajasthan",
    "GSTIN": "08AAACM1234H1Z5"
  },
  "nongst_firm": {
    "username": "nongstfirm", "password": "nongst123",
    "name": "MM Non-GST Firm", "phone": "9876543210", "email": "nongst@mm.com",
    "address": "123 Main St", "city": "Jaipur", "state": "Rajasthan"
  }
}
```
- Only works **once**. After the main user exists, this will return 409 Conflict.

### Admin Login
```
POST /auth/admin/login
```
```json
{
  "username": "admin",
  "password": "admin123",
  "device_name": "iPhone 15",
  "device_type": "ios"
}
```
**Response:**
```json
{
  "_id": "USER_ID",
  "name": "Maheshwari Motors",
  "email": "owner@example.com",
  "phone": "9876543210",
  "type": "main",
  "is_admin": true,
  "role": "admin",
  "token": "JWT_TOKEN"
}
```

### Firm Login
```
POST /auth/firm/login
```
```json
{
  "username": "gstfirm",
  "password": "gst123",
  "device_name": "Flutter App",
  "device_type": "android"
}
```
**Response:**
```json
{
  "_id": "USER_ID",
  "name": "Maheshwari Motors",
  "type": "main",
  "is_admin": true,
  "role": "firm",
  "firm_data": {
    "firm_type": "GST",
    "name": "MM GST Firm",
    "username": "gstfirm",
    "GSTIN": "08AAACM1234H1Z5",
    "bank_name": "SBI",
    "...": "..."
  },
  "token": "JWT_TOKEN"
}
```

### Change Password
```
PUT /auth/change-password
```
```json
{ "current_password": "old123", "new_password": "new456" }
```
Changes password for the **current role** (admin password or firm password depending on which token you're using).

---

## Admin — User Management (7 endpoints)

> **Requires: Admin token.** Manage secondary users (staff accounts).

| #  | Method | Endpoint                           | Purpose                     |
| -- | ------ | ---------------------------------- | --------------------------- |
| 1  | GET    | `/admin/users`                     | List secondary users        |
| 2  | POST   | `/admin/users`                     | Create secondary user       |
| 3  | GET    | `/admin/users/:userId`             | Get secondary user details  |
| 4  | PUT    | `/admin/users/:userId`             | Update secondary user       |
| 5  | DELETE | `/admin/users/:userId`             | Delete secondary user       |
| 6  | POST   | `/admin/users/:userId/deactivate`  | Deactivate user             |
| 7  | POST   | `/admin/users/:userId/reactivate`  | Reactivate user             |

### Create Secondary User
```
POST /admin/users
```
```json
{
  "name": "Staff One",
  "email": "staff@mm.com",
  "phone": "9123456789",
  "gst_firm": {
    "username": "staff_gst", "password": "pass123",
    "name": "Staff GST", "phone": "9123456789", "email": "staffgst@mm.com",
    "address": "Staff Address", "city": "Jaipur", "state": "Rajasthan"
  },
  "nongst_firm": {
    "username": "staff_nongst", "password": "pass123",
    "name": "Staff Non-GST", "phone": "9123456789", "email": "staffnongst@mm.com",
    "address": "Staff Address", "city": "Jaipur", "state": "Rajasthan"
  }
}
```
- Secondary users have **no admin** credentials — they can only do firm login.

---

## Dashboard (2 endpoints)

| #  | Method | Endpoint          | Auth Required   | Purpose                   |
| -- | ------ | ----------------- | --------------- | ------------------------- |
| 1  | GET    | `/dashboard`      | Any token       | Overall admin dashboard   |
| 2  | GET    | `/dashboard/firm` | Firm token only | Firm-specific dashboard   |

### Admin Dashboard Response
```json
{
  "counts": {
    "items": 50, "parties": 20, "suppliers": 10,
    "gst_challans": 100, "nongst_challans": 80,
    "gst_bills": 90, "nongst_bills": 70
  },
  "revenue": { "gst": 500000, "nongst": 300000 },
  "recent_challans": [...],
  "recent_bills": [...]
}
```

### Firm Dashboard
```
GET /dashboard/firm?period=monthly
```
Periods: `monthly` (default), `yearly`

**Response:**
```json
{
  "period": "monthly",
  "challans": 15,
  "bills": 12,
  "total_revenue": 150000,
  "pending_amount": 25000,
  "transactions": 20,
  "purchases": 5,
  "purchase_amount": 80000,
  "monthly_revenue": [
    { "_id": 1, "total": 50000, "count": 4 },
    { "_id": 2, "total": 100000, "count": 8 }
  ]
}
```

---

## Items (8 endpoints)

> **Shared data** — items belong to the user, visible across both firms.

| #  | Method | Endpoint                  | Purpose                              |
| -- | ------ | ------------------------- | ------------------------------------ |
| 1  | GET    | `/items`                  | List items (`?search=`, pagination)  |
| 2  | POST   | `/items`                  | Create item (multipart/form-data)    |
| 3  | GET    | `/items/low-stock`        | Items below threshold                |
| 4  | GET    | `/items/:itemId`          | Get item details                     |
| 5  | PUT    | `/items/:itemId`          | Update item (multipart/form-data)    |
| 6  | DELETE | `/items/:itemId`          | Delete item                          |
| 7  | PATCH  | `/items/:itemId/stock`    | Manually set stock                   |
| 8  | GET    | `/items/:itemId/discount` | Get discount rules for this item     |

### Create Item (multipart/form-data)
| Field          | Type     | Required | Description                        |
| -------------- | -------- | -------- | ---------------------------------- |
| `item_name`    | string   | Yes      | Item name                          |
| `amount`       | number   | Yes      | MRP / selling price                |
| `threshold`    | number   | No       | Low stock alert level (default 0)  |
| `is_gst`       | 0 or 1   | No       | 1=GST item (default), 0=NON_GST   |
| `gst_stock`    | number   | No       | Initial GST stock                  |
| `nongst_stock` | number   | No       | Initial Non-GST stock              |
| `category_ids` | string[] | No       | Array of category ObjectIds        |
| `supplier_id`  | string   | No       | Supplier ObjectId                  |
| `image`        | file     | No       | Image file (max 5MB, images only)  |

### Update Stock
```
PATCH /items/:itemId/stock
```
```json
{ "gst_stock": 100, "nongst_stock": 50 }
```

---

## Categories (5 endpoints)

> **Shared data.** Simple tags for organizing items.

| #  | Method | Endpoint                  | Purpose            |
| -- | ------ | ------------------------- | ------------------ |
| 1  | GET    | `/categories`             | List categories    |
| 2  | POST   | `/categories`             | Create category    |
| 3  | GET    | `/categories/:categoryId` | Get category       |
| 4  | PUT    | `/categories/:categoryId` | Update category    |
| 5  | DELETE | `/categories/:categoryId` | Delete category    |

```json
{ "name": "Bearings", "description": "Ball bearings and roller bearings" }
```

---

## Suppliers (5 endpoints)

> **Shared data.** Used for purchases.

| #  | Method | Endpoint                  | Purpose            |
| -- | ------ | ------------------------- | ------------------ |
| 1  | GET    | `/suppliers`              | List suppliers     |
| 2  | POST   | `/suppliers`              | Create supplier    |
| 3  | GET    | `/suppliers/:supplierId`  | Get supplier       |
| 4  | PUT    | `/suppliers/:supplierId`  | Update supplier    |
| 5  | DELETE | `/suppliers/:supplierId`  | Delete supplier    |

```json
{
  "name": "ABC Supplier", "phone": "9876543210",
  "email": "abc@supplier.com", "address": "Industrial Area",
  "city": "Delhi", "state": "Delhi", "gstin": "07AAACM1234H1Z5"
}
```

---

## Parties (9 endpoints)

> **Shared data.** Parties = customers. Have a `balance` field.

| #  | Method | Endpoint                     | Purpose                         |
| -- | ------ | ---------------------------- | ------------------------------- |
| 1  | GET    | `/parties`                   | List parties (`?search=`, `?balance_status=due\|overpaid`) |
| 2  | POST   | `/parties`                   | Create party                    |
| 3  | GET    | `/parties/due`               | Parties with dues (balance < 0) |
| 4  | GET    | `/parties/overpaid`          | Parties with overpaid balance   |
| 5  | GET    | `/parties/:partyId`          | Get party details               |
| 6  | PUT    | `/parties/:partyId`          | Update party                    |
| 7  | DELETE | `/parties/:partyId`          | Delete party                    |
| 8  | GET    | `/parties/:partyId/balance`  | Get party balance               |
| 9  | PATCH  | `/parties/:partyId/balance`  | Manually adjust balance         |

### Create Party
```json
{
  "name": "Raj Auto Parts", "phone": "9876543210",
  "email": "raj@auto.com", "address": "Market Road",
  "city": "Jaipur", "state": "Rajasthan", "gstin": "08AAACR1234H1Z5"
}
```

### Adjust Balance
```
PATCH /parties/:partyId/balance
```
```json
{ "amount": 5000, "operation": "add" }
```
`operation`: `"add"` or `"subtract"`

---

## Discounts (7 endpoints)

> **Shared data.** 5 discount types with different fields.

| #  | Method | Endpoint                    | Purpose                        |
| -- | ------ | --------------------------- | ------------------------------ |
| 1  | GET    | `/discounts`                | List discounts (`?type=item`)  |
| 2  | POST   | `/discounts`                | Create discount                |
| 3  | GET    | `/discounts/item/:itemId`   | All discounts for an item      |
| 4  | GET    | `/discounts/party/:partyId` | All discounts for a party      |
| 5  | GET    | `/discounts/:discountId`    | Get discount by ID             |
| 6  | PUT    | `/discounts/:discountId`    | Update discount                |
| 7  | DELETE | `/discounts/:discountId`    | Delete discount                |

### Discount Types & Fields

| Type            | Required Fields                              | Description                         |
| --------------- | -------------------------------------------- | ----------------------------------- |
| `item`          | `item_id`, `percent1`, `percent2`, `fixed_amount` | Flat discount on one item       |
| `party_item`    | `party_id`, `item_id`, `percent1`, `percent2`, `fixed_amount` | Special price for a party on one item |
| `party_all`     | `party_id`, `percent1`, `percent2`, `fixed_amount` | Party gets discount on all items |
| `item_group`    | `item_group_name`, `item_ids[]`, `percent1`, `percent2`, `fixed_amount` | Discount on a group of items |
| `profit_margin` | `item_id`, `profit_percent`                  | Profit margin based                 |

### Example: Create Item Discount
```json
{
  "type": "item",
  "item_id": "ITEM_ID",
  "percent1": 10,
  "percent2": 5,
  "fixed_amount": 0
}
```

---

## Stock Alerts (4 endpoints)

> **Shared data.** Auto-created when stock goes below item's `threshold`.

| #  | Method | Endpoint                         | Purpose                    |
| -- | ------ | -------------------------------- | -------------------------- |
| 1  | GET    | `/stock-alerts`                  | List alerts (`?is_resolved=true\|false`) |
| 2  | GET    | `/stock-alerts/count`            | Count of unresolved alerts |
| 3  | GET    | `/stock-alerts/items`            | Low stock items with alert info |
| 4  | PATCH  | `/stock-alerts/:alertId/resolve` | Mark alert resolved        |

---

## Challans (6 endpoints)

> **Firm-scoped.** Requires firm token. Auto-filtered by `is_gst` from token.

| #  | Method | Endpoint                               | Purpose                              |
| -- | ------ | -------------------------------------- | ------------------------------------ |
| 1  | GET    | `/challans`                            | List challans (unconverted only)     |
| 2  | POST   | `/challans`                            | Create challan (auto-splits items)   |
| 3  | GET    | `/challans/party/:partyId/unconverted` | Unconverted challans for a party     |
| 4  | GET    | `/challans/:challanId`                 | Get challan details                  |
| 5  | PUT    | `/challans/:challanId`                 | Update challan                       |
| 6  | DELETE | `/challans/:challanId`                 | Delete challan (restores stock)      |

### Create Challan
```json
{
  "party_id": "PARTY_ID",
  "date": "2025-01-15",
  "items": [
    { "item_id": "ITEM_1", "quantity": 5, "rate": 1500 },
    { "item_id": "ITEM_2", "quantity": 10, "rate": 200, "discount": 5, "is_gst": 0 }
  ],
  "discount": 2
}
```

**Key behaviors:**
- Items are **auto-split** by `is_gst`. If you send a mix of GST and NON_GST items, the server creates **two linked challans** automatically.
- Item-level `discount` can be manually set, or the server auto-applies from discount rules.
- Challan-level `discount` applies after item discounts.
- Only GST items deduct from `gst_stock`.

Query filters: `?party_id=`, `?from_date=`, `?to_date=`

---

## Bills (8 endpoints)

> **Firm-scoped.** Requires firm token.

| #  | Method | Endpoint                      | Purpose                         |
| -- | ------ | ----------------------------- | ------------------------------- |
| 1  | GET    | `/bills`                      | List bills (filters below)      |
| 2  | POST   | `/bills`                      | Create bill from challans       |
| 3  | GET    | `/bills/status/:status`       | Bills by status (due/paid/overpaid) |
| 4  | GET    | `/bills/party/:partyId`       | Bills for a specific party      |
| 5  | GET    | `/bills/:billId`              | Get bill details                |
| 6  | POST   | `/bills/:billId/payment`      | Quick payment on bill           |
| 7  | POST   | `/bills/:billId/return`       | Handle goods return             |
| 8  | DELETE | `/bills/:billId`              | Delete bill (reverses changes)  |

### Create Bill
```json
{
  "party_id": "PARTY_ID",
  "challan_ids": ["CHALLAN_1", "CHALLAN_2"],
  "apply_balance": false,
  "delivered_amount": 45000
}
```
- `apply_balance`: if `true`, party's existing balance is applied to the bill total
- `delivered_amount`: optional — if set, difference becomes `return_amount`

### Record Payment
```
POST /bills/:billId/payment
```
```json
{ "amount": 25000 }
```
Updates `paid_amount`. Status auto-changes: `due` → `paid` → `overpaid`.

### Handle Return
```
POST /bills/:billId/return
```
```json
{ "return_amount": 5000 }
```
Reduces bill amount, credits party balance.

Query filters: `?party_id=`, `?payment_status=`, `?from_date=`, `?to_date=`

---

## Purchases (6 endpoints)

> **Firm-scoped.** Requires firm token.

| #  | Method | Endpoint                        | Purpose                         |
| -- | ------ | ------------------------------- | ------------------------------- |
| 1  | GET    | `/purchases`                    | List purchases                  |
| 2  | POST   | `/purchases`                    | Create purchase (adds stock)    |
| 3  | GET    | `/purchases/type/:type`         | Filter by type (GST/NON_GST)   |
| 4  | GET    | `/purchases/:purchaseId`        | Get purchase details            |
| 5  | POST   | `/purchases/:purchaseId/payment`| Record payment on purchase      |
| 6  | DELETE | `/purchases/:purchaseId`        | Delete purchase (removes stock) |

### Create Purchase
```json
{
  "supplier_id": "SUPPLIER_ID",
  "purchase_type": "GST",
  "date": "2025-01-15",
  "items": [
    { "item_id": "ITEM_1", "quantity": 100, "rate": 500 },
    { "item_id": "ITEM_2", "quantity": 50, "rate": 200 }
  ]
}
```
- Stock is auto-increased: `GST` adds to `gst_stock`, `NON_GST` adds to `nongst_stock`.

### Record Purchase Payment
```
POST /purchases/:purchaseId/payment
```
```json
{ "amount": 50000 }
```

---

## Transactions (10 endpoints)

> **Firm-scoped.** Requires firm token. Financial records for sales and purchases.

| #  | Method | Endpoint                                  | Purpose                         |
| -- | ------ | ----------------------------------------- | ------------------------------- |
| 1  | GET    | `/transactions`                           | List all transactions           |
| 2  | POST   | `/transactions/sale`                      | Record sale payment             |
| 3  | POST   | `/transactions/purchase`                  | Record purchase payment         |
| 4  | GET    | `/transactions/summary`                   | Get totals and counts           |
| 5  | GET    | `/transactions/type/:type`                | Filter by type (sale/purchase)  |
| 6  | GET    | `/transactions/mode/:mode`                | Filter by mode (cash/bank/credit) |
| 7  | GET    | `/transactions/bill/:billId`              | Transactions for a bill         |
| 8  | GET    | `/transactions/purchase/:purchaseId`      | Transactions for a purchase     |
| 9  | GET    | `/transactions/:transactionId`            | Get transaction details         |
| 10 | DELETE | `/transactions/:transactionId`            | Delete transaction (reverses)   |

### Record Sale Transaction
```json
{
  "bill_id": "BILL_ID",
  "amount": 25000,
  "payment_mode": "bank",
  "utr": "UTR123456",
  "transaction_ref": "REF001",
  "remarks": "Partial payment"
}
```
`payment_mode`: `"cash"`, `"bank"`, `"credit"`

### Record Purchase Transaction
```json
{
  "purchase_id": "PURCHASE_ID",
  "amount": 50000,
  "payment_mode": "cash"
}
```

### Transaction Summary Response
```json
{
  "total_transactions": 50,
  "total_sale_amount": 500000,
  "total_purchase_amount": 300000,
  "sale_transactions": 35,
  "purchase_transactions": 15
}
```

Query filters: `?type=`, `?payment_mode=`, `?from_date=`, `?to_date=`

---

## Quick Count

| Section        | Endpoints |
| -------------- | --------- |
| Auth           | 9         |
| Admin (Users)  | 7         |
| Dashboard      | 2         |
| Items          | 8         |
| Categories     | 5         |
| Suppliers      | 5         |
| Parties        | 9         |
| Discounts      | 7         |
| Stock Alerts   | 4         |
| Challans       | 6         |
| Bills          | 8         |
| Purchases      | 6         |
| Transactions   | 10        |
| **Total**      | **86**    |

---

## Error Response Format

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": ["Item name is required", "Amount must be at least 0"]
}
```

Common status codes: `400` Bad Request, `401` Unauthorized, `403` Forbidden, `404` Not Found, `409` Conflict, `500` Internal Error.
