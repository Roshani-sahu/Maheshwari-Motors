this project is basically a multi user inventory management system.
the client wants us to implement these features:

# ------------------------------------------------

Firms
GST and Non-GST
Stock list
Filter: All, GST, Non-GST
If purchase from Non-GST then can’t be sold via GST
GST purchase can be sold in Non-GST
Inventory
GST (0), Non-GST (1)
Stock schema
Stock list (which stock sold to whom)
Customer list (jisko sell kara hai)
All billing tables (management)
Discount → Per party or item-wise
Challan → Add item
1 = GST
0 = Non-GST (per item)
If 0 then GST = 0/-
Challans are saved in DB per product
Billing is weekly or manually posted
All items are taken from challan and bill is created company-wise or customer-wise
Create bill button (select parties)
Challan deleted and converted to bill
Purchase return → Payment return
Items returned and added to stock
Prepaid amount is deducted from next bill (show option on side of bill)
Every client will have credit and debit
Enter details of parties prior (easy switch between old software to new software)
GST + Non-GST will have different bank transactions, everything will be same
(purchase, cash, bank, credit modes)
Platform may have multiple users managing their own business inventory
They are editable by our client

# ------------------------------------------------

there are users:

# Maheshwari motors (MM) (my client) and other users

MM will manage username and password of the other users.
every user will have these functionalities (MM is also a user but will have one additional functionality which none other user will have that is manage password and username of other users. we call MM the 'main' user and others 'secondary' user to differentiate):

- manage their own inventory in the project
- have a dashboard where we will show all the summary
- manage their own firms (a user can have multiple firms eg. 'GST/NON_GST' or multiple)
- every user can have multiple firms (the user's company)
- every user will have multiple parties (the companys which user's firm will sell items to)
- users can add and manage items (items will also have 1 image)
- create challans which are store in db. later either weekly, monthly or manually multiple challans can be converted to bills. once a challan is converted to bill, its detail will only be shown in bill and not anymore in the challan table. it will exist in challan db but wont be visible to user. This is only to optimize the db to store challan in challan db and store the list of challan \_id's in the bills.

flow:

- user will auth using username and password (MM password will be set manually in db, and secondary user's credentials will be managed by MM).
- rest is mentioned above and in screenshot I attached.

tech stack of backend:

- Nodejs
- Expressjs
- MongoDB for all data (make it optimized without negotiating features)
- aws s3 for images to store

rest you already know the schema I made, dont addon anything from your side blindly, ask me everything which you want to re-assure, we need to exactly match client requirements
every user will maintain 2 firms (GST, NON_GST)

# !! IMPORTANT !!

there is one major scene in this project which is the core of this project.
if the user sell any product to any party in nongst bill, the stock will not have any deduction in the items of that specific bill. the client wants that if he sells items in nongst firm, there will be no deduction from physical stock but if he sells from gst firm, the stock will deduct. so there will be 2 values, one stored in gst firm and one in nongst firm to check how much stock of each item is sold (logically deducted but not physically) and gst firm will sell items based on physical stock while nongst on logical stock.
this is confusing but he wants to hide the black sales and convert it into white indirectly. and this is the MVP of the product

# ------------------------------------------------

clarifying questions:

1. Users & Firms:
   You mentioned "every user will maintain 2 firms (GST, NON_GST)" but also said "multiple firms". Is it exactly 2 firms per user always, or can they have more?

2. Items & Stock:
   Are items global per user, or are they firm-specific? For example, if a user has "Engine Oil" item, can it be sold via both GST and NON_GST firm?
   For stock tracking, is the stock_count at item level (global) or do we need separate stock per firm? Is there a purchase flow where users add stock (from suppliers), or do they just manually update stock_count?

3. Challans & GST Rules:
   In challan, does each item have its own GST flag (1=GST, 0=Non-GST), or does the whole challan belong to GST or NON_GST firm?
   The rule "If purchase from Non-GST then can't be sold via GST" - does this mean we need to track purchase source for each stock unit?

4. Party Credit/Debit:
   Credit = Amount party owes to firm (unpaid bills)?
   Debit = Advance payment / prepaid amount party has given?

5. Transactions:
   Is the Transaction model for:
   Only payments received from parties?
   Or all types (sale, purchase, refund, advance)?
   What are the payment modes exactly? (cash, bank, credit - any others?)

6. Challan → Bill Conversion:
   When converting challans to bill, is the bill amount simply sum of challan amounts, or are there adjustments (discounts, prepaid deduction)?
   Does the bill store the individual items or just references to challan IDs?

7. Party vs Company:
   In the current schema, I created both Party (customers you sell to) and Company. Are these the same thing, or is "Company" something different (like a supplier)?

8. Dashboard "Total firms (today, monthly, all)":
   Firms are static entities. Did you mean total challans/bills for today/monthly/all?

9. Stock Alerts:
   Should stock alerts be auto-generated when stock goes below threshold, or is it just a query-based report?

10. Image Storage: Confirm: 1 image per item, stored in AWS S3. Should I implement the S3 upload flow now?

# ------------------------------------------------

1. for now 2 firms
2. items are global to user and they can choose if they want to sell particular items in which firm. (the challan & bill will be created in name of that selected firm). stock tracking is global. for now just manually update stock_count.
   > a user can sell (or purchase to refill stock) a item either with a gst bill or nongst bill. If this user fills stock with a items bill of gst, then he can sell those items in nongst or gst bill. but if items are purchased in nongst bill, they can only be sold in nongst challan and nongst bills.
   > so this is basically a inventory management and billing software for our client which he will use for himself and will create challans and bills and track all things, and he wants to connect other users to use the same platform thats why there are multiple users (main is this client MM and other users he connects are secondary).
3. whole challan either belongs to gst or nongst. the "if purchased..." rule I mentioned in above point in detail.
4. Make it like "Overpaid, Due"
5. Transactions are manually entried by the user. he marks if the payment of certain bill is done or not. If the bill is completed (marked by user) it is added to transactions. transactions will be of two types (Sale/Purchase). sale means the items sold by user to party and purchase means the user purchase items from others to refill stock.
6. when challans are converted to bill, the bill will have total calculated amount. Discount will be on per challan so when calculating bill charge, the discounted price of all challans will be added in total. bills will only store references as this makes more sense to me. The client wants to delete challans if bill is generated but my idea is to still store for referencing in bill but dont show it to user in frontend so the user can see which challans were added and what metadata does that challans holds (when created, disc, amt, etc).
7. there are 2 entities for user:
   Party - the one to whome the user will sell items to
   Supplier - the one from whome the user will purchase items to refil stock
8. summaryze most of entries you think is needed to show in dashboard. the frontend developer added (total firms count, total challans created count, total bills created count, count of items on low stock, most recent 10 challans list and most recent 10 bills list).
9. stock alerts will auto generate when stock of any item goes below the threshold amount set to the item while creating. My idea is to check when the item is sold so we dont have to listen or loop it.. so once a item is sold and while deducting the value, we check if the stock went below threshold or not.
10. yes one image per item will be there and is uploaded from frontend at the time of item creation

# ------------------------------------------------

a few things:

1. Auth & Firm Selection Flow:
   After login, user selects a firm. Should I:
   (A) Include firm_id in every API request body/params?
   (B) Store selected firm_id in JWT token (user would need to re-login or call an API to switch firms)?
   (C) Use URL path like /api/v1/firm/:firmId/challans?

2. Main User managing Secondary Users:
   Can main user delete secondary users, or only create/edit?
   Can main user see/access data of secondary users, or just manage their credentials?

3. S3 Image Upload:
   Should I implement complete S3 integration now, or just structure it (you add AWS credentials later)?

4. Stock Deduction on Challan:
   When a challan is created, should stock be automatically deducted?
   Or is stock deduction manual/separate?

5. Purchase Return Flow:
   When items are returned, should I:
   Create a "return" record that references original purchase/bill?
   Or just adjust stock counts?

6. Overpaid Amount (Prepaid):
   "Prepaid amount deducted from next bill" - should this be automatic or manual selection by user?
   Should I track party-level credit/debit balance?

7. Bill Number & Challan Number:
   Should these be auto-generated (sequential per user/firm)?
   Or user enters manually?

8. Reports:
   Are reports just API responses, or do you need actual PDF generation?

# ------------------------------------------------

1. use url path like /api/v1/firm/:firmId/challans
2. main user can either create, edit and delete the secondary users
3. completely integrate the s3, I will simply just add apis to env once I make an account. complete the backend portion 100% so I will just have to add api keys in the end.
4. yes, when challan is created, the stock should be deducted of those selected items and what count of items are being sold to party or purchased from supplier. this process should be automatic.
5. simply just adjust stock counts because the purchase and sale bills will be created by the user manually by filling a form in frontend so the amount he mentioned in the bill will auto add/deduct from the item stock count.
6. If lets say a buyer A buys 10 items costing 100 each and A returns 2 items (or only takes 8 items after paying 1000) so we dont refund them the money, we simply discount them the exact amount of 200 from their next bill of anything 3. it is a website made in react and my role is to do the backend 4. a user will be able to manage their own firms (gst & non gst) and can use this as a billing software 5. auto generated (generally the \_id) also: what if we just maintain a per client amount? lets say they purchase 10 items for 1000 (100 each) and they take only 8 or return 2 so their client_amount = 1000 = 200 (-8 items / 2 refunded) positive means they over paid and negative amount means we need to discount them. Show this entry along with bill amount that this prepaid or due amount is being subracted from the total bill and the user can choose to apply or not apply it in that bill (checkbox) but the user cant delete the prepaid or due amount to trick the party.
7. bill and challan numbers can simply be \_id in mongodb.
8. reports will just be a json data for now, it will be shown visually in the frontend using graphs, etc

# ------------------------------------------------

Discount details:
Discount can be added in 3 types:

1. per item discount
   - means while creating challan, user can decide to give discount to particular items in the challan. Lets say user adds 3 items (X,Y,Z) and chooses to give 5% disc to item X and 3% to item Y and no disc to Z. so the bill generated will be ((total_cost_of_n_X_items - 5%) + (total_cost_of_n_Y_items - 3%) + total_cost_of_n_Z_items)

2. per challan discount
   - means while creating a challan, user can decide to give discount to the whole challan. lets say the challan amount is 1000, and user choose to give a 10% discount to the whole challan then the challan amount will be 900.

3. if the user choose to do both then the final amount will be:
   (((total_cost_of_n_X_items - 5%) + (total_cost_of_n_Y_items - 3%) + total_cost_of_n_Z_items) - 10%)

these discount values will be given from frontend to backend.
