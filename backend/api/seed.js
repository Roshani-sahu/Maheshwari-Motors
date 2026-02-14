import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import env from "../src/config/env.js";
import {
  User,
  Session,
  Item,
  StockAlert,
  Challan,
  Bill,
  Transaction,
  Report,
  Brand,
  Party,
  Supplier,
  Category,
  Discount,
  Purchase,
} from "../src/models/index.js";

const SALT = 10;

async function seed() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // ─── 0. CLEAN UP: delete all data & drop stale indexes ───
    const models = [
      User,
      Session,
      Item,
      StockAlert,
      Challan,
      Bill,
      Transaction,
      Report,
      Brand,
      Party,
      Supplier,
      Category,
      Discount,
      Purchase,
    ];
    for (const M of models) {
      await M.deleteMany({});
    }
    console.log("🗑️  Cleared all collections");

    // Drop stale indexes from old schema (e.g. top-level username_1)
    try {
      const usersCol = mongoose.connection.collection("users");
      const indexes = await usersCol.indexes();
      for (const idx of indexes) {
        if (
          idx.name !== "_id_" &&
          !idx.name.includes("gst_firm") &&
          !idx.name.includes("nongst_firm") &&
          !idx.name.includes("admin")
        ) {
          await usersCol.dropIndex(idx.name);
          console.log(`🔧 Dropped stale index: ${idx.name}`);
        }
      }
    } catch (_) {
      /* collection may not exist yet */
    }

    // ─── 1. USER (main) ───
    const hashedPass = await bcrypt.hash("Test@1234", SALT);
    const adminPass = await bcrypt.hash("Admin@1234", SALT);

    const user = await User.create({
      type: "main",
      name: "Ramesh Maheshwari",
      email: "ramesh@maheshwarimotors.com",
      phone: "9876543210",
      gst_firm: {
        username: "seed_gst_firm",
        password: hashedPass,
        name: "Maheshwari Motors GST",
        phone: "9876543210",
        email: "gst@maheshwarimotors.com",
        address: "123 Industrial Area",
        godown_address: "456 Warehouse Lane",
        city: "Indore",
        state: "Madhya Pradesh",
        GSTIN: "23AABCU9603R1ZM",
        CIN: "U29100MP2020PTC012345",
        reg_number: "MP-IND-2020-0001",
        bank_name: "State Bank of India",
        bank_branch: "Indore Main",
        ifsc_code: "SBIN0001234",
        account_number: "12345678901234",
      },
      nongst_firm: {
        username: "seed_nongst_firm",
        password: hashedPass,
        name: "Maheshwari Motors Non-GST",
        phone: "9876543211",
        email: "nongst@maheshwarimotors.com",
        address: "789 Market Road",
        city: "Indore",
        state: "Madhya Pradesh",
      },
      admin: {
        username: "seed_admin",
        password: adminPass,
      },
      is_active: true,
    });
    console.log("✅ User created:", user._id);

    // ─── 2. SECONDARY USER ───
    const secondaryUser = await User.create({
      type: "secondary",
      name: "Suresh Staff",
      email: "suresh@maheshwarimotors.com",
      phone: "9988776655",
      gst_firm: {
        username: "seed_gst_staff",
        password: hashedPass,
        name: "Staff GST Login",
        phone: "9988776655",
        email: "staffgst@maheshwarimotors.com",
        address: "123 Industrial Area",
        city: "Indore",
        state: "Madhya Pradesh",
      },
      nongst_firm: {
        username: "seed_nongst_staff",
        password: hashedPass,
        name: "Staff Non-GST Login",
        phone: "9988776655",
        email: "staffnongst@maheshwarimotors.com",
        address: "789 Market Road",
        city: "Indore",
        state: "Madhya Pradesh",
      },
      is_active: true,
    });
    console.log("✅ Secondary user created:", secondaryUser._id);

    const userId = user._id;

    // ─── 3. SESSION ───
    const token = user.generateFirmToken("GST");
    const session = await Session.create({
      user_id: userId,
      role: "firm",
      firm_type: "GST",
      token,
      device_name: "Seed Script",
      device_type: "desktop",
      ip_address: "127.0.0.1",
    });
    console.log("✅ Session created:", session._id);

    // ─── 4. CATEGORIES ───
    const categories = await Category.insertMany([
      {
        name: "Engine Parts",
        description: "All engine related parts",
        user_id: userId,
      },
      {
        name: "Body Parts",
        description: "Body panels, bumpers, etc.",
        user_id: userId,
      },
      {
        name: "Electrical",
        description: "Wiring, lights, batteries",
        user_id: userId,
      },
      {
        name: "Suspension",
        description: "Shockers, springs, bushes",
        user_id: userId,
      },
      {
        name: "Brakes",
        description: "Brake pads, discs, drums",
        user_id: userId,
      },
    ]);
    console.log("✅ Categories created:", categories.length);

    // ─── 4b. BRANDS ───
    const brands = await Brand.insertMany([
      { name: "Bajaj Genuine", user_id: userId },
      { name: "Honda OEM", user_id: userId },
      { name: "TVS Star City", user_id: userId },
      { name: "Hero Splendor", user_id: userId },
      { name: "Royal Enfield Parts", user_id: userId },
    ]);
    // Link brands to categories
    const brandCategoryMap = [
      [0, 0], // Bajaj Genuine → Engine Parts
      [1, 2], // Honda OEM → Electrical
      [2, 3], // TVS Star City → Suspension
      [3, 4], // Hero Splendor → Brakes
      [4, 1], // Royal Enfield Parts → Body Parts
    ];
    for (const [brandIdx, catIdx] of brandCategoryMap) {
      await Category.findByIdAndUpdate(categories[catIdx]._id, {
        $addToSet: { brand_ids: brands[brandIdx]._id },
      });
    }
    console.log("✅ Brands created:", brands.length);

    // ─── 4c. DISCOUNTS (separate from brands) ───
    const discounts = await Discount.insertMany([
      {
        brand_id: brands[0]._id,
        discount1: { normal: 10, special: 2 },
        discount2: { normal: 8, special: 1 },
        user_id: userId,
      },
      {
        brand_id: brands[1]._id,
        discount1: { normal: 12, special: 3 },
        discount2: { normal: 10, special: 2 },
        user_id: userId,
      },
      {
        brand_id: brands[2]._id,
        discount1: { normal: 8, special: 0 },
        discount2: { normal: 6, special: 0 },
        user_id: userId,
      },
      {
        brand_id: brands[3]._id,
        discount1: { normal: 15, special: 5 },
        discount2: { normal: 12, special: 3 },
        user_id: userId,
      },
      {
        brand_id: brands[4]._id,
        discount1: { normal: 5, special: 0 },
        discount2: { normal: 3, special: 0 },
        user_id: userId,
      },
    ]);
    console.log("✅ Discounts created:", discounts.length);

    // ─── 5. SUPPLIERS ───
    const suppliers = await Supplier.insertMany([
      {
        name: "AutoParts India Pvt Ltd",
        phone: "9111222333",
        email: "sales@autopartsindia.com",
        address: "45 MIDC, Pune",
        city: "Pune",
        state: "Maharashtra",
        gstin: "27AABCA1234B1ZP",
        user_id: userId,
      },
      {
        name: "Bharat Spares",
        phone: "9444555666",
        email: "bharat@spares.com",
        address: "12 Gandhi Nagar",
        city: "Delhi",
        state: "Delhi",
        gstin: "07AABCB5678C1ZQ",
        user_id: userId,
      },
      {
        name: "Royal Auto Components",
        phone: "9777888999",
        email: "royal@autocomp.com",
        address: "78 Industrial Estate",
        city: "Chennai",
        state: "Tamil Nadu",
        user_id: userId,
      },
    ]);
    console.log("✅ Suppliers created:", suppliers.length);

    // ─── 6. PARTIES ───
    const parties = await Party.insertMany([
      {
        name: "Sharma Auto Works",
        phone: "9123456789",
        email: "sharma@autoworks.com",
        address: "100 Vijay Nagar",
        city: "Indore",
        state: "Madhya Pradesh",
        gstin: "23AABCS1234D1ZR",
        balance: 0,
        user_id: userId,
      },
      {
        name: "Patel Garage",
        phone: "9234567890",
        email: "patel@garage.com",
        address: "55 MG Road",
        city: "Bhopal",
        state: "Madhya Pradesh",
        balance: 0,
        user_id: userId,
      },
      {
        name: "Singh Motors",
        phone: "9345678901",
        email: "singh@motors.com",
        address: "22 Station Road",
        city: "Ujjain",
        state: "Madhya Pradesh",
        gstin: "23AABCU7890E1ZS",
        balance: 0,
        user_id: userId,
      },
      {
        name: "Kumar Automobiles",
        phone: "9456789012",
        address: "88 Nehru Nagar",
        city: "Jabalpur",
        state: "Madhya Pradesh",
        balance: 0,
        user_id: userId,
      },
    ]);
    console.log("✅ Parties created:", parties.length);

    // ─── 7. ITEMS ───
    const items = await Item.insertMany([
      {
        item_name: "Piston Assembly (Bajaj Pulsar)",
        amount: 1200,
        purchase_rate: 800,
        threshold: 5,
        gst_stock: 25,
        nongst_stock: 10,
        nongst_sold: 2,
        is_gst: 1,
        user_id: userId,
        brand_id: brands[0]._id,
        supplier_id: suppliers[0]._id,
      },
      {
        item_name: "Headlight Assembly (Honda Activa)",
        amount: 850,
        purchase_rate: 550,
        threshold: 3,
        gst_stock: 15,
        nongst_stock: 8,
        nongst_sold: 1,
        is_gst: 1,
        user_id: userId,
        brand_id: brands[1]._id,
        supplier_id: suppliers[1]._id,
      },
      {
        item_name: "Front Shocker (TVS Apache)",
        amount: 2200,
        purchase_rate: 1500,
        threshold: 4,
        gst_stock: 12,
        nongst_stock: 6,
        nongst_sold: 0,
        is_gst: 1,
        user_id: userId,
        brand_id: brands[2]._id,
        supplier_id: suppliers[0]._id,
      },
      {
        item_name: "Brake Pad Set (Hero Splendor)",
        amount: 350,
        purchase_rate: 200,
        threshold: 10,
        gst_stock: 50,
        nongst_stock: 20,
        nongst_sold: 5,
        is_gst: 1,
        user_id: userId,
        brand_id: brands[3]._id,
        supplier_id: suppliers[2]._id,
      },
      {
        item_name: "Side Panel (Bajaj CT100)",
        amount: 650,
        purchase_rate: 400,
        threshold: 3,
        gst_stock: 8,
        nongst_stock: 4,
        nongst_sold: 0,
        is_gst: 1,
        user_id: userId,
        brand_id: brands[4]._id,
        supplier_id: suppliers[1]._id,
      },
      {
        item_name: "CDI Unit (Royal Enfield)",
        amount: 1800,
        purchase_rate: 1200,
        threshold: 2,
        gst_stock: 6,
        nongst_stock: 3,
        nongst_sold: 1,
        is_gst: 1,
        user_id: userId,
        brand_id: brands[1]._id,
        supplier_id: suppliers[0]._id,
      },
      {
        item_name: "Chain Sprocket Kit (Yamaha FZ)",
        amount: 950,
        purchase_rate: 600,
        threshold: 5,
        gst_stock: 20,
        nongst_stock: 10,
        nongst_sold: 3,
        is_gst: 1,
        user_id: userId,
        brand_id: brands[0]._id,
        supplier_id: suppliers[2]._id,
      },
      {
        item_name: "Battery 12V (Exide)",
        amount: 1400,
        purchase_rate: 950,
        threshold: 3,
        gst_stock: 10,
        nongst_stock: 5,
        nongst_sold: 1,
        is_gst: 1,
        user_id: userId,
        brand_id: brands[1]._id,
        supplier_id: suppliers[1]._id,
      },
    ]);
    // Link items to brands
    for (const item of items) {
      if (item.brand_id) {
        await Brand.findByIdAndUpdate(item.brand_id, {
          $addToSet: { item_ids: item._id },
        });
      }
    }
    console.log("✅ Items created:", items.length);

    // ─── 8. STOCK ALERTS ───
    const stockAlerts = await StockAlert.insertMany([
      {
        item_id: items[0]._id,
        stock_count: 3,
        threshold: 5,
        is_resolved: false,
        user_id: userId,
      },
      {
        item_id: items[5]._id,
        stock_count: 1,
        threshold: 2,
        is_resolved: false,
        user_id: userId,
      },
      {
        item_id: items[3]._id,
        stock_count: 8,
        threshold: 10,
        is_resolved: true,
        user_id: userId,
      },
    ]);
    console.log("✅ Stock alerts created:", stockAlerts.length);

    // ─── 9. CHALLANS (GST) ───
    const challans = await Challan.insertMany([
      {
        challan_no: "GST-CH-001",
        date: new Date("2026-02-01"),
        party_id: parties[0]._id,
        items: [
          {
            item_id: items[0]._id,
            quantity: 2,
            rate: 1200,
            discount: 0,
            gross_amount: 2400,
            amount: 2400,
            is_gst: 1,
          },
          {
            item_id: items[1]._id,
            quantity: 1,
            rate: 850,
            discount: 50,
            gross_amount: 850,
            amount: 800,
            is_gst: 1,
          },
        ],
        gross_total: 3250,
        sub_total: 3200,
        discount: 50,
        amount: 3200,
        converted_to_bill: false,
        is_gst: 1,
        user_id: userId,
      },
      {
        challan_no: "GST-CH-002",
        date: new Date("2026-02-05"),
        party_id: parties[2]._id,
        items: [
          {
            item_id: items[2]._id,
            quantity: 3,
            rate: 2200,
            discount: 200,
            gross_amount: 6600,
            amount: 6400,
            is_gst: 1,
          },
        ],
        gross_total: 6600,
        sub_total: 6400,
        discount: 200,
        amount: 6400,
        converted_to_bill: true,
        is_gst: 1,
        user_id: userId,
      },
      {
        challan_no: "GST-CH-003",
        date: new Date("2026-02-10"),
        party_id: parties[1]._id,
        items: [
          {
            item_id: items[3]._id,
            quantity: 10,
            rate: 350,
            discount: 0,
            gross_amount: 3500,
            amount: 3500,
            is_gst: 1,
          },
          {
            item_id: items[6]._id,
            quantity: 2,
            rate: 950,
            discount: 100,
            gross_amount: 1900,
            amount: 1800,
            is_gst: 1,
          },
        ],
        gross_total: 5400,
        sub_total: 5300,
        discount: 100,
        amount: 5300,
        converted_to_bill: false,
        is_gst: 1,
        user_id: userId,
      },
    ]);
    console.log("✅ Challans created:", challans.length);

    // ─── 10. NON-GST CHALLAN ───
    const nongstChallan = await Challan.create({
      challan_no: "NGST-CH-001",
      date: new Date("2026-02-03"),
      party_id: parties[3]._id,
      items: [
        {
          item_id: items[4]._id,
          quantity: 2,
          rate: 650,
          discount: 0,
          gross_amount: 1300,
          amount: 1300,
          is_gst: 0,
        },
      ],
      gross_total: 1300,
      sub_total: 1300,
      discount: 0,
      amount: 1300,
      converted_to_bill: false,
      is_gst: 0,
      user_id: userId,
    });
    console.log("✅ Non-GST challan created:", nongstChallan._id);

    // ─── 11. BILLS (GST) ───
    const bills = await Bill.insertMany([
      {
        bill_no: "GST-BILL-001",
        date: new Date("2026-02-06"),
        party_id: parties[2]._id,
        amount: 6400,
        paid_amount: 6400,
        return_amount: 0,
        payment_status: "paid",
        challan_ids: [challans[1]._id],
        skip_stock_calculation: false,
        is_gst: 1,
        user_id: userId,
      },
      {
        bill_no: "GST-BILL-002",
        date: new Date("2026-02-12"),
        party_id: parties[0]._id,
        amount: 5000,
        paid_amount: 3000,
        return_amount: 0,
        payment_status: "due",
        challan_ids: [],
        skip_stock_calculation: false,
        is_gst: 1,
        user_id: userId,
      },
      {
        bill_no: "GST-BILL-003",
        date: new Date("2026-02-13"),
        party_id: parties[1]._id,
        amount: 2500,
        paid_amount: 3000,
        return_amount: 500,
        payment_status: "overpaid",
        challan_ids: [],
        skip_stock_calculation: true,
        is_gst: 1,
        user_id: userId,
      },
    ]);
    // Link challan to bill
    await Challan.findByIdAndUpdate(challans[1]._id, { bill_id: bills[0]._id });
    console.log("✅ Bills created:", bills.length);

    // ─── 12. NON-GST BILL ───
    const nongstBill = await Bill.create({
      bill_no: "NGST-BILL-001",
      date: new Date("2026-02-08"),
      party_id: parties[3]._id,
      amount: 1300,
      paid_amount: 500,
      return_amount: 0,
      payment_status: "due",
      challan_ids: [],
      skip_stock_calculation: false,
      is_gst: 0,
      user_id: userId,
    });
    console.log("✅ Non-GST bill created:", nongstBill._id);

    // ─── 13. PURCHASES ───
    const purchases = await Purchase.insertMany([
      {
        purchase_no: "PUR-GST-001",
        date: new Date("2026-01-25"),
        supplier_id: suppliers[0]._id,
        items: [
          { item_id: items[0]._id, quantity: 30, rate: 800, amount: 24000 },
          { item_id: items[2]._id, quantity: 15, rate: 1500, amount: 22500 },
        ],
        purchase_type: "GST",
        amount: 46500,
        payment_status: "paid",
        paid_amount: 46500,
        user_id: userId,
      },
      {
        purchase_no: "PUR-GST-002",
        date: new Date("2026-02-01"),
        supplier_id: suppliers[1]._id,
        items: [
          { item_id: items[1]._id, quantity: 20, rate: 550, amount: 11000 },
          { item_id: items[4]._id, quantity: 10, rate: 400, amount: 4000 },
        ],
        purchase_type: "GST",
        amount: 15000,
        payment_status: "due",
        paid_amount: 10000,
        user_id: userId,
      },
      {
        purchase_no: "PUR-NGST-001",
        date: new Date("2026-02-05"),
        supplier_id: suppliers[2]._id,
        items: [
          { item_id: items[3]._id, quantity: 50, rate: 200, amount: 10000 },
          { item_id: items[6]._id, quantity: 25, rate: 600, amount: 15000 },
        ],
        purchase_type: "NON_GST",
        amount: 25000,
        payment_status: "paid",
        paid_amount: 25000,
        user_id: userId,
      },
    ]);
    console.log("✅ Purchases created:", purchases.length);

    // ─── 14. TRANSACTIONS ───
    const transactions = await Transaction.insertMany([
      // Sale payment for GST-BILL-001
      {
        type: "sale",
        party_id: parties[2]._id,
        bill_id: bills[0]._id,
        amount: 6400,
        payment_mode: "bank",
        utr: "UTR2026020601",
        transaction_ref: "TXN-S-001",
        remarks: "Full payment for GST-BILL-001",
        is_gst: 1,
        user_id: userId,
      },
      // Partial sale payment for GST-BILL-002
      {
        type: "sale",
        party_id: parties[0]._id,
        bill_id: bills[1]._id,
        amount: 3000,
        payment_mode: "cash",
        transaction_ref: "TXN-S-002",
        remarks: "Partial payment",
        is_gst: 1,
        user_id: userId,
      },
      // Overpayment for GST-BILL-003
      {
        type: "sale",
        party_id: parties[1]._id,
        bill_id: bills[2]._id,
        amount: 3000,
        payment_mode: "bank",
        utr: "UTR2026021301",
        transaction_ref: "TXN-S-003",
        remarks: "Overpaid by 500",
        is_gst: 1,
        user_id: userId,
      },
      // Purchase payment - full
      {
        type: "purchase",
        supplier_id: suppliers[0]._id,
        purchase_id: purchases[0]._id,
        amount: 46500,
        payment_mode: "bank",
        utr: "UTR2026012501",
        transaction_ref: "TXN-P-001",
        remarks: "Full purchase payment to AutoParts India",
        is_gst: 1,
        user_id: userId,
      },
      // Purchase payment - partial
      {
        type: "purchase",
        supplier_id: suppliers[1]._id,
        purchase_id: purchases[1]._id,
        amount: 10000,
        payment_mode: "cash",
        transaction_ref: "TXN-P-002",
        remarks: "Partial payment to Bharat Spares",
        is_gst: 1,
        user_id: userId,
      },
      // Non-GST sale payment
      {
        type: "sale",
        party_id: parties[3]._id,
        bill_id: nongstBill._id,
        amount: 500,
        payment_mode: "cash",
        transaction_ref: "TXN-S-004",
        remarks: "Partial non-gst bill payment",
        is_gst: 0,
        user_id: userId,
      },
      // Credit transaction
      {
        type: "sale",
        party_id: parties[0]._id,
        amount: 1500,
        payment_mode: "credit",
        transaction_ref: "TXN-S-005",
        remarks: "Credit sale to Sharma Auto",
        is_gst: 1,
        user_id: userId,
      },
    ]);
    console.log("✅ Transactions created:", transactions.length);

    // ─── 16. REPORTS ───
    const reports = await Report.insertMany([
      {
        pdf_link: "https://example.com/reports/challan-report-feb2026.pdf",
        date_created: new Date("2026-02-10"),
        user_id: userId,
        is_gst: 1,
        report_type: "challan",
      },
      {
        pdf_link: "https://example.com/reports/bill-report-feb2026.pdf",
        date_created: new Date("2026-02-12"),
        user_id: userId,
        is_gst: 1,
        report_type: "bill",
      },
      {
        pdf_link: "https://example.com/reports/inventory-feb2026.pdf",
        date_created: new Date("2026-02-13"),
        user_id: userId,
        is_gst: 0,
        report_type: "inventory",
      },
    ]);
    console.log("✅ Reports created:", reports.length);

    // ─── SUMMARY ───
    console.log("\n========== SEED COMPLETE ==========");
    console.log("Users:        2 (1 main + 1 secondary)");
    console.log("Sessions:     1");
    console.log("Categories:   5");
    console.log("Brands:       5");
    console.log("Suppliers:    3");
    console.log("Parties:      4");
    console.log("Items:        8");
    console.log("Stock Alerts: 3");
    console.log("Challans:     4 (3 GST + 1 Non-GST)");
    console.log("Bills:        4 (3 GST + 1 Non-GST)");
    console.log("Purchases:    3 (2 GST + 1 Non-GST)");
    console.log("Transactions: 7");
    console.log("Reports:      3");
    console.log("===================================");
    console.log("\n🔑 LOGIN CREDENTIALS:");
    console.log("Admin    → username: seed_admin      | password: Admin@1234");
    console.log("GST Firm → username: seed_gst_firm   | password: Test@1234");
    console.log("Non-GST  → username: seed_nongst_firm| password: Test@1234");
    console.log("Staff GST→ username: seed_gst_staff  | password: Test@1234");
    console.log("===================================\n");
  } catch (err) {
    console.error("❌ Seed failed:", err.message || err);
    if (err.code === 11000) {
      console.error(
        "Duplicate key — seed data may already exist. Drop or clean the collections first.",
      );
    }
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
  }
}

seed();
