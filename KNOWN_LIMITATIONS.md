# Known Limitations - Requires Additional Work

## 1. AccountMaster - Discount Management

### Issue
The discount add/edit functionality in AccountMaster has a fundamental mismatch:

**Frontend Current State:**
- Uses text inputs for `itemName` and `companyName`
- Sends `amount` field
- Uses `discountType` with values "ITEM"/"COMPANY"

**Backend Requirements:**
- Needs `item_id` (ObjectId) or `party_id` (ObjectId)
- Expects `value` field (not `amount`)
- Expects `type` with values "item"/"party" (lowercase)
- Expects `discount_type` field ("percentage" or "fixed")

### Required Changes
To properly fix this, the following changes are needed:

1. **Fetch Items and Parties**: Load items and parties lists when component mounts
2. **Replace Text Inputs with Dropdowns**: 
   - Replace "Item Name" text input with searchable dropdown of items
   - Replace "Company Name" text input with searchable dropdown of parties
3. **Add Discount Type Selector**: Add radio buttons or dropdown for "percentage" vs "fixed"
4. **Update Field Names**:
   - `amount` → `value`
   - `discountType` → `type` (with lowercase values)
   - Add `discount_type` field

### Temporary Workaround
The discount feature will not work correctly until these changes are implemented. Users should:
- Use the backend API directly for discount management, OR
- Wait for the UI to be updated with proper dropdowns

## 2. Transaction Delete

The transaction delete functionality calls `transactionAPI.delete(id)` but the backend may not have a DELETE endpoint for transactions. This needs verification.

## 3. Dashboard Data Structure

The dashboard component expects specific fields from the backend that may not match exactly. The component has error handling to fail silently, but the data structure should be verified:

Expected fields:
- `totalFirms`
- `todaysChallans`
- `todaysBills`
- `thisMonthBills`
- `lowStockAlerts`
- `recentChallans` (array)
- `recentBills` (array)

## Recommendations

1. **Priority 1**: Fix discount management in AccountMaster (requires dropdown implementation)
2. **Priority 2**: Verify transaction delete endpoint exists
3. **Priority 3**: Verify dashboard API response structure matches frontend expectations

These issues are beyond simple field name fixes and require more substantial refactoring.
