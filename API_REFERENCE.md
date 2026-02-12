# Maheshwari Motors — API Reference

> Base URL: `http://localhost:3030/api/v1`
> Auth: All endpoints (except login/register) require `Authorization: Bearer <token>` header.

---

## Auth (11 endpoints)

| #   | Method | Endpoint                    | Purpose                                              |
| --- | ------ | --------------------------- | ---------------------------------------------------- |
| 1   | POST   | `/auth/admin/login`         | Admin login — returns token with full access         |
| 2   | POST   | `/auth/firm/login`          | Firm login — returns token scoped to one firm        |
| 3   | POST   | `/auth/register`            | Register new user (deprecated — use admin register)  |
| 4   | POST   | `/auth/login`               | User login (deprecated — use admin/firm login)       |
| 5   | POST   | `/auth/admin/register`      | One-time admin setup (fails if admin already exists) |
| 6   | GET    | `/auth/me`                  | Get current logged-in user's profile                 |
| 7   | PUT    | `/auth/change-password`     | Change password                                      |
| 8   | POST   | `/auth/logout`              | Logout current session                               |
| 9   | GET    | `/auth/sessions`            | List all active sessions (multi-device)              |
| 10  | DELETE | `/auth/sessions/:sessionId` | Revoke a specific session                            |
| 11  | DELETE | `/auth/sessions`            | Revoke all sessions except current                   |

---

## Admin — Firm Pairs (6 endpoints)

> Requires admin login. These manage the GST + NON_GST firm pair system.

| #   | Method | Endpoint                               | Purpose                                               |
| --- | ------ | -------------------------------------- | ----------------------------------------------------- |
| 1   | POST   | `/admin/firm-pairs`                    | Create a new firm pair (GST + NON_GST firms together) |
| 2   | GET    | `/admin/firm-pairs`                    | List all firm pairs                                   |
| 3   | GET    | `/admin/firm-pairs/:pairId`            | Get one firm pair's details                           |
| 4   | DELETE | `/admin/firm-pairs/:pairId`            | Deactivate a firm pair (soft delete)                  |
| 5   | POST   | `/admin/firm-pairs/:pairId/reactivate` | Reactivate a deactivated pair                         |
| 6   | PUT    | `/admin/firms/:firmId`                 | Update a single firm's details or credentials         |

---

## Users (6 endpoints)

> Manage secondary users (staff). Admin-only.

| #   | Method | Endpoint           | Purpose                  |
| --- | ------ | ------------------ | ------------------------ |
| 1   | GET    | `/users`           | List all secondary users |
| 2   | POST   | `/users`           | Create a secondary user  |
| 3   | GET    | `/users/:id`       | Get user details         |
| 4   | PUT    | `/users/:id`       | Update user info         |
| 5   | PUT    | `/users/:id/firms` | Assign firms to a user   |
| 6   | DELETE | `/users/:id`       | Delete a secondary user  |

---

## Firms (6 endpoints)

| #   | Method | Endpoint         | Purpose                                         |
| --- | ------ | ---------------- | ----------------------------------------------- |
| 1   | GET    | `/firms`         | List all firms                                  |
| 2   | POST   | `/firms`         | Create a firm (prefer using firm-pairs instead) |
| 3   | GET    | `/firms/:firmId` | Get firm details                                |
| 4   | PUT    | `/firms/:firmId` | Update firm details                             |
| 5   | DELETE | `/firms/:firmId` | Delete a firm                                   |

---

## Dashboard (2 endpoints)

| #   | Method | Endpoint                   | Purpose                                                                             |
| --- | ------ | -------------------------- | ----------------------------------------------------------------------------------- |
| 1   | GET    | `/dashboard`               | Overall business summary across all firms                                           |
| 2   | GET    | `/firms/:firmId/dashboard` | Firm-specific dashboard (supports `?period=today\|last_month\|last_year\|all_time`) |

---

## Items (8 endpoints)

> Items are shared across all firms. Each item has `is_gst`, `gst_stock`, `nongst_stock`.

| #   | Method | Endpoint                  | Purpose                                                                 |
| --- | ------ | ------------------------- | ----------------------------------------------------------------------- |
| 1   | GET    | `/items`                  | List all items (supports `?search=` & pagination)                       |
| 2   | POST   | `/items`                  | Create new item (formdata: item_name, amount, threshold, is_gst, image) |
| 3   | GET    | `/items/:itemId`          | Get item details                                                        |
| 4   | PUT    | `/items/:itemId`          | Update item                                                             |
| 5   | PATCH  | `/items/:itemId/stock`    | Manually set stock (`{ gst_stock, nongst_stock }`)                      |
| 6   | GET    | `/items/low-stock`        | Get all items below their threshold                                     |
| 7   | GET    | `/items/:itemId/discount` | Get discount rules for an item                                          |
| 8   | DELETE | `/items/:itemId`          | Delete item                                                             |

---

## Suppliers (5 endpoints)

| #   | Method | Endpoint         | Purpose              |
| --- | ------ | ---------------- | -------------------- |
| 1   | GET    | `/suppliers`     | List all suppliers   |
| 2   | POST   | `/suppliers`     | Create supplier      |
| 3   | GET    | `/suppliers/:id` | Get supplier details |
| 4   | PUT    | `/suppliers/:id` | Update supplier      |
| 5   | DELETE | `/suppliers/:id` | Delete supplier      |

---

## Categories (5 endpoints)

| #   | Method | Endpoint          | Purpose              |
| --- | ------ | ----------------- | -------------------- |
| 1   | GET    | `/categories`     | List all categories  |
| 2   | POST   | `/categories`     | Create category      |
| 3   | GET    | `/categories/:id` | Get category details |
| 4   | PUT    | `/categories/:id` | Update category      |
| 5   | DELETE | `/categories/:id` | Delete category      |

---

## Discounts (8 endpoints)

> 5 types: `item`, `party_item`, `party_all`, `item_group`, `profit_margin`
> 3 discount columns: `percent1`, `percent2`, `fixed_amount`

| #   | Method | Endpoint                    | Purpose                                        |
| --- | ------ | --------------------------- | ---------------------------------------------- |
| 1   | GET    | `/discounts`                | List all discount rules (filter: `?type=item`) |
| 2   | POST   | `/discounts`                | Create a discount rule                         |
| 3   | GET    | `/discounts/:id`            | Get discount by ID                             |
| 4   | PUT    | `/discounts/:id`            | Update a discount rule                         |
| 5   | DELETE | `/discounts/:id`            | Delete a discount rule                         |
| 6   | GET    | `/discounts/item/:itemId`   | Get all discount rules for a specific item     |
| 7   | GET    | `/discounts/party/:partyId` | Get all discount rules for a specific party    |

---

## Stock Alerts (4 endpoints)

> Auto-created when item stock falls below threshold.

| #   | Method | Endpoint                         | Purpose                                    |
| --- | ------ | -------------------------------- | ------------------------------------------ |
| 1   | GET    | `/stock-alerts`                  | List alerts (filter: `?is_resolved=false`) |
| 2   | GET    | `/stock-alerts/count`            | Get count of unresolved alerts             |
| 3   | GET    | `/stock-alerts/items`            | Get low stock items with alert details     |
| 4   | PATCH  | `/stock-alerts/:alertId/resolve` | Mark alert as resolved                     |

---

## Parties (12 endpoints)

> Parties belong to a specific firm. They are the customers.

| #   | Method | Endpoint                                   | Purpose                           |
| --- | ------ | ------------------------------------------ | --------------------------------- |
| 1   | GET    | `/firms/:firmId/parties`                   | List all parties for a firm       |
| 2   | POST   | `/firms/:firmId/parties`                   | Create a party                    |
| 3   | GET    | `/firms/:firmId/parties/due`               | Get parties with outstanding dues |
| 4   | GET    | `/firms/:firmId/parties/overpaid`          | Get parties with overpaid balance |
| 5   | GET    | `/firms/:firmId/parties/:partyId`          | Get party details                 |
| 6   | PUT    | `/firms/:firmId/parties/:partyId`          | Update party                      |
| 7   | GET    | `/firms/:firmId/parties/:partyId/balance`  | Get party balance                 |
| 8   | PATCH  | `/firms/:firmId/parties/:partyId/balance`  | Manually adjust party balance     |
| 9   | GET    | `/firms/:firmId/parties/:partyId/discount` | Get party's discount rules        |
| 10  | GET    | `/firms/:firmId/parties/:partyId/challans` | Get party's unconverted challans  |
| 11  | GET    | `/firms/:firmId/parties/:partyId/bills`    | Get party's bills                 |
| 12  | DELETE | `/firms/:firmId/parties/:partyId`          | Delete party                      |

---

## Challans (5 endpoints)

> Challans = delivery notes. Items auto-split by `is_gst` into separate challans.

| #   | Method | Endpoint                             | Purpose                                                          |
| --- | ------ | ------------------------------------ | ---------------------------------------------------------------- |
| 1   | GET    | `/firms/:firmId/challans`            | List challans (filter: `?party_id=`, `?from_date=`, `?to_date=`) |
| 2   | POST   | `/firms/:firmId/challans`            | Create challan (auto-splits GST/NON_GST items)                   |
| 3   | GET    | `/firms/:firmId/challans/:challanId` | Get challan details                                              |
| 4   | PUT    | `/firms/:firmId/challans/:challanId` | Update challan                                                   |
| 5   | DELETE | `/firms/:firmId/challans/:challanId` | Delete challan (restores stock)                                  |

**Create Challan body:**

```json
{
  "party_id": "...",
  "items": [{ "item_id": "...", "quantity": 5, "rate": 1500, "is_gst": 1 }]
}
```

---

## Bills (7 endpoints)

> Bill = invoice created from one or more challans.

| #   | Method | Endpoint                               | Purpose                                                           |
| --- | ------ | -------------------------------------- | ----------------------------------------------------------------- |
| 1   | GET    | `/firms/:firmId/bills`                 | List bills (filter: `?party_id=`, `?payment_status=`, date range) |
| 2   | POST   | `/firms/:firmId/bills`                 | Create bill from challans                                         |
| 3   | GET    | `/firms/:firmId/bills/status/:status`  | Get bills by status (`due`, `partial`, `paid`)                    |
| 4   | GET    | `/firms/:firmId/bills/:billId`         | Get bill details                                                  |
| 5   | POST   | `/firms/:firmId/bills/:billId/payment` | Quick payment on a bill                                           |
| 6   | POST   | `/firms/:firmId/bills/:billId/return`  | Handle goods return                                               |
| 7   | DELETE | `/firms/:firmId/bills/:billId`         | Delete bill (reverses party balance)                              |

**Create Bill body:**

```json
{
  "party_id": "...",
  "challan_ids": ["...", "..."],
  "apply_balance": false
}
```

---

## Purchases (6 endpoints)

> Record goods bought from suppliers.

| #   | Method | Endpoint                                       | Purpose                             |
| --- | ------ | ---------------------------------------------- | ----------------------------------- |
| 1   | GET    | `/firms/:firmId/purchases`                     | List purchases                      |
| 2   | POST   | `/firms/:firmId/purchases`                     | Create purchase (increases stock)   |
| 3   | GET    | `/firms/:firmId/purchases/type/:type`          | Get purchases by type (GST/NON_GST) |
| 4   | GET    | `/firms/:firmId/purchases/:purchaseId`         | Get purchase details                |
| 5   | POST   | `/firms/:firmId/purchases/:purchaseId/payment` | Quick payment on purchase           |
| 6   | DELETE | `/firms/:firmId/purchases/:purchaseId`         | Delete purchase (reverses stock)    |

---

## Transactions (10 endpoints)

> Financial transactions — payments for bills or purchases.

| #   | Method | Endpoint                                            | Purpose                                                        |
| --- | ------ | --------------------------------------------------- | -------------------------------------------------------------- |
| 1   | GET    | `/firms/:firmId/transactions`                       | List all transactions (filter: type, payment_mode, date range) |
| 2   | POST   | `/firms/:firmId/transactions/sale`                  | Record payment against a bill                                  |
| 3   | POST   | `/firms/:firmId/transactions/purchase`              | Record payment against a purchase                              |
| 4   | GET    | `/firms/:firmId/transactions/summary`               | Get transaction summary (totals, counts)                       |
| 5   | GET    | `/firms/:firmId/transactions/type/:type`            | Filter by type (`sale`/`purchase`)                             |
| 6   | GET    | `/firms/:firmId/transactions/payment-mode/:mode`    | Filter by mode (`cash`/`bank`/`cheque`/`upi`)                  |
| 7   | GET    | `/firms/:firmId/transactions/:transactionId`        | Get transaction details                                        |
| 8   | DELETE | `/firms/:firmId/transactions/:transactionId`        | Delete transaction (reverses balance)                          |
| 9   | GET    | `/firms/:firmId/bills/:billId/transactions`         | Get all transactions for a bill                                |
| 10  | GET    | `/firms/:firmId/purchases/:purchaseId/transactions` | Get all transactions for a purchase                            |

---

## Quick Count

| Section            | Endpoints |
| ------------------ | --------- |
| Auth               | 11        |
| Admin (Firm Pairs) | 6         |
| Users              | 6         |
| Firms              | 5         |
| Dashboard          | 2         |
| Items              | 8         |
| Suppliers          | 5         |
| Categories         | 5         |
| Discounts          | 7         |
| Stock Alerts       | 4         |
| Parties            | 12        |
| Challans           | 5         |
| Bills              | 7         |
| Purchases          | 6         |
| Transactions       | 10        |
| **Total**          | **99**    |
