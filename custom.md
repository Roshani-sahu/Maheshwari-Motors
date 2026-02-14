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

# ------------------------------------------------

(0:00:00) The main concept is non-JLC, GSC, which was different. The discount structure is different. The challenge concept is different.
(0:00:20) We will talk about the whole thing and then we will add further. That concept is zero. That concept is not further. First of all, we are working on the product. Then we will talk about the product of LinkedIn. That's why we are working on our flow. Okay. That's why we are talking about coding. If you are talking about the product, I have three columns. Okay, sir. You have three columns.
(0:00:44) First percentage, second percentage and third percentage. Some amount. Some amount, okay. Yes. Okay, so this is the idea that you have to discount party-wise, and party-wise also discount item-wise. Any party has to discount all items, group-wise. That is the first action. The other option is that you have to go to the last sell.
(0:01:14) And the third option is to select that I have a purchase rate for 100 rupees and 2% of profit and sell me. That is the third option. You should have a discount option in these three structures. Okay sir. So if you are working on it, you call for the third day. Every day I call, that will go. But when you are working on it,
(0:01:39) If you do that, it will be better. However, there is inventory flow. The inventory flow is the same as it works. Yes, sir. And the other thing is, you told me that in three databases, one is non-GST, one is GST and one is one. Yes, sir. Yes, sir. Yes, sir. But now, let me believe that I have logged in to GST. Now, I will be back up, then it will be GST database. It will be the stock, whatever it will be.
(0:02:09) You have logged in your company, but I have given your users that they can see the auto firms. Sir, you can see the three options here. The one who is right will be able to see it. But you don't understand. In the database, there is a place where you have rights. You have not given rights, but there is a place where it is on the page. Absolutely, sir. So, you can do that directly? It's like a team form.
(0:02:35) It's about user access.
(0:03:08) Okay. Our team will listen to the call. Yes sir. I will listen to the call. Exactly, I will say. But I would like to use the username and password. Why? I will also be an administrator. You are an administrator. I am an administrator. My password has been written. My password has been written. That's good. The base is that I will leave the username and password. If you add the username and password, then the password will open.
(0:03:38) And the user name or password will not be added. The other one will be added to the GST, then the GST will open. So, both of them will be added to the login. Yes. So, I understood that one is GST and non-GST. Exactly. So, I will give you two login. Yes, I will give you two login and we will combine them somewhere else. Yes, okay.
(0:04:01) I mean, based on India, what you are seeing on this channel, this will come first and the login credentials will come later. Okay? And this will be the source of the data. It will be the source of the concept. Sir, I will show you both. No, no, no, no. Okay, okay. You have done this. I will show you both. No, no, he is asking you. No, no, no. Listen to me. Wow.
(0:04:31) I was using this way, that there is a data in the source. That means that the entry I made in GST, purchased in GST or in the source. So GST and source of combination is source. It is a merge. It is a merge in the other and the third form. It doesn't have to take it from physical stock.
(0:04:58) Now, if I open a physical stock, if I open it for physical stock, I have thought of this option. Whenever I sell, or whenever I purchase, I will give this option that if I have done this, I won't have to take it from physical stock. Okay. Sir, we put this stock in a different way. We put this stock in a different way.
(0:05:27) Look, I have an example. Yes sir, tell me. If I had 100 items in the GST firm in the GST firm. Okay. So what happened to my physical? 100. Okay. Now I have sold it in the non-GST. Okay. 100 sold out. Where did it? Non-GST. So how much my physical stock happened? Zero. Zero.
(0:05:56) Okay, but my logical stock is 100. GST stock. Yes, I understand. Exactly. How can I buy this? Yes, I understand. We will convert it into virtual stock. We will shift it into virtual stock. Okay. Because the stock is finished, but we have it. Yes, we have it. Yes, I understand. Then you can use it. Okay.
(0:06:26) Yes, I can sell it. If I sell it, I can sell it. Yes, I can sell it. Yes, I can sell it. Yes, I mean you can sell it. Exactly. When I make a bill, when I make a stock minus, it will be minus 100. Right. So, I have to give an option that I don't have any calculation with that stock. Okay. So, sir, I have to steal it. Do you know?
(0:06:56) I thought I was going to go out. But if you manage it, it's different. You can do something like this before you think about it. That if people buy a secret key, then there won't be a stock calculation in this stock. You can do something like this before you think about it. We can do something like this. We can manage it 100% sir. We can manage it completely. Yes, then we can go out of it. It will be confusing.
(0:07:26) Actually, I'm doing this right now, but in the future, I don't have to think about it. I can think about it. It's more difficult to understand people. That's right, sir. That's why I want to keep non-GST and GST firm in this way. Sir, I want to take a deep discussion from the whole team. Sir, I want to connect with you tomorrow night or tomorrow. I want to make a solution for me.
(0:07:50) I will present them in front of you. Then we will discuss them and we can do better. Okay, done. Another, if you are creating a master or going on a master, then you have to waste 10 minutes, but then you have to study all the time. No, sir, I will call myself. I have told myself that I will connect to my master for a second, which I have lost in all of them. Yes, sir. Every master has a job. Every master has done it.
(0:08:21) foreign foreign foreign foreign
(0:08:40) How do we do this? How do we do this? How do we do this work? 50-60% of our employees have done it. Now, we are talking about discount and master and our GST management. I will apply it on the app and we will start working on the app. And the other thing, I would like to ask you about the GST number and the data has already been captured. Is there an option for us? GST is the name of the company?
(0:09:06) No, you are like Vyapar, BZ, many software. If you have a software in your name, you are like GST number, the party will already get all the details. Yes, sir, you have to purchase API. Okay, so you have to say that. I will tell you the API pricing. Okay. Okay, sir. Okay, sir. Okay, sir. Okay, sir. Okay, sir. Okay, sir.
(0:09:36) Hello? I was talking about the first time I was talking about the first time, so I can't say anything. I need to start the first time. No, sir, it's true. Sir, we are making this recording and our show. I have understood your story. You will be honest with yourself. You will have 50% of it. But until I start, I will not be able to think about it.
(0:10:00) सार में इतना बताया भी इतना तो इतना तम कल पर सो तक तो दे दोगे ना बना ने ने ने मोग कल पर से मीटिंग करूँगा कि इस तरीक से कर लें क्या तो इसके लॉजिक बनाने पड़ेंगे इसके इसके बहुत बड़ी चीज है इसके लॉजिक बनाने पड़ेंगे इसके ब
(0:10:27) तो सब्सक्राइब पूछ लो और उसके वाद उसके काम करना स्टार्ट करो ठीक है सरा मुझे कल श्राम तक का टाइम दो मैं तीम की सब्सक्राइब करके आपन कल श्राम करना स्टार्ट कर देता है क्योंकि क्योंकि काम इसको इसको काम स्टार्ट करना है तो समय देना बात को त
(0:10:54) सब जाके मुझे पर डे की कोई भी जो भी प्रॉब्लम्स होगी वह दिखने चालो होगी सब्सक्राइब बिल्कुत सब्सक्राइब तो तो तो तो तो मुझे बता दो जी सर कल शाम को इस टाइम हो पाया तो अपने मीटिंग करते हैं और अपने बेंस्टॉंग कर लेते हैं उस

# ------------------------------------------------

Discount – 3 column

%   2. %   3. Amount

• Discount:

item wise: every item has their own dis

item group wise: group multiple items & apply dis on that group

purchase rate hai → use % of profit like sell karna!

• Every firm have their unique credentials
• Unique admin creds → user management
• GST + Privat = Privat
when I sell → I tick an option in bill then it won’t have any affect in physical stock

every user will have only 2 firms: GST & NON-GST

this project is getting too confusing omg... do you get what he wants?

He wants strictly 2 firms per user (GST & NONGST) and credentials will be of firms and not users anymore. also there will be a credentials for admin too who will have access to user management.

update the backend and write me a md file in easiest and simplest words for my frontend developers for them to understand the project

# ------------------------------------------------

stock management:

- items purchased from nongst supplier dont add on in stock, it is only sold

# ------------------------------------------------

User {
type: "secondary" (enum ["main", "secondary"])
common firm data,
stock = 0,
gst_firm {
credentials: {username, password}
data: {challans, bills, items, transactions}
},
non_gst_firm {
credentials: {username, password}
data: {challans, bills, items, transactions}
},
admin: null
}

User {
type: "main" (enum ["main", "secondary"])
common firm data,
stock = 0,
gst_firm {
credentials: {username, password}
data: {challans, bills, items, transactions}
},
non_gst_firm {
credentials: {username, password}
data: {challans, bills, items, transactions}
},
admin: {
credentials: {username, password}
}
}

login as gst firm sends: {
is_admin: true/false
common firm data,
firm_data: {gst firm data}
token:
// and rest other necessary things
}

login as non-gst firm sends: {
is_admin: true/false
common firm data,
firm_data: {non-gst firm data}
token
// and rest other necessary things
}

login as admin sends {
is_admin: true/false,
token:
// and rest other necessary things which I dont think is any more
}

# ------------------------------------------------

ui flow in frontend:
login > if logged in as gst/nongst firm > dashboard (containing all things)
login > if logged in as admin > user management screen only with nothing else to create/edit/delete any credentials

# ------------------------------------------------

DATA SEPERATION:
common:

- items (view & manage)
- category (view & manage)
- supplier (view & manage)
- create challans // (challans can be created for gst or nongst (there will be a dropdown in every item in challans [0, 1] 0 for nongst and 1 for gst) that 0 or 1 will decide which items will go in the gst challan and which ones will go in nongst challan. so technically user created one challan and mixed gst and nongst items in it and as he presses save challan button in frontend > frontend will send all items and other details to backend > backend seperates items with 0 and 1 > creates 2 challans and saves as: [if 0 then save in nongst_firm data else if 1 then save in gst firm data])

gst firm data:

- gst transactions
- gst challans
- gst bills
- gst reports

nongst firm data:

- nongst transactions
- nongst challans
- nongst bills
- nongst reports

so to optimize my idea is to create 3 collections and add reference in each other:

- USER
- FIRM
- ADMIN

relation:

```json
USER {
   data: { // common data
      items, categories, suppliers, etc
   }
   gst_firm: ObjectId of FIRM
   nongst_firm: ObjectId of FIRM
   admin: ObjectId of ADMIN
}

FIRM {
   type: "1" or "0" (1 for gst & 0 for nongst)
   credentials: {username, password}
   firm_info: {name, phone, address, godown address, city, state, reg no, cin, bank name, ifsc code, email, account no}
   data: {challans, bills, items, transactions}
   user: ObjectId of USER
}

ADMIN {
   credentials: {username, password}
   user: ObjectId of USER
}
```

# ------------------------------------------------

```json
User {
   \_id,
   type: "secondary" (enum ["main", "secondary"]),
   data: { // common data
      items, categories, suppliers, etc
   },
   stock = 0,
   gst_firm {
      credentials: {username, password}
      firm_info: {name, phone, address, godown address, city, state, reg no, cin, bank name, ifsc code, email, account no, gstin}
      data: {challans, bills, items, transactions}
   },
   non_gst_firm {
      credentials: {username, password}
      firm_info: {name, phone, address, godown address, city, state, reg no, cin, bank name, ifsc code, email, account no}
      data: {challans, bills, items, transactions}
   },
   admin: {username, password} or null
}
```

# ------------------------------------------------

Category1

- Brand1 {discount1: {normal: 0%, special: 0%}, discount2: {normal: 0%, special: 0%}}
- - Brand1's item1
- - Brand1's item2
- - Brand1's item3

- Brand2 {discount1: {normal: 0%, special: 0%}, discount2: {normal: 0%, special: 0%}}
- - Brand2's item1
- - Brand2's item2
- - Brand2's item3
- - Brand2's item4

Category2

- Brand1 {discount1: {normal: 0%, special: 0%}, discount2: {normal: 0%, special: 0%}}
- - Brand1's item1
- - Brand1's item2
- - Brand1's item3

- Brand2 {discount1: {normal: 0%, special: 0%}, discount2: {normal: 0%, special: 0%}}
- - Brand2's item1
- - Brand2's item2
- - Brand2's item3
- - Brand2's item4

in collection:

```json
   CATEGORY {
   ObjectId[] of BRAND
   ...
}

BRAND {
   ObjectId[] of ITEM,
   discounts: {discount1: {normal: 0%, special: 0%}, discount2: {normal: 0%, special: 0%}}
   ...
}

ITEM {...}
```

# ------------------------------------------------

```json
{
   type: 0 or 1, (1 = gst, 0 = nongst),
   items: ObjectId[] of ITEM,
}
```

item will have fields, modified by frontend at the time of challan creation:
item id, type, pcs, discount amount
as per this image: D:\Projects\flutter_projects\ROYAL\maheshwari-motors\Challan.jpg

# ------------------------------------------------

frontend sends:  

API - /add category / update

```json
{
  "category_name": "",
  "brands": [] // list of BRAND object IDs
}
```

API - /add brand / update

```json
{
  "brand_name": "",
  "items": [] // list of ITEM object IDs
}
```

API - /add discount / update

```json
{
  "brand_id": "", // BRAND object ID
  "discount1": { "normal": 2, "special": 0 },
  "discount2": { "normal": 3, "special": 0 }
}
```

```json
API - /delete category
{ "category_id": ""} // CATEGORY object ID

API - /delete brand
{ "brand_id": ""} // BRAND object ID
```
