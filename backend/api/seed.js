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
  Counter,
} from "../src/models/index.js";

const SALT = 10;

// ─── Helper: random pick from array ───
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randBetween = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const round2 = (n) => Math.round(n * 100) / 100;

async function seed() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // ─── 0. CLEAN UP ───
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
      Counter,
    ];
    for (const M of models) await M.deleteMany({});
    console.log("🗑️  Cleared all collections");

    // Drop stale indexes
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
    } catch (_) {}

    // ─────────────────────────────────────────────────────────
    //  1. USERS — 1 main + 4 secondary
    // ─────────────────────────────────────────────────────────
    const pw = await bcrypt.hash("Test@1234", SALT);
    const adminPw = await bcrypt.hash("Admin@1234", SALT);
    const staffPw = await bcrypt.hash("Staff@1234", SALT);

    const mainUser = await User.create({
      type: "main",
      name: "Ramesh Maheshwari",
      email: "ramesh@maheshwarimotors.com",
      phone: "9876543210",
      gst_firm: {
        username: "gst_ramesh",
        password: pw,
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
        username: "nongst_ramesh",
        password: pw,
        name: "Maheshwari Motors Non-GST",
        phone: "9876543211",
        email: "nongst@maheshwarimotors.com",
        address: "789 Market Road",
        city: "Indore",
        state: "Madhya Pradesh",
      },
      admin: { username: "admin_ramesh", password: adminPw },
      is_active: true,
    });

    const secondaryUsers = [];
    const staffData = [
      {
        name: "Suresh Verma",
        email: "suresh@maheshwarimotors.com",
        phone: "9988776655",
        gstUser: "gst_suresh",
        nongstUser: "nongst_suresh",
        city: "Indore",
      },
      {
        name: "Priya Sharma",
        email: "priya@maheshwarimotors.com",
        phone: "9871234567",
        gstUser: "gst_priya",
        nongstUser: "nongst_priya",
        city: "Indore",
      },
      {
        name: "Amit Patel",
        email: "amit@maheshwarimotors.com",
        phone: "9765432198",
        gstUser: "gst_amit",
        nongstUser: "nongst_amit",
        city: "Bhopal",
      },
      {
        name: "Deepak Joshi",
        email: "deepak@maheshwarimotors.com",
        phone: "9654321098",
        gstUser: "gst_deepak",
        nongstUser: "nongst_deepak",
        city: "Ujjain",
      },
    ];

    for (const s of staffData) {
      const u = await User.create({
        type: "secondary",
        name: s.name,
        email: s.email,
        phone: s.phone,
        gst_firm: {
          username: s.gstUser,
          password: staffPw,
          name: `${s.name} GST`,
          phone: s.phone,
          email: `${s.gstUser}@staff.com`,
          address: "Staff Office",
          city: s.city,
          state: "Madhya Pradesh",
        },
        nongst_firm: {
          username: s.nongstUser,
          password: staffPw,
          name: `${s.name} Non-GST`,
          phone: s.phone,
          email: `${s.nongstUser}@staff.com`,
          address: "Staff Office",
          city: s.city,
          state: "Madhya Pradesh",
        },
        is_active: true,
      });
      secondaryUsers.push(u);
    }
    console.log("✅ Users created:", 1 + secondaryUsers.length);

    const userId = mainUser._id;

    // ─────────────────────────────────────────────────────────
    //  2. SESSIONS — 3
    // ─────────────────────────────────────────────────────────
    const sessions = [];
    sessions.push(
      await Session.create({
        user_id: userId,
        role: "admin",
        token: mainUser.generateAdminToken(),
        device_name: "Chrome Desktop",
        device_type: "web",
        ip_address: "192.168.1.10",
      }),
    );
    sessions.push(
      await Session.create({
        user_id: userId,
        role: "firm",
        firm_type: "GST",
        token: mainUser.generateFirmToken("GST"),
        device_name: "Shop PC",
        device_type: "desktop",
        ip_address: "192.168.1.20",
      }),
    );
    sessions.push(
      await Session.create({
        user_id: secondaryUsers[0]._id,
        role: "firm",
        firm_type: "GST",
        token: secondaryUsers[0].generateFirmToken("GST"),
        device_name: "Staff Mobile",
        device_type: "android",
        ip_address: "10.0.0.5",
      }),
    );
    console.log("✅ Sessions created:", sessions.length);

    // ─────────────────────────────────────────────────────────
    //  3. CATEGORIES — 10
    // ─────────────────────────────────────────────────────────
    const categoryData = [
      { name: "Engine Parts", description: "Pistons, rings, valves, gaskets" },
      {
        name: "Body Parts",
        description: "Panels, bumpers, fenders, mudguards",
      },
      { name: "Electrical", description: "Wiring, lights, CDI, regulators" },
      {
        name: "Suspension",
        description: "Shockers, springs, bushes, bearings",
      },
      { name: "Brakes", description: "Pads, discs, drums, cables" },
      { name: "Transmission", description: "Chains, sprockets, clutch plates" },
      { name: "Tyres & Tubes", description: "Tyres, tubes, rim tapes" },
      { name: "Fuel System", description: "Carburetors, fuel pumps, filters" },
      { name: "Exhaust", description: "Silencers, gaskets, headers" },
      { name: "Accessories", description: "Mirrors, grips, levers, seats" },
    ];
    const categories = await Category.insertMany(
      categoryData.map((c, i) => ({
        id: i + 1,
        name: c.name,
        description: c.description,
        user_id: userId,
      })),
    );
    console.log("✅ Categories created:", categories.length);

    // ─────────────────────────────────────────────────────────
    //  4. BRANDS — 12
    // ─────────────────────────────────────────────────────────
    const brandNames = [
      "Bajaj Genuine",
      "Honda OEM",
      "TVS Star City",
      "Hero Splendor",
      "Royal Enfield",
      "Yamaha Parts",
      "Suzuki Original",
      "KTM Performance",
      "MRF Tyres",
      "Exide Batteries",
      "Oscar Parts",
      "RR Industries",
    ];
    const brands = await Brand.insertMany(
      brandNames.map((name, i) => ({
        id: i + 1,
        name,
        user_id: userId,
      })),
    );

    // Link brands ↔ categories
    const brandCatLinks = [
      [0, 0],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 1],
      [5, 5],
      [6, 0],
      [7, 7],
      [8, 6],
      [9, 2],
      [10, 8],
      [11, 9],
    ];
    for (const [bIdx, cIdx] of brandCatLinks) {
      await Category.findByIdAndUpdate(categories[cIdx]._id, {
        $addToSet: { brand_ids: brands[bIdx]._id },
      });
    }
    console.log("✅ Brands created:", brands.length);

    // ─────────────────────────────────────────────────────────
    //  5. DISCOUNTS — 12 (one per brand)
    // ─────────────────────────────────────────────────────────
    const discounts = await Discount.insertMany(
      brands.map((b, i) => ({
        id: i + 1,
        brand_id: b._id,
        discount1: { normal: randBetween(5, 20), special: randBetween(0, 5) },
        discount2: { normal: randBetween(3, 15), special: randBetween(0, 3) },
        user_id: userId,
      })),
    );
    console.log("✅ Discounts created:", discounts.length);

    // ─────────────────────────────────────────────────────────
    //  6. SUPPLIERS — 8
    // ─────────────────────────────────────────────────────────
    const supplierData = [
      {
        name: "AutoParts India Pvt Ltd",
        phone: "9111222333",
        city: "Pune",
        state: "Maharashtra",
        gstin: "27AABCA1234B1ZP",
      },
      {
        name: "Bharat Spares",
        phone: "9444555666",
        city: "Delhi",
        state: "Delhi",
        gstin: "07AABCB5678C1ZQ",
      },
      {
        name: "Royal Auto Components",
        phone: "9777888999",
        city: "Chennai",
        state: "Tamil Nadu",
      },
      {
        name: "National Motor Parts",
        phone: "9333444555",
        city: "Mumbai",
        state: "Maharashtra",
        gstin: "27AABCN7890D1ZR",
      },
      {
        name: "Shree Ganesh Traders",
        phone: "9222333444",
        city: "Indore",
        state: "Madhya Pradesh",
        gstin: "23AABCS1111E1ZS",
      },
      {
        name: "Sunrise Auto Spares",
        phone: "9666777888",
        city: "Nagpur",
        state: "Maharashtra",
        gstin: "27AABCS2222F1ZT",
      },
      {
        name: "Lakshmi Engineering",
        phone: "9555666777",
        city: "Hyderabad",
        state: "Telangana",
      },
      {
        name: "North Star Parts",
        phone: "9888999000",
        city: "Jaipur",
        state: "Rajasthan",
        gstin: "08AABCN3333G1ZU",
      },
    ];
    const suppliers = await Supplier.insertMany(
      supplierData.map((s, i) => ({
        id: i + 1,
        name: s.name,
        phone: s.phone,
        email: `${s.name.toLowerCase().replace(/\\s+/g, ".")}@suppliers.com`,
        address: `${randBetween(10, 200)} Industrial Area`,
        city: s.city,
        state: s.state,
        gstin: s.gstin || undefined,
        user_id: userId,
      })),
    );
    console.log("✅ Suppliers created:", suppliers.length);

    // ─────────────────────────────────────────────────────────
    //  7. PARTIES — 15
    // ─────────────────────────────────────────────────────────
    const partyData = [
      { name: "Sharma Auto Works", city: "Indore", gstin: "23AABCS1234D1ZR" },
      { name: "Patel Garage", city: "Bhopal" },
      { name: "Singh Motors", city: "Ujjain", gstin: "23AABCU7890E1ZS" },
      { name: "Kumar Automobiles", city: "Jabalpur" },
      { name: "Rajput Two Wheelers", city: "Indore", gstin: "23AABCR2345F1ZT" },
      { name: "Gupta Service Center", city: "Gwalior" },
      { name: "Verma Bike Point", city: "Indore", gstin: "23AABCV4567G1ZU" },
      { name: "Jain Motors", city: "Bhopal", gstin: "23AABCJ5678H1ZV" },
      { name: "Agarwal Garage", city: "Ratlam" },
      { name: "Tiwari Auto Zone", city: "Sagar" },
      { name: "Mishra Mechanics", city: "Indore" },
      { name: "Dubey Two Wheelers", city: "Dewas", gstin: "23AABCD6789I1ZW" },
      { name: "Yadav Bike Hub", city: "Khandwa" },
      { name: "Chouhan Motor Works", city: "Indore", gstin: "23AABCC7890J1ZX" },
      { name: "Nema Auto Parts", city: "Ujjain" },
    ];
    const parties = await Party.insertMany(
      partyData.map((p, i) => ({
        id: i + 1,
        name: p.name,
        phone: `9${randBetween(100000000, 999999999)}`,
        email: `${p.name.toLowerCase().replace(/\\s+/g, ".")}@customer.com`,
        address: `${randBetween(1, 500)} ${pick(["MG Road", "Station Road", "Gandhi Nagar", "Nehru Nagar", "Vijay Nagar"])}`,
        city: p.city,
        state: "Madhya Pradesh",
        gstin: p.gstin || undefined,
        balance: 0,
        user_id: userId,
      })),
    );
    console.log("✅ Parties created:", parties.length);

    // ─────────────────────────────────────────────────────────
    //  8. ITEMS — 30
    // ─────────────────────────────────────────────────────────
    const itemData = [
      // Engine Parts (cat 0)
      {
        name: "Piston Assembly (Bajaj Pulsar)",
        sale: 1200,
        purchase: 800,
        mrp: 1400,
        gst: 18,
        cat: 0,
        brand: 0,
        sup: 0,
        stock: 35,
      },
      {
        name: "Cylinder Kit (Bajaj CT100)",
        sale: 2800,
        purchase: 1900,
        mrp: 3200,
        gst: 18,
        cat: 0,
        brand: 0,
        sup: 0,
        stock: 12,
      },
      {
        name: "Valve Set (Suzuki Gixxer)",
        sale: 650,
        purchase: 400,
        mrp: 780,
        gst: 18,
        cat: 0,
        brand: 6,
        sup: 3,
        stock: 40,
      },
      // Body Parts (cat 1)
      {
        name: "Side Panel (Royal Enfield Classic)",
        sale: 3500,
        purchase: 2400,
        mrp: 4200,
        gst: 18,
        cat: 1,
        brand: 4,
        sup: 2,
        stock: 8,
      },
      {
        name: "Front Fender (Honda Activa)",
        sale: 900,
        purchase: 550,
        mrp: 1100,
        gst: 18,
        cat: 1,
        brand: 1,
        sup: 1,
        stock: 20,
      },
      {
        name: "Tail Panel (TVS Apache)",
        sale: 750,
        purchase: 480,
        mrp: 900,
        gst: 18,
        cat: 1,
        brand: 2,
        sup: 4,
        stock: 15,
      },
      // Electrical (cat 2)
      {
        name: "Headlight Assembly (Honda Activa)",
        sale: 850,
        purchase: 550,
        mrp: 1000,
        gst: 18,
        cat: 2,
        brand: 1,
        sup: 1,
        stock: 23,
      },
      {
        name: "CDI Unit (Royal Enfield)",
        sale: 1800,
        purchase: 1200,
        mrp: 2100,
        gst: 18,
        cat: 2,
        brand: 4,
        sup: 2,
        stock: 9,
      },
      {
        name: "Battery 12V (Exide)",
        sale: 1400,
        purchase: 950,
        mrp: 1650,
        gst: 18,
        cat: 2,
        brand: 9,
        sup: 5,
        stock: 15,
      },
      {
        name: "Regulator Rectifier (Yamaha FZ)",
        sale: 550,
        purchase: 350,
        mrp: 680,
        gst: 18,
        cat: 2,
        brand: 5,
        sup: 3,
        stock: 25,
      },
      {
        name: "Indicator Assembly (Hero)",
        sale: 280,
        purchase: 160,
        mrp: 350,
        gst: 18,
        cat: 2,
        brand: 3,
        sup: 1,
        stock: 60,
      },
      // Suspension (cat 3)
      {
        name: "Front Shocker (TVS Apache)",
        sale: 2200,
        purchase: 1500,
        mrp: 2600,
        gst: 18,
        cat: 3,
        brand: 2,
        sup: 0,
        stock: 18,
      },
      {
        name: "Rear Shocker Set (Bajaj Pulsar)",
        sale: 3200,
        purchase: 2100,
        mrp: 3800,
        gst: 18,
        cat: 3,
        brand: 0,
        sup: 0,
        stock: 10,
      },
      {
        name: "Swing Arm Bush Kit",
        sale: 250,
        purchase: 130,
        mrp: 320,
        gst: 12,
        cat: 3,
        brand: 10,
        sup: 4,
        stock: 80,
      },
      // Brakes (cat 4)
      {
        name: "Brake Pad Set (Hero Splendor)",
        sale: 350,
        purchase: 200,
        mrp: 420,
        gst: 12,
        cat: 4,
        brand: 3,
        sup: 6,
        stock: 70,
      },
      {
        name: "Disc Brake Assembly (KTM Duke)",
        sale: 4500,
        purchase: 3000,
        mrp: 5200,
        gst: 18,
        cat: 4,
        brand: 7,
        sup: 3,
        stock: 6,
      },
      {
        name: "Brake Cable (Universal)",
        sale: 120,
        purchase: 60,
        mrp: 150,
        gst: 12,
        cat: 4,
        brand: 10,
        sup: 4,
        stock: 100,
      },
      {
        name: "Brake Drum (Honda Shine)",
        sale: 950,
        purchase: 620,
        mrp: 1150,
        gst: 18,
        cat: 4,
        brand: 1,
        sup: 1,
        stock: 14,
      },
      // Transmission (cat 5)
      {
        name: "Chain Sprocket Kit (Yamaha FZ)",
        sale: 950,
        purchase: 600,
        mrp: 1100,
        gst: 18,
        cat: 5,
        brand: 5,
        sup: 7,
        stock: 30,
      },
      {
        name: "Clutch Plate Set (Royal Enfield)",
        sale: 1600,
        purchase: 1050,
        mrp: 1900,
        gst: 18,
        cat: 5,
        brand: 4,
        sup: 2,
        stock: 12,
      },
      {
        name: "Chain Set (Bajaj Discover)",
        sale: 480,
        purchase: 280,
        mrp: 580,
        gst: 18,
        cat: 5,
        brand: 0,
        sup: 0,
        stock: 45,
      },
      // Tyres & Tubes (cat 6)
      {
        name: "Front Tyre 80/100-17 (MRF)",
        sale: 1800,
        purchase: 1300,
        mrp: 2100,
        gst: 28,
        cat: 6,
        brand: 8,
        sup: 5,
        stock: 20,
      },
      {
        name: "Rear Tyre 100/90-17 (MRF)",
        sale: 2200,
        purchase: 1600,
        mrp: 2600,
        gst: 28,
        cat: 6,
        brand: 8,
        sup: 5,
        stock: 16,
      },
      {
        name: "Tube 17 inch (MRF)",
        sale: 350,
        purchase: 220,
        mrp: 420,
        gst: 18,
        cat: 6,
        brand: 8,
        sup: 5,
        stock: 50,
      },
      // Fuel System (cat 7)
      {
        name: "Carburetor (Bajaj Platina)",
        sale: 1500,
        purchase: 1000,
        mrp: 1800,
        gst: 18,
        cat: 7,
        brand: 0,
        sup: 0,
        stock: 8,
      },
      {
        name: "Fuel Cock Assembly (Honda)",
        sale: 320,
        purchase: 180,
        mrp: 400,
        gst: 18,
        cat: 7,
        brand: 1,
        sup: 1,
        stock: 35,
      },
      // Exhaust (cat 8)
      {
        name: "Silencer Assembly (Royal Enfield)",
        sale: 5500,
        purchase: 3800,
        mrp: 6500,
        gst: 18,
        cat: 8,
        brand: 4,
        sup: 2,
        stock: 5,
      },
      {
        name: "Exhaust Gasket Set (Oscar)",
        sale: 180,
        purchase: 90,
        mrp: 230,
        gst: 12,
        cat: 8,
        brand: 10,
        sup: 4,
        stock: 90,
      },
      // Accessories (cat 9)
      {
        name: "Handle Bar Mirror Set (Universal)",
        sale: 250,
        purchase: 130,
        mrp: 320,
        gst: 18,
        cat: 9,
        brand: 11,
        sup: 7,
        stock: 55,
      },
      {
        name: "Seat Cover (Royal Enfield Classic)",
        sale: 1200,
        purchase: 750,
        mrp: 1500,
        gst: 18,
        cat: 9,
        brand: 4,
        sup: 2,
        stock: 12,
      },
    ];

    const items = await Item.insertMany(
      itemData.map((it, i) => ({
        id: i + 1,
        item_name: it.name,
        sale_rate: it.sale,
        purchase_rate: it.purchase,
        mrp_rate: it.mrp,
        gst_percent: it.gst,
        discount: 0,
        stock: it.stock,
        threshold: Math.max(2, Math.ceil(it.stock * 0.15)),
        is_gst: 1,
        user_id: userId,
        category_id: categories[it.cat]._id,
        brand_id: brands[it.brand]._id,
        supplier_id: suppliers[it.sup]._id,
      })),
    );
    // Link items → brands
    for (const item of items) {
      await Brand.findByIdAndUpdate(item.brand_id, {
        $addToSet: { item_ids: item._id },
      });
    }
    console.log("✅ Items created:", items.length);

    // ─────────────────────────────────────────────────────────
    //  9. STOCK ALERTS — 8
    // ─────────────────────────────────────────────────────────
    const lowStockItems = items.filter((it) => {
      const d = itemData[items.indexOf(it)];
      return d.stock <= 15;
    });
    const stockAlerts = await StockAlert.insertMany(
      lowStockItems.slice(0, 8).map((it, i) => ({
        id: i + 1,
        item_id: it._id,
        stock_count: it.stock,
        threshold: it.threshold,
        is_resolved: i < 2, // first 2 resolved
        user_id: userId,
      })),
    );
    console.log("✅ Stock alerts created:", stockAlerts.length);

    // ─────────────────────────────────────────────────────────
    //  10. CHALLANS — 15 GST + 5 Non-GST = 20
    // ─────────────────────────────────────────────────────────
    function makeChallanItem(itemIdx, qty, disc, isGst) {
      const it = itemData[itemIdx];
      const rate = it.sale;
      const grossAmt = round2(qty * rate);
      const discAmt = round2(disc);
      const taxableAmt = round2(grossAmt - discAmt);
      const gstPct = isGst ? it.gst : 0;
      const gstAmt = isGst ? round2((taxableAmt * gstPct) / 100) : 0;
      const amount = round2(taxableAmt + gstAmt);
      return {
        item_id: items[itemIdx]._id,
        quantity: qty,
        rate,
        discount: disc,
        special_discount: 0,
        gross_amount: grossAmt,
        discount_amount: discAmt,
        total_discount: discAmt,
        taxable_amount: taxableAmt,
        gst_percent: gstPct,
        gst_amount: gstAmt,
        amount,
        is_gst: isGst ? 1 : 0,
      };
    }

    function calcChallanTotals(challanItems) {
      const gross_total = round2(
        challanItems.reduce((s, i) => s + i.gross_amount, 0),
      );
      const discount = round2(
        challanItems.reduce((s, i) => s + i.discount_amount, 0),
      );
      const sub_total = round2(gross_total - discount);
      const amount = round2(challanItems.reduce((s, i) => s + i.amount, 0));
      return { gross_total, sub_total, discount, amount };
    }

    const gstChallanDefs = [
      {
        party: 0,
        date: "2026-01-05",
        items: [
          [0, 2, 0],
          [6, 1, 50],
        ],
      },
      { party: 2, date: "2026-01-10", items: [[11, 3, 200]] },
      {
        party: 1,
        date: "2026-01-15",
        items: [
          [14, 10, 0],
          [18, 2, 100],
        ],
      },
      {
        party: 4,
        date: "2026-01-20",
        items: [
          [3, 1, 0],
          [29, 2, 100],
        ],
      },
      {
        party: 6,
        date: "2026-01-25",
        items: [
          [7, 1, 0],
          [8, 2, 0],
        ],
      },
      {
        party: 7,
        date: "2026-02-01",
        items: [
          [15, 1, 500],
          [16, 5, 0],
        ],
      },
      {
        party: 0,
        date: "2026-02-02",
        items: [
          [21, 2, 0],
          [22, 2, 0],
        ],
      },
      {
        party: 3,
        date: "2026-02-04",
        items: [
          [24, 1, 0],
          [25, 3, 0],
        ],
      },
      { party: 9, date: "2026-02-06", items: [[1, 1, 0]] },
      {
        party: 11,
        date: "2026-02-07",
        items: [
          [26, 1, 0],
          [27, 5, 0],
        ],
      },
      {
        party: 13,
        date: "2026-02-08",
        items: [
          [19, 2, 0],
          [20, 4, 0],
        ],
      },
      {
        party: 2,
        date: "2026-02-10",
        items: [
          [12, 1, 200],
          [13, 10, 0],
        ],
      },
      {
        party: 5,
        date: "2026-02-11",
        items: [
          [9, 3, 0],
          [10, 5, 0],
        ],
      },
      {
        party: 8,
        date: "2026-02-13",
        items: [
          [4, 2, 0],
          [5, 3, 0],
        ],
      },
      {
        party: 14,
        date: "2026-02-14",
        items: [
          [17, 2, 0],
          [28, 4, 0],
        ],
      },
    ];

    const gstChallans = [];
    for (let i = 0; i < gstChallanDefs.length; i++) {
      const def = gstChallanDefs[i];
      const cItems = def.items.map(([idx, qty, disc]) =>
        makeChallanItem(idx, qty, disc, true),
      );
      const totals = calcChallanTotals(cItems);
      gstChallans.push({
        id: i + 1,
        challan_no: `GST-CH-${String(i + 1).padStart(3, "0")}`,
        date: new Date(def.date),
        party_id: parties[def.party]._id,
        items: cItems,
        ...totals,
        converted_to_bill: i < 5, // first 5 converted
        is_gst: 1,
        user_id: userId,
      });
    }
    const challansGST = await Challan.insertMany(gstChallans);

    const nongstChallanDefs = [
      { party: 3, date: "2026-01-08", items: [[4, 2, 0]] },
      {
        party: 5,
        date: "2026-01-18",
        items: [
          [16, 3, 0],
          [13, 5, 0],
        ],
      },
      { party: 8, date: "2026-02-03", items: [[10, 4, 0]] },
      {
        party: 10,
        date: "2026-02-09",
        items: [
          [28, 3, 0],
          [27, 8, 0],
        ],
      },
      {
        party: 12,
        date: "2026-02-12",
        items: [
          [20, 6, 0],
          [23, 4, 0],
        ],
      },
    ];

    const nongstChallans = [];
    for (let i = 0; i < nongstChallanDefs.length; i++) {
      const def = nongstChallanDefs[i];
      const cItems = def.items.map(([idx, qty, disc]) =>
        makeChallanItem(idx, qty, disc, false),
      );
      const totals = calcChallanTotals(cItems);
      nongstChallans.push({
        id: gstChallanDefs.length + i + 1,
        challan_no: `NGST-CH-${String(i + 1).padStart(3, "0")}`,
        date: new Date(def.date),
        party_id: parties[def.party]._id,
        items: cItems,
        ...totals,
        converted_to_bill: i < 2, // first 2 converted
        is_gst: 0,
        user_id: userId,
      });
    }
    const challansNGST = await Challan.insertMany(nongstChallans);
    const allChallans = [...challansGST, ...challansNGST];
    console.log(
      `✅ Challans created: ${allChallans.length} (${challansGST.length} GST + ${challansNGST.length} NGST)`,
    );

    // ─────────────────────────────────────────────────────────
    //  11. BILLS — 10 GST + 5 Non-GST = 15
    // ─────────────────────────────────────────────────────────
    const gstBillDefs = [
      {
        party: 0,
        date: "2026-01-07",
        amt: 3200,
        paid: 3200,
        status: "paid",
        challans: [0],
      },
      {
        party: 2,
        date: "2026-01-12",
        amt: 6400,
        paid: 6400,
        status: "paid",
        challans: [1],
      },
      {
        party: 1,
        date: "2026-01-17",
        amt: 5300,
        paid: 3000,
        status: "due",
        challans: [2],
      },
      {
        party: 4,
        date: "2026-01-22",
        amt: 5900,
        paid: 5900,
        status: "paid",
        challans: [3],
      },
      {
        party: 6,
        date: "2026-01-27",
        amt: 4600,
        paid: 5000,
        status: "overpaid",
        challans: [4],
      },
      {
        party: 7,
        date: "2026-02-03",
        amt: 4600,
        paid: 2000,
        status: "due",
        challans: [],
      },
      {
        party: 0,
        date: "2026-02-05",
        amt: 8000,
        paid: 8000,
        status: "paid",
        challans: [],
      },
      {
        party: 9,
        date: "2026-02-08",
        amt: 2800,
        paid: 0,
        status: "due",
        challans: [],
      },
      {
        party: 13,
        date: "2026-02-10",
        amt: 5120,
        paid: 5120,
        status: "paid",
        challans: [],
      },
      {
        party: 14,
        date: "2026-02-15",
        amt: 2900,
        paid: 1000,
        status: "due",
        challans: [],
      },
    ];

    const gstBills = await Bill.insertMany(
      gstBillDefs.map((b, i) => ({
        id: i + 1,
        bill_no: `GST-BILL-${String(i + 1).padStart(3, "0")}`,
        date: new Date(b.date),
        party_id: parties[b.party]._id,
        amount: b.amt,
        paid_amount: b.paid,
        return_amount: b.status === "overpaid" ? b.paid - b.amt : 0,
        payment_status: b.status,
        challan_ids: b.challans.map((ci) => challansGST[ci]._id),
        skip_stock_calculation: false,
        is_gst: 1,
        user_id: userId,
      })),
    );

    // Link challans to bills
    for (let i = 0; i < gstBillDefs.length; i++) {
      for (const ci of gstBillDefs[i].challans) {
        await Challan.findByIdAndUpdate(challansGST[ci]._id, {
          bill_id: gstBills[i]._id,
        });
      }
    }

    const nongstBillDefs = [
      {
        party: 3,
        date: "2026-01-10",
        amt: 1800,
        paid: 1800,
        status: "paid",
        challans: [0],
      },
      {
        party: 5,
        date: "2026-01-20",
        amt: 1610,
        paid: 800,
        status: "due",
        challans: [1],
      },
      {
        party: 10,
        date: "2026-02-11",
        amt: 2190,
        paid: 2190,
        status: "paid",
        challans: [],
      },
      {
        party: 12,
        date: "2026-02-14",
        amt: 4280,
        paid: 0,
        status: "due",
        challans: [],
      },
      {
        party: 8,
        date: "2026-02-15",
        amt: 1120,
        paid: 1120,
        status: "paid",
        challans: [],
      },
    ];

    const nongstBills = await Bill.insertMany(
      nongstBillDefs.map((b, i) => ({
        id: gstBillDefs.length + i + 1,
        bill_no: `NGST-BILL-${String(i + 1).padStart(3, "0")}`,
        date: new Date(b.date),
        party_id: parties[b.party]._id,
        amount: b.amt,
        paid_amount: b.paid,
        return_amount: 0,
        payment_status: b.status,
        challan_ids: b.challans.map((ci) => challansNGST[ci]._id),
        skip_stock_calculation: false,
        is_gst: 0,
        user_id: userId,
      })),
    );

    for (let i = 0; i < nongstBillDefs.length; i++) {
      for (const ci of nongstBillDefs[i].challans) {
        await Challan.findByIdAndUpdate(challansNGST[ci]._id, {
          bill_id: nongstBills[i]._id,
        });
      }
    }

    const allBills = [...gstBills, ...nongstBills];
    console.log(
      `✅ Bills created: ${allBills.length} (${gstBills.length} GST + ${nongstBills.length} NGST)`,
    );

    // ─────────────────────────────────────────────────────────
    //  12. PURCHASES — 10 (7 GST + 3 Non-GST)
    // ─────────────────────────────────────────────────────────
    const purchaseDefs = [
      {
        sup: 0,
        date: "2026-01-05",
        type: "GST",
        items: [
          [0, 30, 800],
          [2, 20, 400],
        ],
        status: "paid",
      },
      {
        sup: 1,
        date: "2026-01-10",
        type: "GST",
        items: [
          [6, 20, 550],
          [4, 15, 550],
        ],
        status: "due",
        paid: 10000,
      },
      {
        sup: 2,
        date: "2026-01-15",
        type: "NON_GST",
        items: [
          [3, 5, 2400],
          [26, 3, 3800],
        ],
        status: "paid",
      },
      {
        sup: 3,
        date: "2026-01-20",
        type: "GST",
        items: [
          [15, 8, 3000],
          [9, 15, 350],
        ],
        status: "paid",
      },
      {
        sup: 4,
        date: "2026-01-25",
        type: "GST",
        items: [
          [13, 50, 130],
          [27, 40, 90],
        ],
        status: "due",
        paid: 5000,
      },
      {
        sup: 5,
        date: "2026-02-01",
        type: "GST",
        items: [
          [8, 10, 950],
          [21, 15, 1300],
        ],
        status: "paid",
      },
      {
        sup: 6,
        date: "2026-02-05",
        type: "NON_GST",
        items: [
          [14, 40, 200],
          [16, 60, 60],
        ],
        status: "paid",
      },
      {
        sup: 7,
        date: "2026-02-08",
        type: "GST",
        items: [
          [18, 20, 600],
          [19, 8, 1050],
        ],
        status: "due",
        paid: 8000,
      },
      {
        sup: 0,
        date: "2026-02-10",
        type: "GST",
        items: [
          [1, 10, 1900],
          [12, 6, 2100],
        ],
        status: "paid",
      },
      {
        sup: 3,
        date: "2026-02-12",
        type: "NON_GST",
        items: [
          [10, 30, 160],
          [17, 10, 620],
        ],
        status: "due",
        paid: 3000,
      },
    ];

    const purchases = await Purchase.insertMany(
      purchaseDefs.map((p, i) => {
        const pItems = p.items.map(([itemIdx, qty, rate]) => ({
          item_id: items[itemIdx]._id,
          quantity: qty,
          rate,
          amount: qty * rate,
        }));
        const totalAmt = pItems.reduce((s, pi) => s + pi.amount, 0);
        const paidAmt = p.status === "paid" ? totalAmt : p.paid || 0;
        return {
          id: i + 1,
          purchase_no: `PUR-${p.type === "GST" ? "GST" : "NGST"}-${String(i + 1).padStart(3, "0")}`,
          date: new Date(p.date),
          supplier_id: suppliers[p.sup]._id,
          items: pItems,
          purchase_type: p.type,
          amount: totalAmt,
          payment_status: p.status,
          paid_amount: paidAmt,
          user_id: userId,
        };
      }),
    );
    console.log("✅ Purchases created:", purchases.length);

    // ─────────────────────────────────────────────────────────
    //  13. TRANSACTIONS — 25
    // ─────────────────────────────────────────────────────────
    const txnData = [];
    let txnId = 1;

    // Sale transactions from bills
    for (const bill of gstBills) {
      if (bill.paid_amount > 0) {
        txnData.push({
          id: txnId++,
          type: "sale",
          party_id: bill.party_id,
          bill_id: bill._id,
          amount: bill.paid_amount,
          payment_mode: pick(["cash", "bank", "credit"]),
          utr: bill.paid_amount > 3000 ? `UTR${Date.now()}${txnId}` : undefined,
          transaction_ref: `TXN-S-${String(txnId).padStart(3, "0")}`,
          remarks: `Payment for ${bill.bill_no}`,
          is_gst: 1,
          user_id: userId,
        });
      }
    }
    for (const bill of nongstBills) {
      if (bill.paid_amount > 0) {
        txnData.push({
          id: txnId++,
          type: "sale",
          party_id: bill.party_id,
          bill_id: bill._id,
          amount: bill.paid_amount,
          payment_mode: pick(["cash", "bank"]),
          transaction_ref: `TXN-S-${String(txnId).padStart(3, "0")}`,
          remarks: `Payment for ${bill.bill_no}`,
          is_gst: 0,
          user_id: userId,
        });
      }
    }

    // Purchase transactions
    for (const pur of purchases) {
      if (pur.paid_amount > 0) {
        txnData.push({
          id: txnId++,
          type: "purchase",
          supplier_id: pur.supplier_id,
          purchase_id: pur._id,
          amount: pur.paid_amount,
          payment_mode: pick(["cash", "bank"]),
          utr: pur.paid_amount > 5000 ? `UTR${Date.now()}${txnId}` : undefined,
          transaction_ref: `TXN-P-${String(txnId).padStart(3, "0")}`,
          remarks: `Payment for ${pur.purchase_no}`,
          is_gst: pur.purchase_type === "GST" ? 1 : 0,
          user_id: userId,
        });
      }
    }

    const transactions = await Transaction.insertMany(txnData);
    console.log("✅ Transactions created:", transactions.length);

    // ─────────────────────────────────────────────────────────
    //  14. REPORTS — 6
    // ─────────────────────────────────────────────────────────
    const reports = await Report.insertMany([
      {
        pdf_link: "https://example.com/reports/challan-gst-jan2026.pdf",
        date_created: new Date("2026-01-31"),
        user_id: userId,
        is_gst: 1,
        report_type: "challan",
      },
      {
        pdf_link: "https://example.com/reports/challan-gst-feb2026.pdf",
        date_created: new Date("2026-02-15"),
        user_id: userId,
        is_gst: 1,
        report_type: "challan",
      },
      {
        pdf_link: "https://example.com/reports/bill-gst-jan2026.pdf",
        date_created: new Date("2026-01-31"),
        user_id: userId,
        is_gst: 1,
        report_type: "bill",
      },
      {
        pdf_link: "https://example.com/reports/bill-gst-feb2026.pdf",
        date_created: new Date("2026-02-15"),
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
      {
        pdf_link: "https://example.com/reports/transaction-jan2026.pdf",
        date_created: new Date("2026-01-31"),
        user_id: userId,
        is_gst: 1,
        report_type: "transaction",
      },
    ]);
    console.log("✅ Reports created:", reports.length);

    // ─────────────────────────────────────────────────────────
    //  15. COUNTERS
    // ─────────────────────────────────────────────────────────
    const counterData = [
      { model_name: "Category", seq: categories.length },
      { model_name: "Brand", seq: brands.length },
      { model_name: "Discount", seq: discounts.length },
      { model_name: "Item", seq: items.length },
      { model_name: "Supplier", seq: suppliers.length },
      { model_name: "Party", seq: parties.length },
      { model_name: "Challan", seq: allChallans.length },
      { model_name: "Bill", seq: allBills.length },
      { model_name: "Purchase", seq: purchases.length },
      { model_name: "Transaction", seq: transactions.length },
      { model_name: "StockAlert", seq: stockAlerts.length },
    ];
    await Counter.insertMany(
      counterData.map((c) => ({ ...c, user_id: userId })),
    );
    console.log("✅ Counters initialized:", counterData.length);

    // ─── SUMMARY ───
    console.log("\n╔══════════════════════════════════════╗");
    console.log("║         SEED COMPLETE                ║");
    console.log("╠══════════════════════════════════════╣");
    console.log(
      `║ Users:          ${1 + secondaryUsers.length} (1 main + ${secondaryUsers.length} staff)`.padEnd(
        39,
      ) + "║",
    );
    console.log(`║ Sessions:       ${sessions.length}`.padEnd(39) + "║");
    console.log(`║ Categories:     ${categories.length}`.padEnd(39) + "║");
    console.log(`║ Brands:         ${brands.length}`.padEnd(39) + "║");
    console.log(`║ Discounts:      ${discounts.length}`.padEnd(39) + "║");
    console.log(`║ Suppliers:      ${suppliers.length}`.padEnd(39) + "║");
    console.log(`║ Parties:        ${parties.length}`.padEnd(39) + "║");
    console.log(`║ Items:          ${items.length}`.padEnd(39) + "║");
    console.log(`║ Stock Alerts:   ${stockAlerts.length}`.padEnd(39) + "║");
    console.log(
      `║ Challans:       ${allChallans.length} (${challansGST.length} GST + ${challansNGST.length} NGST)`.padEnd(
        39,
      ) + "║",
    );
    console.log(
      `║ Bills:          ${allBills.length} (${gstBills.length} GST + ${nongstBills.length} NGST)`.padEnd(
        39,
      ) + "║",
    );
    console.log(`║ Purchases:      ${purchases.length}`.padEnd(39) + "║");
    console.log(`║ Transactions:   ${transactions.length}`.padEnd(39) + "║");
    console.log(`║ Reports:        ${reports.length}`.padEnd(39) + "║");
    console.log(`║ Counters:       ${counterData.length}`.padEnd(39) + "║");
    console.log("╠══════════════════════════════════════╣");
    console.log("║         LOGIN CREDENTIALS            ║");
    console.log("╠══════════════════════════════════════╣");
    console.log("║ ADMIN (main user):                   ║");
    console.log("║   username: admin_ramesh             ║");
    console.log("║   password: Admin@1234               ║");
    console.log("║                                      ║");
    console.log("║ GST FIRM (main):                     ║");
    console.log("║   username: gst_ramesh               ║");
    console.log("║   password: Test@1234                ║");
    console.log("║                                      ║");
    console.log("║ NON-GST FIRM (main):                 ║");
    console.log("║   username: nongst_ramesh            ║");
    console.log("║   password: Test@1234                ║");
    console.log("║                                      ║");
    console.log("║ STAFF LOGINS (password: Staff@1234): ║");
    console.log("║   gst_suresh / nongst_suresh         ║");
    console.log("║   gst_priya  / nongst_priya          ║");
    console.log("║   gst_amit   / nongst_amit           ║");
    console.log("║   gst_deepak / nongst_deepak         ║");
    console.log("╚══════════════════════════════════════╝\n");
  } catch (err) {
    console.error("❌ Seed failed:", err.message || err);
    if (err.errors) {
      for (const [field, e] of Object.entries(err.errors)) {
        console.error(`   → ${field}: ${e.message}`);
      }
    }
    if (err.code === 11000) {
      console.error("   Duplicate key — run seed again to drop & recreate.");
    }
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
  }
}

seed();
