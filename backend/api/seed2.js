import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import env from "../src/config/env.js";
import {
  User,
  Session,
  Item,
  Challan,
  Bill,
  Report,
  Brand,
  Hsn,
  Contact,
  Agent,
  Transport,
  Area,
  Category,
  Counter,
} from "../src/models/index.js";

const SALT = 10;

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randBetween = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const round2 = (n) => Math.round(n * 100) / 100;

async function seed() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const models = [
      User,
      Session,
      Item,
      Challan,
      Bill,
      Report,
      Brand,
      Hsn,
      Contact,
      Agent,
      Transport,
      Area,
      Category,
      Counter,
    ];
    for (const M of models) await M.deleteMany({});
    console.log("🗑️  Cleared all collections");

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

    /* ── HSN codes ── */
    const hsnData = [
      { code: "8714", desc: "Motorcycle parts & accessories", gst: 18 },
      { code: "8511", desc: "Electrical ignition/starting equipment", gst: 18 },
      { code: "4011", desc: "New pneumatic rubber tyres", gst: 28 },
      { code: "8507", desc: "Electric accumulators & batteries", gst: 28 },
      { code: "7318", desc: "Fasteners, bolts, nuts & screws", gst: 18 },
      { code: "8409", desc: "Parts for spark/compression engines", gst: 18 },
      { code: "8421", desc: "Filters – oil, fuel, air", gst: 18 },
      { code: "7304", desc: "Exhaust tubes, pipes & fittings", gst: 18 },
    ];
    const hsns = await Hsn.insertMany(
      hsnData.map((h, i) => ({
        id: i + 1,
        hsn_code: h.code,
        description: h.desc,
        gst_rate: h.gst,
        user_id: userId,
      })),
    );
    console.log("✅ HSN codes created:", hsns.length);

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
    // brandIdx → hsnIdx: 0=8714, 1=8511, 2=4011, 3=8507, 4=7318, 5=8409, 6=8421, 7=7304
    const brandHsnMap = [0, 0, 0, 0, 0, 5, 0, 5, 2, 3, 0, 4];
    const brands = await Brand.insertMany(
      brandNames.map((name, i) => ({
        id: i + 1,
        name,
        discount1: { normal: randBetween(5, 20), special: randBetween(0, 5) },
        discount2: { normal: randBetween(3, 15), special: randBetween(0, 3) },
        hsn_id: brandHsnMap[i] != null ? hsns[brandHsnMap[i]]._id : undefined,
        user_id: userId,
      })),
    );

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

    /* ── Transports ── */
    const transportData = [
      {
        name: "Shree Maruti Transport",
        city: "Indore",
        pincode: "452001",
        phone: "9800111222",
        whatsapp: "9800111222",
      },
      {
        name: "Rajdhani Roadways",
        city: "Bhopal",
        pincode: "462001",
        phone: "9800333444",
        whatsapp: "9800333444",
      },
      {
        name: "Ganesh Cargo Movers",
        city: "Ujjain",
        pincode: "456001",
        phone: "9800555666",
        whatsapp: "9800555666",
      },
      {
        name: "Nakoda Transport",
        city: "Mumbai",
        pincode: "400001",
        phone: "9800777888",
        whatsapp: "9800777888",
        gstin: "27AABCN4444H1ZV",
      },
      {
        name: "Jay Ambe Logistics",
        city: "Pune",
        pincode: "411001",
        phone: "9800999000",
        whatsapp: "9800999000",
        gstin: "27AABCJ5555I1ZW",
      },
    ];
    const transports = await Transport.insertMany(
      transportData.map((t, i) => ({
        id: i + 1,
        name: t.name,
        address: `${randBetween(1, 300)} Transport Nagar`,
        city: t.city,
        pincode: t.pincode,
        phone: t.phone,
        whatsapp: t.whatsapp,
        gstin: t.gstin || undefined,
        user_id: userId,
      })),
    );
    console.log("✅ Transports created:", transports.length);

    const supplierData = [
      {
        name: "AutoParts India Pvt Ltd",
        phone: "9111222333",
        city: "Pune",
        state: "Maharashtra",
        gstin: "27AABCA1234B1ZP",
        is_gst: 1,
      },
      {
        name: "Bharat Spares",
        phone: "9444555666",
        city: "Delhi",
        state: "Delhi",
        gstin: "07AABCB5678C1ZQ",
        is_gst: 1,
      },
      {
        name: "Royal Auto Components",
        phone: "9777888999",
        city: "Chennai",
        state: "Tamil Nadu",
        is_gst: 0,
      },
      {
        name: "National Motor Parts",
        phone: "9333444555",
        city: "Mumbai",
        state: "Maharashtra",
        gstin: "27AABCN7890D1ZR",
        is_gst: 1,
      },
      {
        name: "Shree Ganesh Traders",
        phone: "9222333444",
        city: "Indore",
        state: "Madhya Pradesh",
        gstin: "23AABCS1111E1ZS",
        is_gst: 1,
      },
      {
        name: "Sunrise Auto Spares",
        phone: "9666777888",
        city: "Nagpur",
        state: "Maharashtra",
        gstin: "27AABCS2222F1ZT",
        is_gst: 1,
      },
      {
        name: "Lakshmi Engineering",
        phone: "9555666777",
        city: "Hyderabad",
        state: "Telangana",
        is_gst: 0,
      },
      {
        name: "North Star Parts",
        phone: "9888999000",
        city: "Jaipur",
        state: "Rajasthan",
        gstin: "08AABCN3333G1ZU",
        is_gst: 1,
      },
    ];
    // supplierIdx → categoryIdx
    const supplierCatMap = [0, 2, 1, 5, 4, 3, 6, 7];
    const suppliers = await Contact.insertMany(
      supplierData.map((s, i) => ({
        id: i + 1,
        name: s.name,
        type: "supplier",
        phone: s.phone,
        email: `${s.name.toLowerCase().replace(/\s+/g, ".")}@suppliers.com`,
        address: `${randBetween(10, 200)} Industrial Area`,
        city: s.city,
        state: s.state,
        gstin: s.gstin || undefined,
        is_gst: s.is_gst,
        category_id: categories[supplierCatMap[i]]._id,
        user_id: userId,
      })),
    );
    console.log("✅ Suppliers (contacts) created:", suppliers.length);

    const partyData = [
      {
        name: "Sharma Auto Works",
        city: "Indore",
        gstin: "23AABCS1234D1ZR",
        is_gst: 1,
      },
      { name: "Patel Garage", city: "Bhopal", is_gst: 0 },
      {
        name: "Singh Motors",
        city: "Ujjain",
        gstin: "23AABCU7890E1ZS",
        is_gst: 1,
      },
      { name: "Kumar Automobiles", city: "Jabalpur", is_gst: 0 },
      {
        name: "Rajput Two Wheelers",
        city: "Indore",
        gstin: "23AABCR2345F1ZT",
        is_gst: 1,
      },
      { name: "Gupta Service Center", city: "Gwalior", is_gst: 0 },
      {
        name: "Verma Bike Point",
        city: "Indore",
        gstin: "23AABCV4567G1ZU",
        is_gst: 1,
      },
      {
        name: "Jain Motors",
        city: "Bhopal",
        gstin: "23AABCJ5678H1ZV",
        is_gst: 1,
      },
      { name: "Agarwal Garage", city: "Ratlam", is_gst: 0 },
      { name: "Tiwari Auto Zone", city: "Sagar", is_gst: 0 },
      { name: "Mishra Mechanics", city: "Indore", is_gst: 0 },
      {
        name: "Dubey Two Wheelers",
        city: "Dewas",
        gstin: "23AABCD6789I1ZW",
        is_gst: 1,
      },
      { name: "Yadav Bike Hub", city: "Khandwa", is_gst: 0 },
      {
        name: "Chouhan Motor Works",
        city: "Indore",
        gstin: "23AABCC7890J1ZX",
        is_gst: 1,
      },
      { name: "Nema Auto Parts", city: "Ujjain", is_gst: 0 },
    ];
    // partyIdx → categoryIdx
    const partyCatMap = [0, 1, 5, 3, 0, 4, 2, 6, 8, 9, 0, 1, 7, 5, 3];
    // partyIdx → transportIdx (null = no transport)
    const partyTransMap = [
      0,
      1,
      2,
      null,
      0,
      null,
      3,
      1,
      null,
      4,
      null,
      2,
      0,
      3,
      null,
    ];
    const parties = await Contact.insertMany(
      partyData.map((p, i) => ({
        id: suppliers.length + i + 1,
        name: p.name,
        type: "party",
        phone: `9${randBetween(100000000, 999999999)}`,
        email: `${p.name.toLowerCase().replace(/\s+/g, ".")}@customer.com`,
        address: `${randBetween(1, 500)} ${pick(["MG Road", "Station Road", "Gandhi Nagar", "Nehru Nagar", "Vijay Nagar"])}`,
        city: p.city,
        state: "Madhya Pradesh",
        gstin: p.gstin || undefined,
        is_gst: p.is_gst,
        category_id: categories[partyCatMap[i]]._id,
        transport_id:
          partyTransMap[i] != null ?
            transports[partyTransMap[i]]._id
          : undefined,
        balance: 0,
        user_id: userId,
      })),
    );
    console.log("✅ Parties (contacts) created:", parties.length);

    /* ── Agents ── */
    const agentData = [
      {
        name: "Rakesh Sharma",
        city: "Indore",
        pincode: "452001",
        phone: "9900111222",
        whatsapp: "9900111222",
        party: 0,
      },
      {
        name: "Vijay Patel",
        city: "Bhopal",
        pincode: "462001",
        phone: "9900333444",
        whatsapp: "9900333444",
        party: 1,
      },
      {
        name: "Sunil Joshi",
        city: "Ujjain",
        pincode: "456001",
        phone: "9900555666",
        whatsapp: "9900555666",
        party: 2,
      },
      {
        name: "Manoj Gupta",
        city: "Indore",
        pincode: "452001",
        phone: "9900777888",
        whatsapp: "9900777888",
        party: 4,
      },
      {
        name: "Dinesh Yadav",
        city: "Dewas",
        pincode: "455001",
        phone: "9900888999",
        whatsapp: "9900888999",
        party: 11,
      },
      {
        name: "Kiran Nema",
        city: "Khandwa",
        pincode: "450001",
        phone: "9900999000",
        whatsapp: "9900999000",
        party: 12,
      },
    ];
    const agents = await Agent.insertMany(
      agentData.map((a, i) => ({
        id: i + 1,
        name: a.name,
        address: `${randBetween(1, 200)} ${pick(["Market Road", "Main Street", "Commerce Lane"])}`,
        city: a.city,
        pincode: a.pincode,
        phone: a.phone,
        whatsapp: a.whatsapp,
        party_id: parties[a.party]._id,
        user_id: userId,
      })),
    );
    console.log("✅ Agents created:", agents.length);

    /* ── Areas ── */
    const areaData = [
      {
        city: "Indore",
        state: "Madhya Pradesh",
        pincode: "452001",
        phone: "9850111000",
        whatsapp: "9850111000",
        agent: 0,
        transport: 0,
      },
      {
        city: "Bhopal",
        state: "Madhya Pradesh",
        pincode: "462001",
        phone: "9850222000",
        whatsapp: "9850222000",
        agent: 1,
        transport: 1,
      },
      {
        city: "Ujjain",
        state: "Madhya Pradesh",
        pincode: "456001",
        phone: "9850333000",
        whatsapp: "9850333000",
        agent: 2,
        transport: 2,
      },
      {
        city: "Jabalpur",
        state: "Madhya Pradesh",
        pincode: "482001",
        phone: "9850444000",
        whatsapp: "9850444000",
        agent: null,
        transport: null,
      },
      {
        city: "Gwalior",
        state: "Madhya Pradesh",
        pincode: "474001",
        phone: "9850555000",
        whatsapp: "9850555000",
        agent: null,
        transport: null,
      },
      {
        city: "Dewas",
        state: "Madhya Pradesh",
        pincode: "455001",
        phone: "9850666000",
        whatsapp: "9850666000",
        agent: 4,
        transport: 3,
      },
      {
        city: "Sagar",
        state: "Madhya Pradesh",
        pincode: "470001",
        phone: "9850777000",
        whatsapp: "9850777000",
        agent: null,
        transport: 4,
      },
      {
        city: "Ratlam",
        state: "Madhya Pradesh",
        pincode: "457001",
        phone: "9850888000",
        whatsapp: "9850888000",
        agent: null,
        transport: null,
      },
      {
        city: "Khandwa",
        state: "Madhya Pradesh",
        pincode: "450001",
        phone: "9850999000",
        whatsapp: "9850999000",
        agent: 5,
        transport: 0,
      },
    ];
    const areas = await Area.insertMany(
      areaData.map((a, i) => ({
        id: i + 1,
        city: a.city,
        state: a.state,
        pincode: a.pincode,
        phone: a.phone,
        whatsapp: a.whatsapp,
        agent_id: a.agent != null ? agents[a.agent]._id : null,
        transport_id: a.transport != null ? transports[a.transport]._id : null,
        user_id: userId,
      })),
    );
    console.log("✅ Areas created:", areas.length);

    // Assign areas to parties (partyIdx → areaIdx by city match)
    // Indore→0, Bhopal→1, Ujjain→2, Jabalpur→3, Gwalior→4, Dewas→5, Sagar→6, Ratlam→7, Khandwa→8
    const partyAreaMap = [0, 1, 2, 3, 0, 4, 0, 1, 7, 6, 0, 5, 8, 0, 2];
    for (let i = 0; i < parties.length; i++) {
      await Contact.findByIdAndUpdate(parties[i]._id, {
        area_id: areas[partyAreaMap[i]]._id,
      });
    }
    console.log("✅ Parties linked to areas");

    const itemData = [
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

      {
        name: "Side Panel (Royal Enfield Classic)",
        sale: 3500,
        purchase: 2400,
        mrp: 4200,
        gst: 18,
        cat: 1,
        brand: 4,
        sup: 2,
        stock: 1,
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
        stock: 2,
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
        stock: 2,
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
        stock: 2,
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

      {
        name: "Carburetor (Bajaj Platina)",
        sale: 1500,
        purchase: 1000,
        mrp: 1800,
        gst: 18,
        cat: 7,
        brand: 0,
        sup: 0,
        stock: 1,
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

      {
        name: "Silencer Assembly (Royal Enfield)",
        sale: 5500,
        purchase: 3800,
        mrp: 6500,
        gst: 18,
        cat: 8,
        brand: 4,
        sup: 2,
        stock: 1,
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
        contact_id: suppliers[it.sup]._id,
      })),
    );
    console.log("✅ Items created:", items.length);

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
        challan_type: "sale",
        date: new Date(def.date),
        contact_id: parties[def.party]._id,
        items: cItems,
        ...totals,
        converted_to_bill: i < 5,
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
        challan_type: "sale",
        date: new Date(def.date),
        contact_id: parties[def.party]._id,
        items: cItems,
        ...totals,
        converted_to_bill: i < 2,
        is_gst: 0,
        user_id: userId,
      });
    }
    const challansNGST = await Challan.insertMany(nongstChallans);
    const allChallans = [...challansGST, ...challansNGST];
    console.log(
      `✅ Challans created: ${allChallans.length} (${challansGST.length} GST + ${challansNGST.length} NGST)`,
    );

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
        contact_id: parties[b.party]._id,
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
        contact_id: parties[b.party]._id,
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

    const purchaseChallans = await Challan.insertMany(
      purchaseDefs.map((p, i) => {
        const isGst = p.type === "GST" ? 1 : 0;
        const pItems = p.items.map(([itemIdx, qty, rate]) => {
          const grossAmt = round2(qty * rate);
          const gstPct = isGst ? itemData[itemIdx].gst : 0;
          const gstAmt = isGst ? round2((grossAmt * gstPct) / 100) : 0;
          const amount = round2(grossAmt + gstAmt);
          return {
            item_id: items[itemIdx]._id,
            quantity: qty,
            rate,
            discount: 0,
            special_discount: 0,
            gross_amount: grossAmt,
            discount_amount: 0,
            total_discount: 0,
            taxable_amount: grossAmt,
            gst_percent: gstPct,
            gst_amount: gstAmt,
            amount,
            is_gst: isGst,
          };
        });
        const totals = calcChallanTotals(pItems);
        const paidAmt = p.status === "paid" ? totals.amount : p.paid || 0;
        return {
          id: allChallans.length + i + 1,
          challan_no: `PUR-${p.type === "GST" ? "GST" : "NGST"}-${String(i + 1).padStart(3, "0")}`,
          challan_type: "purchase",
          date: new Date(p.date),
          contact_id: suppliers[p.sup]._id,
          items: pItems,
          ...totals,
          payment_status: p.status,
          paid_amount: paidAmt,
          is_gst: isGst,
          user_id: userId,
        };
      }),
    );
    console.log("✅ Purchase challans created:", purchaseChallans.length);

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

    const counterData = [
      { model_name: "Category", seq: categories.length },
      { model_name: "Brand", seq: brands.length },
      { model_name: "Hsn", seq: hsns.length },
      { model_name: "Contact", seq: suppliers.length + parties.length },
      { model_name: "Transport", seq: transports.length },
      { model_name: "Agent", seq: agents.length },
      { model_name: "Area", seq: areas.length },
      { model_name: "Item", seq: items.length },
      {
        model_name: "Challan",
        seq: allChallans.length + purchaseChallans.length,
      },
      { model_name: "Bill", seq: allBills.length },
    ];
    await Counter.insertMany(
      counterData.map((c) => ({ ...c, user_id: userId })),
    );
    console.log("✅ Counters initialized:", counterData.length);

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
    console.log(`║ HSN codes:      ${hsns.length}`.padEnd(39) + "║");
    console.log(
      `║ Contacts:       ${suppliers.length + parties.length} (${suppliers.length} sup + ${parties.length} party)`.padEnd(
        39,
      ) + "║",
    );
    console.log(`║ Transports:     ${transports.length}`.padEnd(39) + "║");
    console.log(`║ Agents:         ${agents.length}`.padEnd(39) + "║");
    console.log(`║ Areas:          ${areas.length}`.padEnd(39) + "║");
    console.log(`║ Items:          ${items.length}`.padEnd(39) + "║");
    console.log(
      `║ Sale Challans:  ${allChallans.length} (${challansGST.length} GST + ${challansNGST.length} NGST)`.padEnd(
        39,
      ) + "║",
    );
    console.log(
      `║ Purchase Challans: ${purchaseChallans.length}`.padEnd(39) + "║",
    );
    console.log(
      `║ Bills:          ${allBills.length} (${gstBills.length} GST + ${nongstBills.length} NGST)`.padEnd(
        39,
      ) + "║",
    );
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
