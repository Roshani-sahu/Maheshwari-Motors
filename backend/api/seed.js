import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
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
  Department,
  Subscription,
} from "../src/models/index.js";

const SALT = 10;

/* ═══════════════════════════════════════════════════════════
   Guaranteed minimums per variant / type in every collection
   ═══════════════════════════════════════════════════════════ */
const C = {
  secondaryUsers: 30,

  hsnActive: 15,
  hsnInactive: 5, // total 20

  categories: 12,
  brands: 20,
  transports: 25,

  gstParties: 45, // contact type=party, is_gst=1
  nongstParties: 45, // contact type=party, is_gst=0
  gstSuppliers: 35, // contact type=supplier, is_gst=1
  nongstSuppliers: 35, // contact type=supplier, is_gst=0

  agents: 30,
  areas: 30,
  departments: 10,

  gstItems: 140,
  nongstItems: 140,

  // first N sale challans per GST type are billed
  gstSale: 180,
  gstPurchase: 120,
  nongstSale: 180,
  nongstPurchase: 120,

  gstBills: 130,
  nongstBills: 130,

  reportsPerType: 40, // × 5 report_types = 200 total
};

/* ═══════════ Reference data ═══════════ */
const STATES = {
  Rajasthan: ["Jaipur", "Udaipur", "Jodhpur", "Kota", "Ajmer"],
  Maharashtra: ["Mumbai", "Pune", "Nagpur", "Nashik"],
  Gujarat: ["Ahmedabad", "Surat", "Vadodara", "Rajkot"],
  "Uttar Pradesh": ["Lucknow", "Noida", "Agra", "Kanpur"],
  Karnataka: ["Bengaluru", "Mysuru", "Hubballi"],
  Delhi: ["New Delhi", "Dwarka", "Rohini"],
  Haryana: ["Gurugram", "Faridabad", "Panipat"],
  Punjab: ["Ludhiana", "Amritsar", "Jalandhar"],
};

const STN = {
  Rajasthan: "08",
  Maharashtra: "27",
  Gujarat: "24",
  "Uttar Pradesh": "09",
  Karnataka: "29",
  Delhi: "07",
  Haryana: "06",
  Punjab: "03",
};
const STA = {
  Rajasthan: "RJ",
  Maharashtra: "MH",
  Gujarat: "GJ",
  "Uttar Pradesh": "UP",
  Karnataka: "KA",
  Delhi: "DL",
  Haryana: "HR",
  Punjab: "PB",
};
const BNK = [
  { n: "State Bank of India", c: "SBIN" },
  { n: "HDFC Bank", c: "HDFC" },
  { n: "ICICI Bank", c: "ICIC" },
  { n: "Axis Bank", c: "UTIB" },
  { n: "Punjab National Bank", c: "PUNB" },
  { n: "Bank of Baroda", c: "BARB" },
];
const FIRST = [
  "Aarav",
  "Vivaan",
  "Aditya",
  "Arjun",
  "Sai",
  "Rohan",
  "Kunal",
  "Suresh",
  "Mahesh",
  "Vikram",
  "Nitin",
  "Prakash",
  "Ravi",
  "Deepak",
  "Amit",
  "Rajesh",
  "Hemant",
  "Naveen",
  "Mukesh",
  "Sanjay",
];
const LAST = [
  "Sharma",
  "Verma",
  "Gupta",
  "Agarwal",
  "Jain",
  "Singh",
  "Patel",
  "Joshi",
  "Saxena",
  "Mehta",
  "Tripathi",
  "Chaudhary",
  "Pandey",
  "Yadav",
  "Mishra",
  "Rathore",
  "Chauhan",
  "Tiwari",
  "Dubey",
  "Maheshwari",
];
const HSN_DATA = [
  ["8409", "Engine parts", 18],
  ["8421", "Filters and purifiers", 18],
  ["8482", "Bearings", 18],
  ["8483", "Gears and shafts", 18],
  ["8507", "Vehicle batteries", 28],
  ["8511", "Ignition equipment", 18],
  ["8512", "Lighting equipment", 18],
  ["8539", "Lamps", 18],
  ["8708", "Motor vehicle parts", 28],
  ["8711", "Motorcycles", 28],
  ["8714", "Motorcycle parts", 28],
  ["4011", "Tyres", 28],
  ["4013", "Inner tubes", 28],
  ["6813", "Brake linings", 18],
  ["7318", "Nuts and bolts", 18],
  ["7320", "Springs", 18],
  ["7326", "Steel parts", 18],
  ["3926", "Plastic parts", 18],
  ["3403", "Lubricants", 18],
  ["2710", "Petroleum preparations", 18],
];
const CAT_DATA = [
  ["Engine Components", "Piston, valves, timing parts"],
  ["Fuel and Air", "Carburetor, injector, filters"],
  ["Electrical", "Coils, CDI, harness"],
  ["Body and Frame", "Panels and mudguards"],
  ["Brakes", "Pads, shoes, discs"],
  ["Suspension", "Forks, shocks, bushes"],
  ["Transmission", "Clutch, sprocket, chain"],
  ["Exhaust", "Silencer and manifold"],
  ["Tyres and Tubes", "Tyres, tubes, valves"],
  ["Lubricants", "Engine oil and fluids"],
  ["Accessories", "Mirror and guards"],
  ["Service Consumables", "Sealant and cleaners"],
];
const BRAND_NAMES = [
  "Royal Enfield Genuine",
  "Hero Genuine",
  "Honda Genuine",
  "Bajaj Auto",
  "TVS Motor",
  "Yamaha Genuine",
  "Suzuki Genuine",
  "KTM Original",
  "Bosch Automotive",
  "Minda Industries",
  "Endurance Components",
  "Lumax Auto",
  "Gabriel India",
  "Rane Steering",
  "SKF Bearings",
  "Exide Mobility",
  "Amaron Battery",
  "Castrol Bike",
  "Motul India",
  "CEAT Tyres",
];
const ADJ = [
  "Front",
  "Rear",
  "Premium",
  "Heavy Duty",
  "Standard",
  "Performance",
  "Universal",
  "OEM",
  "Touring",
  "Racing",
];
const PART = [
  "Brake Pad",
  "Brake Shoe",
  "Clutch Plate",
  "Chain Sprocket",
  "Air Filter",
  "Oil Filter",
  "Fuel Pump",
  "Spark Plug",
  "Headlamp Unit",
  "Tail Lamp",
  "Shock Absorber",
  "Fork Seal Kit",
  "Throttle Cable",
  "Clutch Cable",
  "Bearing Set",
  "Piston Kit",
  "Gasket Set",
  "Silencer",
  "Starter Relay",
  "Mirror Pair",
];
const MDL = [
  "Classic 350",
  "Bullet 350",
  "Hunter 350",
  "Meteor 350",
  "Pulsar 150",
  "Pulsar 220",
  "Dominar 400",
  "Apache RTR 160",
  "Activa 6G",
  "Shine 125",
  "Splendor Plus",
  "Glamour XTEC",
  "FZ-S V3",
  "R15 V4",
  "Gixxer 155",
  "Access 125",
  "Duke 200",
  "Duke 390",
];
const REPORT_TYPES = ["challan", "bill", "inventory", "transaction", "other"];

/* ═══════════ Utility helpers ═══════════ */
const p = (a) => a[Math.floor(Math.random() * a.length)];
const ri = (m, x) => Math.floor(Math.random() * (x - m + 1)) + m;
const coin = (q) => Math.random() * 100 < q;
const rd = (n) => Math.round(n * 100) / 100;
const pad = (n, l) => String(n).padStart(l, "0");
const sh = (a) => {
  const z = [...a];
  for (let i = z.length - 1; i > 0; i--) {
    const j = ri(0, i);
    [z[i], z[j]] = [z[j], z[i]];
  }
  return z;
};
const smp = (a, c) =>
  c <= 0 ? []
  : c >= a.length ? [...a]
  : sh(a).slice(0, c);
const ph = () =>
  `${ri(6, 9)}${Array.from({ length: 9 }, () => ri(0, 9)).join("")}`;
const nm = () => `${p(FIRST)} ${p(LAST)}`;
const sl = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
const dt = (d = 365) => {
  const n = Date.now();
  return new Date(ri(n - d * 86400000, n));
};
const dta = (b, mn = 1, mx = 12) =>
  new Date(b.getTime() + ri(mn, mx) * 86400000);
const adr = () =>
  `${ri(1, 499)}, ${p(["Industrial Area", "Transport Nagar", "Civil Lines", "Mansarovar", "MI Road", "Shastri Nagar"])} ${p(["Road", "Marg", "Street", "Avenue", "Lane"])}`;
const pan = (i) => {
  const c = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return `${c[(i + 3) % 26]}${c[(i * 5 + 7) % 26]}${c[(i * 7 + 9) % 26]}${c[(i * 11 + 13) % 26]}${c[(i * 13 + 17) % 26]}${pad((i * 97) % 10000, 4)}${c[(i * 17 + 19) % 26]}`;
};
const gstin = (s, i) => `${STN[s] || "08"}${pan(i)}1Z5`;
const cinNo = (s, i) =>
  `U${pad((i * 37) % 100000, 5)}${STA[s] || "RJ"}${2010 + (i % 14)}PTC${pad((i * 71) % 1000000, 6)}`;
const ifcCode = (c, i) => `${c}0${pad((i * 13) % 1000000, 6)}`;
const accNo = (i) =>
  `${pad((i * 913) % 1000000000, 9)}${pad((i * 29) % 1000, 3)}`;

const usedBarcodes = new Set();
const bc = () => {
  const z = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let b;
  do {
    const bytes = crypto.randomBytes(10);
    b = "";
    for (let i = 0; i < 10; i++) b += z[bytes[i] % z.length];
  } while (usedBarcodes.has(b));
  usedBarcodes.add(b);
  return b;
};
const iname = (i) => `${p(ADJ)} ${p(PART)} ${p(MDL)} ${pad(i + 1, 3)}`;

const calcLine = ({ q, rate, d, s, da, g }) => {
  const gr = rd(q * rate);
  const afterDisc = rd(gr * (1 - d / 100));
  const afterSpec = rd(afterDisc * (1 - s / 100));
  const tx = rd(Math.max(0, afterSpec - da));
  const ga = rd(tx * (g / 100));
  const am = rd(tx + ga);
  const td = rd(gr - tx);
  return { gr, tx, ga, am, td };
};

/** Deterministic payment status spread across a group */
const payStatus = (idx, total, amount) => {
  const third = Math.floor(total / 3);
  if (idx < third) return { status: "paid", paid: amount };
  if (idx < third * 2)
    return { status: "due", paid: rd(amount * (ri(10, 75) / 100)) };
  if (idx < total - Math.max(1, Math.floor(total / 10)))
    return { status: "due", paid: rd(amount * (ri(5, 50) / 100)) };
  return { status: "overpaid", paid: rd(amount * (1 + ri(1, 15) / 100)) };
};

/* ═══════════════════════════════════════════════════════════
   MAIN SEED
   ═══════════════════════════════════════════════════════════ */
async function seed() {
  if (!env.MONGODB_URI) throw new Error("MONGODB_URI is missing");
  await mongoose.connect(env.MONGODB_URI);
  console.log("Connected. Clearing all collections…");

  const dropOrder = [
    Session,
    Bill,
    Challan,
    Item,
    Contact,
    Agent,
    Area,
    Department,
    Transport,
    Brand,
    Category,
    Hsn,
    Report,
    Counter,
    Subscription,
    User,
  ];
  for (const M of dropOrder) await M.deleteMany({});

  /* ── 1. USERS ── */
  const ah = await bcrypt.hash("Admin@1234", SALT);
  const fh = await bcrypt.hash("Test@1234", SALT);
  const staffHash = await bcrypt.hash("Staff@1234", SALT);

  const main = await User.create({
    type: "main",
    name: "Ramesh Maheshwari",
    email: "ramesh.maheshwari@maheshwarimotors.in",
    phone: "9876543210",
    admin: { username: "admin_user", password: ah },
    gst_firm: {
      username: "gst_user",
      password: fh,
      name: "Maheshwari Motors Pvt Ltd",
      phone: "9876543211",
      email: "accounts.gst@maheshwarimotors.in",
      address: "102, Industrial Area Road",
      godown_address: "45, Sitapura Godown Complex",
      city: "Jaipur",
      state: "Rajasthan",
      GSTIN: gstin("Rajasthan", 1),
      CIN: cinNo("Rajasthan", 1),
      reg_number: "MM-GST-001",
      bank_name: BNK[0].n,
      bank_branch: "MI Road Branch",
      ifsc_code: ifcCode(BNK[0].c, 101),
      account_number: accNo(1001),
    },
    nongst_firm: {
      username: "nongst_user",
      password: fh,
      name: "Maheshwari Motors",
      phone: "9876543212",
      email: "accounts@maheshwarimotors.in",
      address: "103, Industrial Area Road",
      godown_address: "46, Sitapura Godown Complex",
      city: "Jaipur",
      state: "Rajasthan",
      CIN: cinNo("Rajasthan", 2),
      reg_number: "MM-NGST-001",
      bank_name: BNK[1].n,
      bank_branch: "Tonk Road Branch",
      ifsc_code: ifcCode(BNK[1].c, 102),
      account_number: accNo(1002),
    },
    is_active: true,
  });

  const secDocs = [];
  for (let i = 1; i <= C.secondaryUsers; i++) {
    const n = nm();
    const st = p(Object.keys(STATES));
    const ct = p(STATES[st]);
    const bk = p(BNK);
    secDocs.push({
      type: "secondary",
      name: n,
      email: `${sl(n)}.${i}@maheshwarimotors.in`,
      phone: ph(),
      gst_firm: {
        username: `gst_staff_${pad(i, 3)}`,
        password: staffHash,
        name: `${n.split(" ")[0]} Auto GST Unit`,
        phone: ph(),
        email: `gst.${sl(n)}.${i}@maheshwarimotors.in`,
        address: adr(),
        godown_address: coin(55) ? adr() : undefined,
        city: ct,
        state: st,
        GSTIN: gstin(st, i + 10),
        CIN: cinNo(st, i + 10),
        reg_number: `REG-GST-${pad(i, 4)}`,
        bank_name: bk.n,
        bank_branch: `${ct} Main`,
        ifsc_code: ifcCode(bk.c, i + 200),
        account_number: accNo(i + 2000),
      },
      nongst_firm: {
        username: `nongst_staff_${pad(i, 3)}`,
        password: staffHash,
        name: `${n.split(" ")[0]} Auto Trade`,
        phone: ph(),
        email: `nongst.${sl(n)}.${i}@maheshwarimotors.in`,
        address: adr(),
        godown_address: coin(40) ? adr() : undefined,
        city: ct,
        state: st,
        CIN: cinNo(st, i + 200),
        reg_number: `REG-NGST-${pad(i, 4)}`,
        bank_name: bk.n,
        bank_branch: `${ct} Trade`,
        ifsc_code: ifcCode(bk.c, i + 300),
        account_number: accNo(i + 3000),
      },
      is_active: i <= 8, // 8 active, 2 inactive
    });
  }
  const staff = await User.insertMany(secDocs);
  const users = [main, ...staff];
  const uid = main._id;
  console.log(
    `✓ Users: ${users.length} (1 main + ${staff.length} secondary, 8 active + 2 inactive)`,
  );

  /* ── 1B. SUBSCRIPTIONS (demo + paid mix for secondary users) ── */
  const subDocs = staff.map((u, i) => {
    const now = new Date();
    const isDemo = i < Math.ceil(staff.length / 3);
    const timeline =
      isDemo
        ? { years: 0, months: 0, days: 30 }
        : { years: ri(0, 2), months: ri(0, 11), days: ri(0, 20) };

    const start = dta(now, -ri(10, 120), 0);
    const expiry = new Date(start);
    expiry.setFullYear(expiry.getFullYear() + timeline.years);
    expiry.setMonth(expiry.getMonth() + timeline.months);
    expiry.setDate(expiry.getDate() + timeline.days);

    const status =
      !u.is_active ?
        "cancelled"
      : expiry < now ?
        "expired"
      : "active";

    return {
      user_id: u._id,
      plan_type: isDemo ? "demo" : "paid",
      status,
      timeline,
      start_date: start,
      expiry_date: expiry,
      activated_by: main._id,
      activated_at: dta(start, 0, 6),
      last_extended_at: dta(start, 0, 8),
      notes:
        isDemo ?
          "Auto demo plan from seed data"
        : "Admin activated paid plan (seed data)",
      history: [],
      createdAt: dta(start, 0, 2),
      updatedAt: dta(start, 0, 9),
    };
  });

  await Subscription.insertMany(subDocs);
  console.log(`✓ Subscriptions: ${subDocs.length}`);

  /* ── 2. SESSIONS ── */
  const sessionDocs = [];
  const pushS = (id, role, ft) =>
    sessionDocs.push({
      user_id: id,
      role,
      firm_type: ft,
      token: `sess_${crypto.randomBytes(24).toString("hex")}`,
      device_name: `${p(["Chrome", "Firefox", "Edge", "App"])} ${p(["Windows", "Android", "iPhone", "Mac"])}`,
      device_type: p(["web", "android", "ios", "desktop"]),
      ip_address: `103.${ri(10, 240)}.${ri(1, 254)}.${ri(1, 254)}`,
      last_active: dt(14),
    });
  pushS(main._id, "admin");
  pushS(main._id, "admin");
  pushS(main._id, "firm", "GST");
  pushS(main._id, "firm", "NON_GST");
  for (const u of staff) {
    if (!u.is_active) continue;
    pushS(u._id, "firm", "GST");
    pushS(u._id, "firm", "NON_GST");
  }
  await Session.insertMany(sessionDocs);
  console.log(`✓ Sessions: ${sessionDocs.length}`);

  /* ── 3. HSN (${C.hsnActive} active + ${C.hsnInactive} inactive) ── */
  const hsnDocs = HSN_DATA.map(([h, d, g], i) => ({
    id: i + 1,
    hsn_code: h,
    description: d,
    gst_rate: g,
    is_active: i < C.hsnActive,
    user_id: uid,
  }));
  const hsns = await Hsn.insertMany(hsnDocs);
  const activeHsns = hsns.filter((h) => h.is_active);
  console.log(
    `✓ HSN: ${hsns.length} (${activeHsns.length} active + ${hsns.length - activeHsns.length} inactive)`,
  );

  /* ── 4. CATEGORIES ── */
  const cats = await Category.insertMany(
    CAT_DATA.map(([n, d], i) => ({
      id: i + 1,
      name: n,
      description: d,
      user_id: uid,
    })),
  );
  console.log(`✓ Categories: ${cats.length}`);

  /* ── 5. BRANDS ── */
  const brands = await Brand.insertMany(
    BRAND_NAMES.map((n, i) => {
      const n1 = ri(4, 18),
        n2 = ri(2, 10);
      return {
        id: i + 1,
        name: n,
        discount1: { normal: n1, special: n1 + ri(1, 6) },
        discount2: { normal: n2, special: n2 + ri(1, 4) },
        hsn_id: p(activeHsns)._id,
        item_ids: [],
        user_id: uid,
      };
    }),
  );
  const brandIds = brands.map((b) => b._id);
  for (const c of cats) {
    const selectedBrandIds = smp(brandIds, ri(4, 8));
    const mkLabel = (labelName) => ({
      name: labelName,
      description: `${labelName} pricing for ${c.name}`,
      is_active: true,
      brand_discounts: selectedBrandIds.map((brandId) => {
        const d1n = rd(ri(0, 300) / 100);
        const d1s = rd(ri(0, 200) / 100);
        const d2n = rd(ri(0, 300) / 100);
        const d2s = rd(ri(0, 200) / 100);
        return {
          brand_id: brandId,
          item_ids: [],
          disc1: { normal: d1n, special: d1s },
          disc2: { normal: d2n, special: d2s },
        };
      }),
    });

    await Category.findByIdAndUpdate(c._id, {
      brand_ids: selectedBrandIds,
      labels: [mkLabel("Label A"), mkLabel("Label B")],
    });
  }
  console.log(`✓ Brands: ${brands.length}`);

  /* ── 6. TRANSPORTS ── */
  const transports = await Transport.insertMany(
    Array.from({ length: C.transports }, (_, i) => {
      const st = p(Object.keys(STATES));
      const ct = p(STATES[st]);
      return {
        id: i + 1,
        name: `${p(["Shree", "Rajasthan", "National", "Metro", "Swift", "Prime", "Reliable", "Om"])} ${p(["Transport", "Roadways", "Logistics", "Carriers"])} ${ct}`,
        address: adr(),
        city: ct,
        pincode: `${ri(300000, 799999)}`,
        phone: ph(),
        whatsapp: coin(75) ? ph() : undefined,
        gstin: coin(78) ? gstin(st, i + 400) : undefined,
        user_id: uid,
      };
    }),
  );
  console.log(`✓ Transports: ${transports.length}`);

  /* ── 7. CONTACTS (deterministic type × is_gst) ── */
  let contactSeq = 0;

  const mkContacts = (count, type, isGst, seedOffset) =>
    Array.from({ length: count }, (_, i) => {
      contactSeq++;
      const st = p(Object.keys(STATES));
      const ct = p(STATES[st]);
      const bk = p(BNK);
      const prefix =
        type === "party" ?
          p(["Shiv", "Ganesh", "Balaji", "Sai", "Raj", "Vardhman"])
        : p(["Reliable", "National", "Prime", "Western", "Udaan", "Aditya"]);
      const suffix =
        type === "party" ?
          p([
            "Auto House",
            "Automobiles",
            "Motor Parts",
            "Spare Centre",
            "Auto Hub",
          ])
        : p([
            "Distributors",
            "Supply Co",
            "Parts Depot",
            "Industrial Suppliers",
            "Bulk Traders",
          ]);
      const n = `${prefix} ${suffix} ${ct} ${pad(contactSeq, 2)}`;
      const domain =
        type === "party" ? "dealer.example.in" : "supply.example.in";
      const s = seedOffset + i;
      return {
        id: contactSeq,
        name: n,
        alias: coin(45) ? `${prefix}-${pad(contactSeq, 2)}` : null,
        type,
        phone: ph(),
        whatsapp_number: coin(80) ? ph() : undefined,
        email: `${sl(n)}@${domain}`,
        address: adr(),
        city: ct,
        state: st,
        gstin: isGst ? gstin(st, s + 700) : undefined,
        cin: coin(40) ? cinNo(st, s + 700) : undefined,
        reg_number:
          coin(70) ?
            `${type === "party" ? "PTY" : "SUP"}-${pad(contactSeq, 5)}`
          : undefined,
        signature:
          type === "party" && coin(42) ?
            `https://cdn.maheshwarimotors.dev/signatures/${sl(n)}.png`
          : null,
        assigned_label: type === "party" ? p(["Label A", "Label B"]) : null,
        banks: [
          {
            bank_name: bk.n,
            bank_branch: `${ct} Commercial`,
            ifsc_code: ifcCode(bk.c, s + 700),
            account_number: accNo(s + 7000),
            account_holder: n,
            upi_id: `${sl(prefix)}${pad(contactSeq, 2)}@upi`,
            is_default: true,
          },
        ],
        item_discounts: [],
        bank_name: bk.n,
        bank_branch: `${ct} Commercial`,
        ifsc_code: ifcCode(bk.c, s + 700),
        account_number: accNo(s + 7000),
        transport_charge: ri(40, 420),
        area:
          coin(55) ?
            p([
              "Industrial Area",
              "Civil Lines",
              "Transport Nagar",
              "Main Market",
              "Old City",
            ])
          : undefined,
        is_gst: isGst,
        category_id: p(cats)._id,
        transport_id: type === "party" && coin(68) ? p(transports)._id : null,
        agent_id: null,
        area_id: null,
        balance: 0,
        user_id: uid,
      };
    });

  const gstParties = await Contact.insertMany(
    mkContacts(C.gstParties, "party", 1, 100),
  );
  const nongstParties = await Contact.insertMany(
    mkContacts(C.nongstParties, "party", 0, 200),
  );
  const gstSuppliers = await Contact.insertMany(
    mkContacts(C.gstSuppliers, "supplier", 1, 300),
  );
  const nongstSuppliers = await Contact.insertMany(
    mkContacts(C.nongstSuppliers, "supplier", 0, 400),
  );

  const allParties = [...gstParties, ...nongstParties];
  const allSuppliers = [...gstSuppliers, ...nongstSuppliers];
  const allContacts = [...allParties, ...allSuppliers];

  console.log(`✓ Contacts: ${allContacts.length}`);
  console.log(
    `    GST Parties: ${gstParties.length}  |  Non-GST Parties: ${nongstParties.length}`,
  );
  console.log(
    `    GST Suppliers: ${gstSuppliers.length}  |  Non-GST Suppliers: ${nongstSuppliers.length}`,
  );

  /* ── 8. AGENTS ── */
  const agents = await Agent.insertMany(
    Array.from({ length: C.agents }, (_, i) => ({
      id: i + 1,
      name: nm(),
      address: adr(),
      city: p(Object.values(STATES).flat()),
      pincode: `${ri(300000, 799999)}`,
      phone: ph(),
      whatsapp: coin(70) ? ph() : undefined,
      party_id: allParties[i % allParties.length]._id,
      user_id: uid,
    })),
  );
  console.log(`✓ Agents: ${agents.length}`);

  /* ── 9. AREAS ── */
  const areas = await Area.insertMany(
    Array.from({ length: C.areas }, (_, i) => {
      const st = p(Object.keys(STATES));
      return {
        id: i + 1,
        city: p(STATES[st]),
        state: st,
        pincode: `${ri(300000, 799999)}`,
        phone: coin(68) ? ph() : undefined,
        whatsapp: coin(52) ? ph() : undefined,
        agent_id: coin(60) ? agents[i % agents.length]._id : null,
        transport_id: coin(65) ? transports[i % transports.length]._id : null,
        user_id: uid,
      };
    }),
  );
  console.log(`✓ Areas: ${areas.length}`);

  /* Link agents + areas to parties */
  const partyBulk = allParties
    .map((x, i) => {
      const set = {};
      if (coin(58)) set.agent_id = agents[i % agents.length]._id;
      if (coin(62)) set.area_id = areas[i % areas.length]._id;
      if (coin(52)) set.transport_id = transports[i % transports.length]._id;
      if (!Object.keys(set).length) return null;
      return { updateOne: { filter: { _id: x._id }, update: { $set: set } } };
    })
    .filter(Boolean);
  if (partyBulk.length) await Contact.bulkWrite(partyBulk);

  /* ── 10. DEPARTMENTS ── */
  const DEPT_NAMES = [
    "Service",
    "Sales",
    "Spare Parts",
    "Accounts",
    "Warehouse",
    "Purchase",
    "Quality Control",
    "Logistics",
    "Workshop",
    "Administration",
  ];
  const departments = await Department.insertMany(
    DEPT_NAMES.slice(0, C.departments).map((name, i) => ({
      id: i + 1,
      name,
      user_id: uid,
    })),
  );
  console.log(`✓ Departments: ${departments.length}`);

  /* ── 11. ITEMS (deterministic GST / non-GST) ── */
  const freshCats = await Category.find({ user_id: uid }).lean();
  const catBrandMap = new Map(
    freshCats.map((c) => [String(c._id), (c.brand_ids || []).map(String)]),
  );
  let itemIdSeq = 60001;

  const mkItems = (count, isGst, startIdx) =>
    Array.from({ length: count }, (_, i) => {
      const idx = startIdx + i;
      const cat = cats[idx % cats.length];
      const map = catBrandMap.get(String(cat._id)) || [];
      const br =
        map.length ?
          brands.find((q) => String(q._id) === p(map))
        : brands[idx % brands.length];
      const sup = allSuppliers[idx % allSuppliers.length];
      const gp = isGst ? p([5, 12, 18, 28]) : 0;
      const pr = rd(ri(70, 4200) + ri(-20, 90));
      const sr = rd(pr * (1 + ri(12, 45) / 100));
      const mr = rd(sr * (1 + ri(8, 25) / 100));
      const physicalStock = ri(12, 260);
      const logicalStock = isGst ? 0 : rd(ri(-220, 320) / 10);
      return {
        id: idx + 1,
        item_name: iname(idx),
        barcode: bc(),
        item_id: itemIdSeq++,
        sale_rate: sr,
        purchase_rate: pr,
        mrp_rate: mr,
        gst_percent: gp,
        discount: ri(0, 15),
        stock: physicalStock,
        physical_stock: physicalStock,
        logical_stock: logicalStock,
        threshold: ri(4, 30),
        image:
          coin(12) ?
            `https://cdn.maheshwarimotors.dev/items/item-${pad(idx + 1, 4)}.jpg`
          : undefined,
        is_gst: isGst,
        user_id: uid,
        category_id: cat._id,
        brand_id: br?._id,
        contact_id: sup._id,
        dept_id: departments[idx % departments.length]._id,
      };
    });

  const allItemDocs = [
    ...mkItems(C.gstItems, 1, 0),
    ...mkItems(C.nongstItems, 0, C.gstItems),
  ];
  const items = await Item.insertMany(allItemDocs);
  const gstItems = items.filter((i) => i.is_gst === 1);
  const nongstItems = items.filter((i) => i.is_gst === 0);

  // Sync brand → item_ids
  const brandItemMap = new Map();
  for (const it of items) {
    const k = String(it.brand_id);
    if (!brandItemMap.has(k)) brandItemMap.set(k, []);
    brandItemMap.get(k).push(it._id);
  }
  await Brand.bulkWrite(
    brands.map((b) => ({
      updateOne: {
        filter: { _id: b._id },
        update: { $set: { item_ids: brandItemMap.get(String(b._id)) || [] } },
      },
    })),
  );
  console.log(
    `✓ Items: ${items.length} (${gstItems.length} GST + ${nongstItems.length} non-GST)`,
  );

  // Party-wise item discounts (additional layer over label discounts)
  const partyDiscountBulk = allParties.map((party, idx) => {
    const chosen = smp(items, ri(3, 8));
    const item_discounts = chosen.map((it) => ({
      item_id: it._id,
      discount1: {
        normal: rd(ri(0, 250) / 100),
        special: rd(ri(0, 150) / 100),
      },
      discount2: {
        normal: rd(ri(0, 220) / 100),
        special: rd(ri(0, 150) / 100),
      },
    }));

    return {
      updateOne: {
        filter: { _id: party._id },
        update: {
          $set: {
            item_discounts,
            assigned_label: idx % 2 === 0 ? "Label A" : "Label B",
          },
        },
      },
    };
  });

  if (partyDiscountBulk.length) await Contact.bulkWrite(partyDiscountBulk);
  console.log("✓ Party item discounts mapped");

  /* ── 11. CHALLANS (deterministic type × is_gst) ── */
  let challanSeq = 0;
  let cNoGstSale = 0,
    cNoNongstSale = 0,
    cNoGstPurchase = 0,
    cNoNongstPurchase = 0;

  const mkChallans = (challanType, isGst, contactPool, itemPool, count) =>
    Array.from({ length: count }, (_, idx) => {
      challanSeq++;
      const contact = contactPool[idx % contactPool.length];
      const firmBank = isGst === 1 ? main.gst_firm : main.nongst_firm;
      const contactBank =
        Array.isArray(contact.banks) && contact.banks.length > 0 ?
          contact.banks[0]
        : null;
      const numItems = ri(1, Math.min(5, itemPool.length));
      const chosenItems = smp(itemPool, numItems);

      const lines = chosenItems.map((it) => {
        const q = challanType === "sale" ? ri(1, 8) : ri(3, 24);
        const base = challanType === "sale" ? it.sale_rate : it.purchase_rate;
        const rate = rd(Math.max(1, base * (1 + ri(-8, 8) / 100)));
        const d = challanType === "sale" ? ri(0, 12) : ri(0, 4);
        const s = challanType === "sale" && coin(35) ? ri(0, 6) : 0;
        const da =
          challanType === "sale" && coin(22) ?
            rd(q * rate * (ri(0, 3) / 100))
          : 0;
        const g = isGst ? it.gst_percent || p([5, 12, 18, 28]) : 0;
        const z = calcLine({ q, rate, d, s, da, g });
        return {
          item_id: it._id,
          quantity: q,
          rate,
          discount: d,
          special_discount: s,
          gross_amount: z.gr,
          discount_amount: da,
          total_discount: z.td,
          taxable_amount: z.tx,
          gst_percent: g,
          gst_amount: z.ga,
          amount: z.am,
          is_gst: isGst,
        };
      });

      const gr = rd(lines.reduce((s, l) => s + l.gross_amount, 0));
      const sub = rd(lines.reduce((s, l) => s + l.amount, 0));
      const hd = challanType === "sale" ? ri(0, 8) : 0;
      const amt = challanType === "sale" ? rd(sub * (1 - hd / 100)) : sub;

      let no;
      if (challanType === "sale") {
        if (isGst === 1) {
          cNoGstSale++;
          no = `CH-${pad(cNoGstSale, 6)}`;
        } else {
          cNoNongstSale++;
          no = `CH-${pad(cNoNongstSale, 6)}`;
        }
      } else {
        if (isGst === 1) {
          cNoGstPurchase++;
          no = `PO-${pad(cNoGstPurchase, 6)}`;
        } else {
          cNoNongstPurchase++;
          no = `PO-${pad(cNoNongstPurchase, 6)}`;
        }
      }

      const { status, paid } = payStatus(idx, count, amt);
      const d = dt(300);

      return {
        _id: new mongoose.Types.ObjectId(),
        id: challanSeq,
        challan_no: no,
        challan_type: challanType,
        date: d,
        label_name: challanType === "sale" ? (contact.assigned_label ?? null) : null,
        contact_id: contact._id,
        from_bank:
          firmBank?.bank_name ?
            {
              bank_id: null,
              bank_name: firmBank.bank_name || "",
              bank_branch: firmBank.bank_branch || "",
              ifsc_code: firmBank.ifsc_code || "",
              account_number: firmBank.account_number || "",
              account_holder: firmBank.name || "",
            }
          : null,
        to_bank:
          contactBank ?
            {
              bank_id: contactBank._id || null,
              bank_name: contactBank.bank_name || "",
              bank_branch: contactBank.bank_branch || "",
              ifsc_code: contactBank.ifsc_code || "",
              account_number: contactBank.account_number || "",
              account_holder: contactBank.account_holder || contact.name || "",
            }
          : null,
        items: lines,
        gross_total: gr,
        sub_total: sub,
        discount: hd,
        amount: amt,
        converted_to_bill: false,
        bill_id: null,
        payment_status: status,
        paid_amount: paid,
        is_gst: isGst,
        linked_challan_id: null,
        user_id: uid,
        createdAt: d,
        updatedAt: d,
      };
    });

  const gstSaleChallans = mkChallans(
    "sale",
    1,
    gstParties,
    gstItems,
    C.gstSale,
  );
  const nongstSaleChallans = mkChallans(
    "sale",
    0,
    nongstParties,
    nongstItems,
    C.nongstSale,
  );
  const gstPurchaseChallans = mkChallans(
    "purchase",
    1,
    gstSuppliers,
    gstItems,
    C.gstPurchase,
  );
  const nongstPurchaseChallans = mkChallans(
    "purchase",
    0,
    nongstSuppliers,
    nongstItems,
    C.nongstPurchase,
  );

  // Link some GST ↔ non-GST sale challans
  const linkN = Math.min(5, gstSaleChallans.length, nongstSaleChallans.length);
  for (let i = 0; i < linkN; i++) {
    gstSaleChallans[i].linked_challan_id = nongstSaleChallans[i]._id;
    nongstSaleChallans[i].linked_challan_id = gstSaleChallans[i]._id;
  }

  const allChallans = [
    ...gstSaleChallans,
    ...nongstSaleChallans,
    ...gstPurchaseChallans,
    ...nongstPurchaseChallans,
  ];

  console.log(`✓ Challans: ${allChallans.length}`);
  console.log(
    `    GST Sale: ${gstSaleChallans.length}  |  Non-GST Sale: ${nongstSaleChallans.length}`,
  );
  console.log(
    `    GST Purchase: ${gstPurchaseChallans.length}  |  Non-GST Purchase: ${nongstPurchaseChallans.length}`,
  );

  /* ── 12. BILLS (first N sale challans → billed) ── */
  let billSeq = 0,
    bNoGst = 0,
    bNoNongst = 0;
  const gstBills = [];
  const nongstBills = [];
  const contactMap = new Map(allContacts.map((c) => [String(c._id), c]));

  // GST Bills — one challan per bill from first C.gstBills GST sale challans
  for (let idx = 0; idx < C.gstBills && idx < gstSaleChallans.length; idx++) {
    billSeq++;
    const chal = gstSaleChallans[idx];
    const ret = idx % 5 === 4 ? rd(chal.amount * (ri(2, 12) / 100)) : 0;
    const finalAmt = rd(Math.max(1, chal.amount - ret));
    const { status, paid } = payStatus(idx, C.gstBills, finalAmt);

    bNoGst++;
    const d = dta(new Date(chal.date), 1, 15);
    const oid = new mongoose.Types.ObjectId();

    chal.converted_to_bill = true;
    chal.bill_id = oid;
    const contact = contactMap.get(String(chal.contact_id));

    gstBills.push({
      _id: oid,
      id: billSeq,
      bill_no: `BL-${pad(bNoGst, 6)}`,
      date: d,
      contact_id: chal.contact_id,
      transport_id: contact?.transport_id || null,
      customer_name: contact?.name || "Customer",
      vehicle_number: `RJ${ri(10, 39)}${String.fromCharCode(65 + ri(0, 25))}${String.fromCharCode(65 + ri(0, 25))}${pad(ri(1000, 9999), 4)}`,
      transport_charge: rd(contact?.transport_charge || ri(40, 250)),
      amount: finalAmt,
      paid_amount: paid,
      return_amount: ret,
      payment_status: status,
      challan_ids: [chal._id],
      skip_stock_calculation: false,
      is_gst: 1,
      user_id: uid,
      createdAt: d,
      updatedAt: d,
    });
  }

  // Non-GST Bills
  for (
    let idx = 0;
    idx < C.nongstBills && idx < nongstSaleChallans.length;
    idx++
  ) {
    billSeq++;
    const chal = nongstSaleChallans[idx];
    const ret = idx % 5 === 4 ? rd(chal.amount * (ri(2, 12) / 100)) : 0;
    const finalAmt = rd(Math.max(1, chal.amount - ret));
    const { status, paid } = payStatus(idx, C.nongstBills, finalAmt);

    bNoNongst++;
    const d = dta(new Date(chal.date), 1, 15);
    const oid = new mongoose.Types.ObjectId();

    chal.converted_to_bill = true;
    chal.bill_id = oid;
    const contact = contactMap.get(String(chal.contact_id));

    nongstBills.push({
      _id: oid,
      id: billSeq,
      bill_no: `BL-${pad(bNoNongst, 6)}`,
      date: d,
      contact_id: chal.contact_id,
      transport_id: contact?.transport_id || null,
      customer_name: contact?.name || "Customer",
      vehicle_number: `RJ${ri(10, 39)}${String.fromCharCode(65 + ri(0, 25))}${String.fromCharCode(65 + ri(0, 25))}${pad(ri(1000, 9999), 4)}`,
      transport_charge: rd(contact?.transport_charge || ri(40, 250)),
      amount: finalAmt,
      paid_amount: paid,
      return_amount: ret,
      payment_status: status,
      challan_ids: [chal._id],
      skip_stock_calculation: true,
      is_gst: 0,
      user_id: uid,
      createdAt: d,
      updatedAt: d,
    });
  }

  const allBills = [...gstBills, ...nongstBills];

  await Challan.insertMany(allChallans);
  await Bill.insertMany(allBills);

  console.log(
    `✓ Bills: ${allBills.length} (${gstBills.length} GST + ${nongstBills.length} non-GST)`,
  );

  /* ── 13. CONTACT BALANCES ── */
  const balMap = new Map();
  const addBal = (id, delta) => {
    const k = String(id);
    balMap.set(k, rd((balMap.get(k) || 0) + delta));
  };
  for (const b of allBills) {
    addBal(b.contact_id, rd(b.paid_amount - b.amount));
    if (b.return_amount > 0) addBal(b.contact_id, b.return_amount);
  }
  for (const c of [...gstPurchaseChallans, ...nongstPurchaseChallans]) {
    addBal(c.contact_id, rd(c.paid_amount - c.amount));
  }
  await Contact.bulkWrite(
    allContacts.map((c) => {
      let bal = balMap.get(String(c._id)) || 0;
      if (Math.abs(bal) < 5) {
        const roll = ri(0, 2);
        if (roll === 0) bal = rd(ri(-9000, -300) / 10);
        else if (roll === 1) bal = rd(ri(300, 7000) / 10);
        else bal = 0;
      }
      return {
        updateOne: {
          filter: { _id: c._id },
          update: { $set: { balance: bal } },
        },
      };
    }),
  );
  console.log("✓ Contact balances updated");

  /* ── 14. REPORTS (10 per type × 5 types = 50, half GST / half non-GST) ── */
  const reportDocs = [];
  for (const rt of REPORT_TYPES) {
    for (let i = 0; i < C.reportsPerType; i++) {
      const isGst = i < C.reportsPerType / 2 ? 1 : 0;
      const d = dt(365);
      reportDocs.push({
        pdf_link: `https://reports.maheshwarimotors.dev/${d.getFullYear()}/${pad(d.getMonth() + 1, 2)}/report-${rt}-${pad(i + 1, 4)}.pdf`,
        date_created: d,
        user_id: ri(0, 3) === 0 && staff.length ? p(staff)._id : uid,
        is_gst: isGst,
        report_type: rt,
        createdAt: d,
        updatedAt: d,
      });
    }
  }
  await Report.insertMany(reportDocs);
  console.log(
    `✓ Reports: ${reportDocs.length} (${C.reportsPerType} per type × ${REPORT_TYPES.length} types)`,
  );

  /* ── 15. COUNTERS ── */
  await Counter.insertMany([
    { model_name: "Category", user_id: uid, seq: cats.length },
    { model_name: "Brand", user_id: uid, seq: brands.length },
    { model_name: "Hsn", user_id: uid, seq: hsns.length },
    { model_name: "Contact", user_id: uid, seq: allContacts.length },
    { model_name: "Agent", user_id: uid, seq: agents.length },
    { model_name: "Transport", user_id: uid, seq: transports.length },
    { model_name: "Area", user_id: uid, seq: areas.length },
    { model_name: "Department", user_id: uid, seq: departments.length },
    { model_name: "Item", user_id: uid, seq: items.length },
    { model_name: "ItemId", user_id: uid, seq: itemIdSeq - 1 },
    { model_name: "Challan", user_id: uid, seq: allChallans.length },
    { model_name: "Bill", user_id: uid, seq: allBills.length },
    { model_name: "ChallanNo_GST", user_id: uid, seq: cNoGstSale },
    { model_name: "ChallanNo_NONGST", user_id: uid, seq: cNoNongstSale },
    { model_name: "PurchaseNo_GST", user_id: uid, seq: cNoGstPurchase },
    { model_name: "PurchaseNo_NONGST", user_id: uid, seq: cNoNongstPurchase },
    { model_name: "BillNo_GST", user_id: uid, seq: bNoGst },
    { model_name: "BillNo_NONGST", user_id: uid, seq: bNoNongst },
  ]);
  console.log("✓ Counters synced");

  /* ── SUMMARY ── */
  console.log("\n══════════════════════════════════════════════════════════");
  console.log("  SEED COMPLETE — Type breakdown per collection");
  console.log("══════════════════════════════════════════════════════════");
  console.log(
    `  Users           : ${users.length} (1 main + ${staff.length} secondary [8 active, 2 inactive])`,
  );
  console.log(`  Subscriptions   : ${subDocs.length}`);
  console.log(`  Sessions        : ${sessionDocs.length}`);
  console.log(
    `  HSN             : ${hsns.length} (${activeHsns.length} active + ${hsns.length - activeHsns.length} inactive)`,
  );
  console.log(`  Categories      : ${cats.length}`);
  console.log(`  Brands          : ${brands.length}`);
  console.log(`  Transports      : ${transports.length}`);
  console.log(`  Contacts        : ${allContacts.length}`);
  console.log(`    GST Parties     : ${gstParties.length}`);
  console.log(`    Non-GST Parties : ${nongstParties.length}`);
  console.log(`    GST Suppliers   : ${gstSuppliers.length}`);
  console.log(`    Non-GST Suppliers: ${nongstSuppliers.length}`);
  console.log(`  Agents          : ${agents.length}`);
  console.log(`  Areas           : ${areas.length}`);
  console.log(`  Departments     : ${departments.length}`);
  console.log(
    `  Items           : ${items.length} (${gstItems.length} GST + ${nongstItems.length} non-GST)`,
  );
  console.log(`  Challans        : ${allChallans.length}`);
  console.log(
    `    GST Sale        : ${gstSaleChallans.length} (${gstBills.length} billed + ${gstSaleChallans.length - gstBills.length} unbilled)`,
  );
  console.log(
    `    Non-GST Sale    : ${nongstSaleChallans.length} (${nongstBills.length} billed + ${nongstSaleChallans.length - nongstBills.length} unbilled)`,
  );
  console.log(`    GST Purchase    : ${gstPurchaseChallans.length}`);
  console.log(`    Non-GST Purchase: ${nongstPurchaseChallans.length}`);
  console.log(
    `  Bills           : ${allBills.length} (${gstBills.length} GST + ${nongstBills.length} non-GST)`,
  );
  console.log(
    `  Reports         : ${reportDocs.length} (${C.reportsPerType}/type × ${REPORT_TYPES.length} types)`,
  );
  console.log("══════════════════════════════════════════════════════════");
  console.log("  Login credentials:");
  console.log("    Admin   : admin_user / Admin@1234");
  console.log("    GST Firm: gst_user / Test@1234");
  console.log("    Non-GST : nongst_user / Test@1234");
  console.log(
    `    Staff   : gst_staff_001..${pad(C.secondaryUsers, 3)} / Staff@1234`,
  );
  console.log(
    `              nongst_staff_001..${pad(C.secondaryUsers, 3)} / Staff@1234`,
  );
  console.log("══════════════════════════════════════════════════════════");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(async (e) => {
  console.error("Seed failed:", e);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});
