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
  Counter,
  Department,
  Subscription,
  Label,
  Bank,
  Transaction,
  Return,
} from "../src/models/index.js";

const SALT = 10;

const C = {
  secondaryUsers: 30,

  hsnActive: 15,
  hsnInactive: 5,

  labels: 2,
  brands: 20,
  transports: 25,

  gstParties: 45,
  nongstParties: 45,
  gstSuppliers: 35,
  nongstSuppliers: 35,

  agents: 30,
  areas: 30,
  departments: 10,

  gstItems: 140,
  nongstItems: 140,

  gstSale: 180,
  gstPurchase: 120,
  nongstSale: 180,
  nongstPurchase: 120,

  gstBills: 130,
  nongstBills: 130,

  multiBillCount: 20,

  reportsPerType: 40,

  gstTransactions: 60,
  nongstTransactions: 60,

  gstSaleReturns: 20,
  nongstSaleReturns: 20,
  gstPurchaseReturns: 15,
  nongstPurchaseReturns: 15,
};

const STATES = {
  Rajasthan: ["Jaipur", "Udaipur", "Jodhpur", "Kota", "Ajmer", "Bikaner"],
  Maharashtra: ["Mumbai", "Pune", "Nagpur", "Nashik", "Thane"],
  Gujarat: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar"],
  "Uttar Pradesh": ["Lucknow", "Noida", "Agra", "Kanpur", "Varanasi"],
  Karnataka: ["Bengaluru", "Mysuru", "Hubballi", "Mangaluru"],
  Delhi: ["New Delhi", "Dwarka", "Rohini", "Saket"],
  Haryana: ["Gurugram", "Faridabad", "Panipat", "Karnal"],
  Punjab: ["Ludhiana", "Amritsar", "Jalandhar", "Patiala"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem"],
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
  "Madhya Pradesh": "23",
  "Tamil Nadu": "33",
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
  "Madhya Pradesh": "MP",
  "Tamil Nadu": "TN",
};

const BNK = [
  { n: "State Bank of India", c: "SBIN" },
  { n: "HDFC Bank", c: "HDFC" },
  { n: "ICICI Bank", c: "ICIC" },
  { n: "Axis Bank", c: "UTIB" },
  { n: "Punjab National Bank", c: "PUNB" },
  { n: "Bank of Baroda", c: "BARB" },
  { n: "Kotak Mahindra Bank", c: "KKBK" },
  { n: "IndusInd Bank", c: "INDB" },
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
  "Ashok",
  "Pradeep",
  "Mohan",
  "Dinesh",
  "Ramesh",
  "Girish",
  "Kiran",
  "Anand",
  "Vijay",
  "Yogesh",
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
  "Soni",
  "Goyal",
  "Bansal",
  "Mittal",
  "Khanna",
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
  "Ultra",
  "Pro",
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
  "Engine Oil",
  "Brake Fluid",
  "Chain Lube",
  "Tyre Tube",
  "Wiring Harness",
  "CDI Unit",
  "Regulator Rectifier",
  "Speedometer Cable",
  "Handle Bar Grip",
  "Foot Rest",
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

const REPORT_TYPES = ["challan", "bill", "inventory", "transaction", "other"];

const LABEL_NAMES = ["Label A", "Label B"];

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
const dtBefore = (ref, minDays, maxDays) =>
  new Date(ref.getTime() - ri(minDays, maxDays) * 86400000);
const adr = () =>
  `${ri(1, 499)}, ${p(["Industrial Area", "Transport Nagar", "Civil Lines", "Mansarovar", "MI Road", "Shastri Nagar", "Vaishali Nagar", "Malviya Nagar", "Pratap Nagar"])} ${p(["Road", "Marg", "Street", "Avenue", "Lane"])}`;
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
const vehNo = () =>
  `RJ${ri(10, 39)}${String.fromCharCode(65 + ri(0, 25))}${String.fromCharCode(65 + ri(0, 25))}${pad(ri(1000, 9999), 4)}`;

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

const payStatus = (idx, total, amount) => {
  const third = Math.floor(total / 3);
  if (idx < third) return { status: "paid", paid: amount };
  if (idx < third * 2)
    return { status: "due", paid: rd(amount * (ri(10, 75) / 100)) };
  if (idx < total - Math.max(1, Math.floor(total / 10)))
    return { status: "due", paid: rd(amount * (ri(5, 50) / 100)) };
  return { status: "overpaid", paid: rd(amount * (1 + ri(1, 15) / 100)) };
};

async function seed() {
  if (!env.MONGODB_URI) throw new Error("MONGODB_URI is missing");
  await mongoose.connect(env.MONGODB_URI);
  console.log("Connected. Clearing all collections…");

  const dropOrder = [
    Return,
    Transaction,
    Session,
    Bill,
    Challan,
    Item,
    Contact,
    Agent,
    Area,
    Department,
    Transport,
    Label,
    Brand,
    Hsn,
    Report,
    Counter,
    Subscription,
    Bank,
    User,
  ];
  for (const M of dropOrder) await M.deleteMany({});

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
      bank_ids: [],
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
      bank_ids: [],
    },
    is_active: true,
  });

  let bankSeq = 0;
  const mainGstBank = await Bank.create({
    id: ++bankSeq,
    bank_name: BNK[0].n,
    bank_branch: "MI Road Branch",
    ifsc_code: ifcCode(BNK[0].c, 101),
    account_number: accNo(1001),
    account_holder: "Maheshwari Motors Pvt Ltd",
    upi_id: "",
    user_id: main._id,
  });
  const mainNongstBank = await Bank.create({
    id: ++bankSeq,
    bank_name: BNK[1].n,
    bank_branch: "Tonk Road Branch",
    ifsc_code: ifcCode(BNK[1].c, 102),
    account_number: accNo(1002),
    account_holder: "Maheshwari Motors",
    upi_id: "",
    user_id: main._id,
  });
  await User.findByIdAndUpdate(main._id, {
    "gst_firm.bank_ids": [mainGstBank._id],
    "nongst_firm.bank_ids": [mainNongstBank._id],
  });

  main.gst_firm.bank_ids = [mainGstBank._id];
  main.nongst_firm.bank_ids = [mainNongstBank._id];
  const mainGstBankDoc = mainGstBank;
  const mainNongstBankDoc = mainNongstBank;

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
        bank_ids: [],
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
        bank_ids: [],
      },
      is_active: i <= 8,
      _bankMeta: { bk, ct, i, st },
    });
  }
  const staff = await User.insertMany(
    secDocs.map(({ _bankMeta, ...rest }) => rest),
  );

  for (let si = 0; si < staff.length; si++) {
    const { bk, ct, i } = secDocs[si]._bankMeta;
    const gstBank = await Bank.create({
      id: ++bankSeq,
      bank_name: bk.n,
      bank_branch: `${ct} Main`,
      ifsc_code: ifcCode(bk.c, i + 200),
      account_number: accNo(i + 2000),
      account_holder: staff[si].gst_firm.name,
      upi_id: "",
      user_id: staff[si]._id,
    });
    const nongstBank = await Bank.create({
      id: ++bankSeq,
      bank_name: bk.n,
      bank_branch: `${ct} Trade`,
      ifsc_code: ifcCode(bk.c, i + 300),
      account_number: accNo(i + 3000),
      account_holder: staff[si].nongst_firm.name,
      upi_id: "",
      user_id: staff[si]._id,
    });
    await User.findByIdAndUpdate(staff[si]._id, {
      "gst_firm.bank_ids": [gstBank._id],
      "nongst_firm.bank_ids": [nongstBank._id],
    });
  }

  const users = [main, ...staff];
  const uid = main._id;
  console.log(
    `✓ Users: ${users.length} (1 main + ${staff.length} secondary, 8 active + ${C.secondaryUsers - 8} inactive)`,
  );

  const now = new Date();

  const mainSubStart = dtBefore(now, 30, 60);
  const mainSubExpiry = new Date(mainSubStart);
  mainSubExpiry.setFullYear(mainSubExpiry.getFullYear() + 1);
  const subDocs = [
    {
      user_id: main._id,
      plan_type: "paid",
      status: "active",
      timeline: { years: 1, months: 0, days: 0 },
      amount: 12000,
      start_date: mainSubStart,
      expiry_date: mainSubExpiry,
      activated_by: main._id,
      activated_at: mainSubStart,
      last_extended_at: null,
      notes: "Primary admin paid plan (seed data)",
      history: [
        {
          plan_type: "paid",
          timeline: { years: 1, months: 0, days: 0 },
          amount: 12000,
          start_date: mainSubStart,
          expiry_date: mainSubExpiry,
          activated_by: main._id,
          activated_at: mainSubStart,
          notes: "Initial paid plan activation",
        },
      ],
    },
  ];

  for (let i = 0; i < staff.length; i++) {
    const u = staff[i];
    const isDemo = i < Math.ceil(staff.length / 3);
    const timeline =
      isDemo ?
        { years: 0, months: 0, days: 30 }
      : { years: ri(0, 2), months: ri(0, 11), days: ri(0, 20) };

    const start = dtBefore(now, 10, 120);
    const expiry = new Date(start);
    expiry.setFullYear(expiry.getFullYear() + (timeline.years || 0));
    expiry.setMonth(expiry.getMonth() + (timeline.months || 0));
    expiry.setDate(expiry.getDate() + (timeline.days || 0));

    const status =
      !u.is_active ? "cancelled"
      : expiry < now ? "expired"
      : "active";

    const histEntry = {
      plan_type: isDemo ? "demo" : "paid",
      timeline,
      amount: isDemo ? 0 : ri(3000, 15000),
      start_date: start,
      expiry_date: expiry,
      activated_by: main._id,
      activated_at: dta(start, 0, 3),
      notes:
        isDemo ? "Auto demo plan from admin" : "Paid plan activated by admin",
    };

    subDocs.push({
      user_id: u._id,
      plan_type: isDemo ? "demo" : "paid",
      status,
      timeline,
      amount: isDemo ? 0 : ri(3000, 15000),
      start_date: start,
      expiry_date: expiry,
      activated_by: main._id,
      activated_at: dta(start, 0, 6),
      last_extended_at: !isDemo && coin(40) ? dta(start, 7, 30) : null,
      notes:
        isDemo ?
          "Auto demo plan from seed data"
        : "Admin activated paid plan (seed data)",
      history: [histEntry],
    });
  }

  await Subscription.insertMany(subDocs);
  const activeSubs = subDocs.filter((s) => s.status === "active").length;
  const expiredSubs = subDocs.filter((s) => s.status === "expired").length;
  const cancelledSubs = subDocs.filter((s) => s.status === "cancelled").length;
  console.log(
    `✓ Subscriptions: ${subDocs.length} (${activeSubs} active, ${expiredSubs} expired, ${cancelledSubs} cancelled)`,
  );

  const sessionDocs = [];
  const pushS = (id, role, ft) =>
    sessionDocs.push({
      user_id: id,
      role,
      firm_type: ft || undefined,
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

    if (coin(40)) pushS(u._id, "firm", "GST");
  }
  await Session.insertMany(sessionDocs);
  console.log(`✓ Sessions: ${sessionDocs.length}`);

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

  let labelSeq = 0;
  const allLabels = [];

  for (const labelName of LABEL_NAMES) {
    labelSeq++;
    const selectedBrandIds = smp(brandIds, ri(8, 15));
    const label = await Label.create({
      id: labelSeq,
      name: labelName,
      description: `${labelName} pricing tier`,
      is_active: true,
      brand_discounts: selectedBrandIds.map((brandId) => ({
        brand_id: brandId,
        disc1: {
          normal: rd(ri(0, 300) / 100),
          special: rd(ri(0, 200) / 100),
        },
        disc2: {
          normal: rd(ri(0, 300) / 100),
          special: rd(ri(0, 200) / 100),
        },
      })),
      user_id: uid,
    });
    allLabels.push(label);
  }
  console.log(`✓ Labels: ${allLabels.length}`);
  console.log(`✓ Brands: ${brands.length} (with label discounts mapped)`);

  const transportPrefixes = [
    "Shree",
    "Rajasthan",
    "National",
    "Metro",
    "Swift",
    "Prime",
    "Reliable",
    "Om",
    "Jayanti",
    "Bharat",
    "Ajmera",
    "Express",
    "Jaipur",
    "Super",
  ];
  const transportSuffixes = [
    "Transport",
    "Roadways",
    "Logistics",
    "Carriers",
    "Freight",
    "Movers",
  ];
  const transports = await Transport.insertMany(
    Array.from({ length: C.transports }, (_, i) => {
      const st = p(Object.keys(STATES));
      const ct = p(STATES[st]);
      return {
        id: i + 1,
        name: `${p(transportPrefixes)} ${p(transportSuffixes)} ${ct}`,
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

  let contactSeq = 0;

  const partyPrefixes = [
    "Shiv",
    "Ganesh",
    "Balaji",
    "Sai",
    "Raj",
    "Vardhman",
    "Krishna",
    "Laxmi",
    "Bharat",
    "Arjun",
    "Mahavir",
    "Shankar",
  ];
  const partySuffixes = [
    "Auto House",
    "Automobiles",
    "Motor Parts",
    "Spare Centre",
    "Auto Hub",
    "Two Wheeler",
    "Bike Point",
    "Motor Works",
  ];
  const supplierPrefixes = [
    "Reliable",
    "National",
    "Prime",
    "Western",
    "Udaan",
    "Aditya",
    "Global",
    "Premier",
    "Royal",
    "Supreme",
  ];
  const supplierSuffixes = [
    "Distributors",
    "Supply Co",
    "Parts Depot",
    "Industrial Suppliers",
    "Bulk Traders",
    "Trading Corp",
    "Wholesale",
  ];

  const mkContacts = (count, type, isGst, seedOffset) =>
    Array.from({ length: count }, (_, i) => {
      contactSeq++;
      const st = p(Object.keys(STATES));
      const ct = p(STATES[st]);
      const bk = p(BNK);
      const bk2 = p(BNK);
      const prefix = type === "party" ? p(partyPrefixes) : p(supplierPrefixes);
      const suffix = type === "party" ? p(partySuffixes) : p(supplierSuffixes);
      const n = `${prefix} ${suffix} ${ct} ${pad(contactSeq, 2)}`;
      const domain =
        type === "party" ? "dealer.example.in" : "supply.example.in";
      const s = seedOffset + i;

      const banks = [
        {
          bank_name: bk.n,
          bank_branch: `${ct} Commercial`,
          ifsc_code: ifcCode(bk.c, s + 700),
          account_number: accNo(s + 7000),
          account_holder: n,
          upi_id: `${sl(prefix)}${pad(contactSeq, 2)}@upi`,
        },
      ];

      if (coin(40)) {
        banks.push({
          bank_name: bk2.n,
          bank_branch: `${ct} Savings`,
          ifsc_code: ifcCode(bk2.c, s + 1700),
          account_number: accNo(s + 17000),
          account_holder: n,
          upi_id: "",
        });
      }

      const chosenLabels =
        type === "party" ?
          smp(allLabels, ri(1, Math.min(3, allLabels.length)))
        : [];

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
        label_ids: chosenLabels.map((l) => l._id),
        banks,
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
              "Wholesale Market",
            ])
          : undefined,
        is_gst: isGst,
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

  const bookContactDocs = [];
  for (const u of users) {
    contactSeq++;
    bookContactDocs.push({
      id: contactSeq,
      name: "CashBook",
      type: "book",
      user_id: u._id,
    });
    contactSeq++;
    bookContactDocs.push({
      id: contactSeq,
      name: "BankBook",
      type: "book",
      user_id: u._id,
    });
  }
  const bookContacts = await Contact.insertMany(bookContactDocs);
  console.log(
    `✓ Book Contacts: ${bookContacts.length} (CashBook + BankBook per user)`,
  );

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
  console.log(
    `  ↳ Linked ${partyBulk.length} parties → agents/areas/transports`,
  );

  const departments = await Department.insertMany(
    DEPT_NAMES.slice(0, C.departments).map((name, i) => ({
      id: i + 1,
      name,
      user_id: uid,
    })),
  );
  console.log(`✓ Departments: ${departments.length}`);

  let itemIdSeq = 60001;

  const mkItems = (count, isGst, startIdx) =>
    Array.from({ length: count }, (_, i) => {
      const idx = startIdx + i;
      const br = brands[idx % brands.length];
      const sup =
        isGst ?
          gstSuppliers[idx % gstSuppliers.length]
        : nongstSuppliers[idx % nongstSuppliers.length];
      const gp = isGst ? p([5, 12, 18, 28]) : 0;
      const pr = rd(ri(70, 4200) + ri(-20, 90));
      const sr = rd(pr * (1 + ri(12, 45) / 100));
      const mr = rd(sr * (1 + ri(8, 25) / 100));
      const physicalStock = ri(20, 300);
      const logicalStock = isGst ? 0 : rd(ri(-100, 200) / 10);
      const itemName = iname(idx);
      const itemAlias = `${(br?.name || "ITEM").split(" ")[0]}-${pad(idx + 1, 4)}`;
      return {
        id: idx + 1,
        item_name: itemName,
        alias: itemAlias,
        description: `${itemName}${br?.name ? ` by ${br.name}` : ""}`,
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
          coin(15) ?
            `https://cdn.maheshwarimotors.dev/items/item-${pad(idx + 1, 4)}.jpg`
          : undefined,
        is_gst: isGst,
        user_id: uid,
        brand_id: br?._id,
        hsn_id: br?.hsn_id,
        contact_id: sup._id,
        dept_id: departments[idx % departments.length]._id,
      };
    });

  const allItemDocs = [
    ...mkItems(C.gstItems, 1, 0),
    ...mkItems(C.nongstItems, 0, C.gstItems),
  ];
  const items = await Item.insertMany(allItemDocs);
  const gstItems = items.filter((it) => it.is_gst === 1);
  const nongstItems = items.filter((it) => it.is_gst === 0);

  const brandItemMap = new Map();
  for (const it of items) {
    if (!it.brand_id) continue;
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
  console.log(`  ↳ Brand.item_ids synced for ${brandItemMap.size} brands`);

  // Add item_discounts to Label brand_discounts
  const labelItemDiscountBulk = allLabels.map((label) => {
    const brandDiscounts = label.brand_discounts.map((bd) => {
      const brandItems = brandItemMap.get(String(bd.brand_id)) || [];
      const chosenItems = smp(
        brandItems,
        ri(0, Math.min(5, brandItems.length)),
      );
      return {
        brand_id: bd.brand_id,
        disc1: bd.disc1,
        disc2: bd.disc2,
        item_discounts: chosenItems.map((itemId) => ({
          item_id: itemId,
          discount: rd(ri(0, 500) / 10),
        })),
      };
    });
    return {
      updateOne: {
        filter: { _id: label._id },
        update: { $set: { brand_discounts: brandDiscounts } },
      },
    };
  });
  if (labelItemDiscountBulk.length)
    await Label.bulkWrite(labelItemDiscountBulk);
  console.log(`✓ Label item discounts mapped for ${allLabels.length} labels`);

  // Assign labels to parties
  const partyLabelBulk = allParties.map((party) => {
    const chosenLabels = smp(allLabels, ri(1, Math.min(3, allLabels.length)));
    return {
      updateOne: {
        filter: { _id: party._id },
        update: { $set: { label_ids: chosenLabels.map((l) => l._id) } },
      },
    };
  });
  if (partyLabelBulk.length) await Contact.bulkWrite(partyLabelBulk);
  console.log(`✓ Labels assigned to ${allParties.length} parties`);

  let challanSeq = 0;
  let cNoGstSale = 0,
    cNoNongstSale = 0,
    cNoGstPurchase = 0,
    cNoNongstPurchase = 0;

  const mkChallans = (challanType, isGst, contactPool, itemPool, count) =>
    Array.from({ length: count }, (_, idx) => {
      challanSeq++;
      const contact = contactPool[idx % contactPool.length];
      const firmBankDoc = isGst === 1 ? mainGstBankDoc : mainNongstBankDoc;
      const firmName = isGst === 1 ? main.gst_firm.name : main.nongst_firm.name;
      const contactBank =
        Array.isArray(contact.banks) && contact.banks.length > 0 ?
          contact.banks[0]
        : null;
      const numItems = ri(1, Math.min(6, itemPool.length));
      const chosenItems = smp(itemPool, numItems);

      const lines = chosenItems.map((it) => {
        const q = challanType === "sale" ? ri(1, 10) : ri(2, 30);
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
        label_id:
          challanType === "sale" ? (contact.label_ids?.[0] ?? null) : null,
        contact_id: contact._id,
        from_bank:
          firmBankDoc ?
            {
              bank_id: firmBankDoc._id,
              bank_name: firmBankDoc.bank_name || "",
              bank_branch: firmBankDoc.bank_branch || "",
              ifsc_code: firmBankDoc.ifsc_code || "",
              account_number: firmBankDoc.account_number || "",
              account_holder: firmName || "",
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

  const linkN = Math.min(15, gstSaleChallans.length, nongstSaleChallans.length);
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
  console.log(`    Linked pairs: ${linkN}`);

  let billSeq = 0,
    bNoGst = 0,
    bNoNongst = 0;
  const gstBillDocs = [];
  const nongstBillDocs = [];
  const contactMap = new Map(allContacts.map((c) => [String(c._id), c]));

  const makeBill = (challans, isGst, idx, totalBills) => {
    billSeq++;
    const totalAmount = rd(challans.reduce((s, c) => s + c.amount, 0));
    const ret = idx % 5 === 4 ? rd(totalAmount * (ri(2, 12) / 100)) : 0;
    const finalAmt = rd(Math.max(1, totalAmount - ret));
    const { status, paid } = payStatus(idx, totalBills, finalAmt);

    if (isGst === 1) bNoGst++;
    else bNoNongst++;

    const billNo =
      isGst === 1 ? `BL-${pad(bNoGst, 6)}` : `BL-${pad(bNoNongst, 6)}`;

    const firstChal = challans[0];
    const d = dta(new Date(firstChal.date), 1, 15);
    const oid = new mongoose.Types.ObjectId();

    for (const ch of challans) {
      ch.converted_to_bill = true;
      ch.bill_id = oid;
    }

    const contact = contactMap.get(String(firstChal.contact_id));

    return {
      _id: oid,
      id: billSeq,
      bill_no: billNo,
      date: d,
      contact_id: firstChal.contact_id,
      transport_id:
        contact?.transport_id || (coin(40) ? p(transports)._id : null),
      customer_name: contact?.name || "Customer",
      vehicle_number: coin(70) ? vehNo() : "",
      transport_charge: rd(contact?.transport_charge || ri(40, 350)),
      amount: finalAmt,
      paid_amount: paid,
      return_amount: ret,
      payment_status: status,
      challan_ids: challans.map((c) => c._id),
      skip_stock_calculation: isGst === 0,
      is_gst: isGst,
      user_id: uid,
      createdAt: d,
      updatedAt: d,
    };
  };

  const singleGstBillCount = C.gstBills - C.multiBillCount;
  for (
    let idx = 0;
    idx < singleGstBillCount && idx < gstSaleChallans.length;
    idx++
  ) {
    gstBillDocs.push(makeBill([gstSaleChallans[idx]], 1, idx, C.gstBills));
  }

  const gstUnbilled = gstSaleChallans.filter((c) => !c.converted_to_bill);
  const gstByContact = new Map();
  for (const ch of gstUnbilled) {
    const k = String(ch.contact_id);
    if (!gstByContact.has(k)) gstByContact.set(k, []);
    gstByContact.get(k).push(ch);
  }
  let gstMultiCount = 0;
  for (const [, chs] of gstByContact) {
    if (gstMultiCount >= C.multiBillCount) break;
    if (chs.length < 2) continue;
    const bundle = chs.slice(0, ri(2, Math.min(3, chs.length)));
    gstBillDocs.push(
      makeBill(bundle, 1, singleGstBillCount + gstMultiCount, C.gstBills),
    );
    gstMultiCount++;
  }

  const singleNongstBillCount = C.nongstBills - C.multiBillCount;
  for (
    let idx = 0;
    idx < singleNongstBillCount && idx < nongstSaleChallans.length;
    idx++
  ) {
    nongstBillDocs.push(
      makeBill([nongstSaleChallans[idx]], 0, idx, C.nongstBills),
    );
  }

  const nongstUnbilled = nongstSaleChallans.filter((c) => !c.converted_to_bill);
  const nongstByContact = new Map();
  for (const ch of nongstUnbilled) {
    const k = String(ch.contact_id);
    if (!nongstByContact.has(k)) nongstByContact.set(k, []);
    nongstByContact.get(k).push(ch);
  }
  let nongstMultiCount = 0;
  for (const [, chs] of nongstByContact) {
    if (nongstMultiCount >= C.multiBillCount) break;
    if (chs.length < 2) continue;
    const bundle = chs.slice(0, ri(2, Math.min(3, chs.length)));
    nongstBillDocs.push(
      makeBill(
        bundle,
        0,
        singleNongstBillCount + nongstMultiCount,
        C.nongstBills,
      ),
    );
    nongstMultiCount++;
  }

  const allBills = [...gstBillDocs, ...nongstBillDocs];

  await Challan.insertMany(allChallans);
  await Bill.insertMany(allBills);

  const billedGstChallans = gstSaleChallans.filter(
    (c) => c.converted_to_bill,
  ).length;
  const billedNongstChallans = nongstSaleChallans.filter(
    (c) => c.converted_to_bill,
  ).length;

  console.log(
    `✓ Bills: ${allBills.length} (${gstBillDocs.length} GST + ${nongstBillDocs.length} non-GST)`,
  );
  console.log(
    `    Single-challan: ${singleGstBillCount + singleNongstBillCount}  |  Multi-challan: ${gstMultiCount + nongstMultiCount}`,
  );
  console.log(
    `    GST Sale billed: ${billedGstChallans}/${gstSaleChallans.length}  |  Non-GST Sale billed: ${billedNongstChallans}/${nongstSaleChallans.length}`,
  );

  const stockAdj = new Map();

  const initAdj = (id) => {
    const k = String(id);
    if (!stockAdj.has(k)) stockAdj.set(k, { physical: 0, logical: 0 });
    return stockAdj.get(k);
  };

  for (const ch of [...gstSaleChallans, ...nongstSaleChallans]) {
    for (const line of ch.items) {
      const adj = initAdj(line.item_id);
      if (ch.is_gst === 1) {
        adj.physical -= line.quantity;
      } else {
        adj.logical -= line.quantity;
      }
    }
  }

  for (const ch of [...gstPurchaseChallans, ...nongstPurchaseChallans]) {
    for (const line of ch.items) {
      const adj = initAdj(line.item_id);
      if (ch.is_gst === 1) {
        adj.physical += line.quantity;
      } else {
        adj.logical += line.quantity;
      }
    }
  }

  const stockBulk = [];
  for (const [itemIdStr, adj] of stockAdj) {
    const item = items.find((it) => String(it._id) === itemIdStr);
    if (!item) continue;

    const newPhysical = Math.max(0, item.physical_stock + adj.physical);
    const newLogical = item.logical_stock + adj.logical;
    stockBulk.push({
      updateOne: {
        filter: { _id: item._id },
        update: {
          $set: {
            physical_stock: newPhysical,
            stock: newPhysical,
            logical_stock: rd(newLogical),
          },
        },
      },
    });
  }
  if (stockBulk.length) await Item.bulkWrite(stockBulk);
  console.log(
    `✓ Stock adjusted for ${stockBulk.length} items (from ${allChallans.length} challans)`,
  );

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
        const roll = ri(0, 3);
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

  const reportDocs = [];
  for (const rt of REPORT_TYPES) {
    for (let i = 0; i < C.reportsPerType; i++) {
      const isGst = i < C.reportsPerType / 2 ? 1 : 0;
      const d = dt(365);
      reportDocs.push({
        pdf_link: `https://reports.maheshwarimotors.dev/${d.getFullYear()}/${pad(d.getMonth() + 1, 2)}/report-${rt}-${pad(i + 1, 4)}.pdf`,
        date_created: d,
        user_id: ri(0, 4) === 0 && staff.length ? p(staff)._id : uid,
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

  const TRANSACTION_TYPES = [
    "bank_received",
    "cash_received",
    "bank_payment",
    "cash_payment",
  ];
  const REF_PREFIXES = ["NEFT", "RTGS", "IMPS", "UPI", "CHQ", "DD"];
  const TXN_REMARKS = [
    "Monthly payment",
    "Advance received",
    "Partial settlement",
    "Invoice clearance",
    "Outstanding balance",
    "Credit note adjustment",
    "Return refund",
    "Freight charges",
    "Commission",
    "Misc adjustment",
  ];

  const mkTransactions = (count, isGst, startIdx) => {
    const partyPool = isGst === 1 ? gstParties : nongstParties;
    const supplierPool = isGst === 1 ? gstSuppliers : nongstSuppliers;
    const bankDoc = isGst === 1 ? mainGstBankDoc : mainNongstBankDoc;
    const docs = [];
    for (let i = 0; i < count; i++) {
      const idx = startIdx + i;
      const type = TRANSACTION_TYPES[i % 4];
      const isReceived = type.includes("received");
      const isBank = type.startsWith("bank");
      const contact = isReceived ? p(partyPool) : p(supplierPool);
      const d = dt(365);
      docs.push({
        id: idx,
        transaction_no: `TXN-${pad(idx, 5)}`,
        type,
        date: d,
        contact_id: contact._id,
        amount: rd(ri(500, 500000) / 10),
        bank_id: isBank ? bankDoc._id : null,
        reference:
          isBank ? `${p(REF_PREFIXES)}${pad(ri(100000, 999999), 6)}` : "",
        remarks: coin(70) ? p(TXN_REMARKS) : "",
        is_gst: isGst,
        user_id: uid,
        createdAt: d,
        updatedAt: d,
      });
    }
    return docs;
  };

  const gstTxnDocs = mkTransactions(C.gstTransactions, 1, 1);
  const nongstTxnDocs = mkTransactions(
    C.nongstTransactions,
    0,
    C.gstTransactions + 1,
  );
  const allTxnDocs = [...gstTxnDocs, ...nongstTxnDocs];
  await Transaction.insertMany(allTxnDocs);
  const txnBankReceived = allTxnDocs.filter(
    (t) => t.type === "bank_received",
  ).length;
  const txnCashReceived = allTxnDocs.filter(
    (t) => t.type === "cash_received",
  ).length;
  const txnBankPayment = allTxnDocs.filter(
    (t) => t.type === "bank_payment",
  ).length;
  const txnCashPayment = allTxnDocs.filter(
    (t) => t.type === "cash_payment",
  ).length;
  console.log(
    `✓ Transactions: ${allTxnDocs.length} (${gstTxnDocs.length} GST + ${nongstTxnDocs.length} non-GST)`,
  );
  console.log(
    `    Bank Received: ${txnBankReceived}  |  Cash Received: ${txnCashReceived}  |  Bank Payment: ${txnBankPayment}  |  Cash Payment: ${txnCashPayment}`,
  );

  /* ─── Return seeding ─── */
  const RETURN_NOTES = [
    "Defective goods returned",
    "Wrong item shipped",
    "Damaged in transit",
    "Quality issue",
    "Customer changed mind",
    "Excess quantity returned",
    "Size mismatch",
    "Warranty replacement",
    "Duplicate order",
    "",
  ];

  let returnSeq = 0;
  let retNoGst = 0;
  let retNoNongst = 0;

  const mkReturns = (count, returnType, isGst, sourcePool) => {
    const itemPool = isGst === 1 ? gstItems : nongstItems;
    const docs = [];
    for (let i = 0; i < count; i++) {
      if (sourcePool.length === 0) break;
      returnSeq++;
      if (isGst === 1) retNoGst++;
      else retNoNongst++;

      const returnNo =
        isGst === 1 ? `RET-${pad(retNoGst, 6)}` : `RET-${pad(retNoNongst, 6)}`;

      const source = sourcePool[i % sourcePool.length];
      const d = dt(180);

      // Pick 1-3 items from the source doc or random pool
      const srcItems =
        source.items && source.items.length > 0 ?
          smp(source.items, ri(1, Math.min(3, source.items.length)))
        : smp(itemPool, ri(1, 3)).map((it) => ({
            item_id: it._id,
            quantity: ri(1, 5),
            rate: it.sale_rate || ri(50, 500),
            discount: ri(0, 10),
            special_discount: 0,
            gst_percent: isGst ? it.gst_percent || 18 : 0,
          }));

      const retItems = srcItems.map((si) => {
        const retQty = ri(1, Math.max(1, Math.floor((si.quantity || 3) / 2)));
        const rate = si.rate || ri(50, 500);
        const disc = si.discount || 0;
        const specDisc = si.special_discount || 0;
        const gPct = si.gst_percent || 0;
        const z = calcLine({
          q: retQty,
          rate,
          d: disc,
          s: specDisc,
          da: 0,
          g: gPct,
        });
        return {
          item_id: si.item_id,
          quantity: retQty,
          rate,
          discount: disc,
          special_discount: specDisc,
          gst_percent: gPct,
          gst_amount: z.ga,
          taxable_amount: z.tx,
          amount: z.am,
          is_damaged: coin(25) ? true : false,
          is_gst: isGst,
        };
      });

      const totalAmt = rd(retItems.reduce((s, l) => s + l.amount, 0));

      docs.push({
        id: returnSeq,
        return_no: returnNo,
        return_type: returnType,
        date: d,
        contact_id: source.contact_id,
        bill_id: returnType === "sale_return" ? source._id : null,
        challan_id: returnType === "purchase_return" ? source._id : null,
        items: retItems,
        total_amount: totalAmt,
        note: p(RETURN_NOTES),
        is_gst: isGst,
        user_id: uid,
        createdAt: d,
        updatedAt: d,
      });
    }
    return docs;
  };

  const gstSaleReturnDocs = mkReturns(
    C.gstSaleReturns,
    "sale_return",
    1,
    gstBillDocs,
  );
  const nongstSaleReturnDocs = mkReturns(
    C.nongstSaleReturns,
    "sale_return",
    0,
    nongstBillDocs,
  );
  const gstPurchaseReturnDocs = mkReturns(
    C.gstPurchaseReturns,
    "purchase_return",
    1,
    gstPurchaseChallans,
  );
  const nongstPurchaseReturnDocs = mkReturns(
    C.nongstPurchaseReturns,
    "purchase_return",
    0,
    nongstPurchaseChallans,
  );

  const allReturnDocs = [
    ...gstSaleReturnDocs,
    ...nongstSaleReturnDocs,
    ...gstPurchaseReturnDocs,
    ...nongstPurchaseReturnDocs,
  ];
  await Return.insertMany(allReturnDocs);

  const saleReturnCount =
    gstSaleReturnDocs.length + nongstSaleReturnDocs.length;
  const purchaseReturnCount =
    gstPurchaseReturnDocs.length + nongstPurchaseReturnDocs.length;
  console.log(
    `✓ Returns: ${allReturnDocs.length} (${saleReturnCount} sale + ${purchaseReturnCount} purchase)`,
  );
  console.log(
    `    GST: ${gstSaleReturnDocs.length} sale + ${gstPurchaseReturnDocs.length} purchase  |  Non-GST: ${nongstSaleReturnDocs.length} sale + ${nongstPurchaseReturnDocs.length} purchase`,
  );

  // adjust stock for non-damaged returns (restore inventory)
  for (const ret of allReturnDocs) {
    for (const line of ret.items) {
      if (line.is_damaged) continue; // damaged goods not restocked
      const adj = initAdj(line.item_id);
      if (ret.return_type === "sale_return") {
        // sold items returned → increase stock
        if (ret.is_gst === 1) adj.physical += line.quantity;
        else adj.logical += line.quantity;
      } else {
        // purchased items returned → decrease stock
        if (ret.is_gst === 1) adj.physical -= line.quantity;
        else adj.logical -= line.quantity;
      }
    }
  }

  // re-apply stock adjustments for returns
  const returnStockBulk = [];
  for (const ret of allReturnDocs) {
    for (const line of ret.items) {
      if (line.is_damaged) continue;
      const item = items.find((it) => String(it._id) === String(line.item_id));
      if (!item) continue;
      const adj = stockAdj.get(String(line.item_id));
      if (!adj) continue;
      const newPhysical = Math.max(0, item.physical_stock + adj.physical);
      const newLogical = item.logical_stock + adj.logical;
      returnStockBulk.push({
        updateOne: {
          filter: { _id: item._id },
          update: {
            $set: {
              physical_stock: newPhysical,
              stock: newPhysical,
              logical_stock: rd(newLogical),
            },
          },
        },
      });
    }
  }
  if (returnStockBulk.length) await Item.bulkWrite(returnStockBulk);
  console.log(
    `✓ Return stock adjustments for ${returnStockBulk.length} item entries`,
  );

  await Counter.insertMany([
    { model_name: "Brand", user_id: uid, seq: brands.length },
    { model_name: "Hsn", user_id: uid, seq: hsns.length },
    { model_name: "Contact", user_id: uid, seq: contactSeq },
    { model_name: "Agent", user_id: uid, seq: agents.length },
    { model_name: "Transport", user_id: uid, seq: transports.length },
    { model_name: "Area", user_id: uid, seq: areas.length },
    { model_name: "Department", user_id: uid, seq: departments.length },
    { model_name: "Item", user_id: uid, seq: items.length },
    { model_name: "ItemId", user_id: uid, seq: itemIdSeq - 1 },
    { model_name: "Challan", user_id: uid, seq: allChallans.length },
    { model_name: "Bill", user_id: uid, seq: allBills.length },
    { model_name: "Label", user_id: uid, seq: allLabels.length },
    { model_name: "Bank", user_id: uid, seq: bankSeq },
    { model_name: "ChallanNo_GST", user_id: uid, seq: cNoGstSale },
    { model_name: "ChallanNo_NONGST", user_id: uid, seq: cNoNongstSale },
    { model_name: "PurchaseNo_GST", user_id: uid, seq: cNoGstPurchase },
    { model_name: "PurchaseNo_NONGST", user_id: uid, seq: cNoNongstPurchase },
    { model_name: "BillNo_GST", user_id: uid, seq: bNoGst },
    { model_name: "BillNo_NONGST", user_id: uid, seq: bNoNongst },
    { model_name: "Transaction", user_id: uid, seq: allTxnDocs.length },
    { model_name: "Return", user_id: uid, seq: allReturnDocs.length },
    { model_name: "ReturnNo_GST", user_id: uid, seq: retNoGst },
    { model_name: "ReturnNo_NONGST", user_id: uid, seq: retNoNongst },
  ]);
  console.log("✓ Counters synced (23 sequences)");

  const unbilledGstSale = gstSaleChallans.filter(
    (c) => !c.converted_to_bill,
  ).length;
  const unbilledNongstSale = nongstSaleChallans.filter(
    (c) => !c.converted_to_bill,
  ).length;
  const paidBills = allBills.filter((b) => b.payment_status === "paid").length;
  const dueBills = allBills.filter((b) => b.payment_status === "due").length;
  const overpaidBills = allBills.filter(
    (b) => b.payment_status === "overpaid",
  ).length;

  console.log("\n══════════════════════════════════════════════════════════");
  console.log("  SEED COMPLETE — Full breakdown");
  console.log("══════════════════════════════════════════════════════════");
  console.log(
    `  Users             : ${users.length} (1 main + ${staff.length} secondary [8 active, ${C.secondaryUsers - 8} inactive])`,
  );
  console.log(
    `  Subscriptions     : ${subDocs.length} (${activeSubs} active, ${expiredSubs} expired, ${cancelledSubs} cancelled)`,
  );
  console.log(`  Sessions          : ${sessionDocs.length}`);
  console.log(
    `  HSN               : ${hsns.length} (${activeHsns.length} active + ${hsns.length - activeHsns.length} inactive)`,
  );
  console.log(`  Labels            : ${allLabels.length}`);
  console.log(`  Brands            : ${brands.length}`);
  console.log(`  Banks             : ${bankSeq}`);
  console.log(`  Transports        : ${transports.length}`);
  console.log(`  Contacts          : ${allContacts.length}`);
  console.log(`    GST Parties       : ${gstParties.length}`);
  console.log(`    Non-GST Parties   : ${nongstParties.length}`);
  console.log(`    GST Suppliers     : ${gstSuppliers.length}`);
  console.log(`    Non-GST Suppliers : ${nongstSuppliers.length}`);
  console.log(`  Agents            : ${agents.length}`);
  console.log(`  Areas             : ${areas.length}`);
  console.log(`  Departments       : ${departments.length}`);
  console.log(
    `  Items             : ${items.length} (${gstItems.length} GST + ${nongstItems.length} non-GST)`,
  );
  console.log(`  Challans          : ${allChallans.length}`);
  console.log(
    `    GST Sale          : ${gstSaleChallans.length} (${billedGstChallans} billed + ${unbilledGstSale} unbilled)`,
  );
  console.log(
    `    Non-GST Sale      : ${nongstSaleChallans.length} (${billedNongstChallans} billed + ${unbilledNongstSale} unbilled)`,
  );
  console.log(`    GST Purchase      : ${gstPurchaseChallans.length}`);
  console.log(`    Non-GST Purchase  : ${nongstPurchaseChallans.length}`);
  console.log(
    `  Bills             : ${allBills.length} (${gstBillDocs.length} GST + ${nongstBillDocs.length} non-GST)`,
  );
  console.log(
    `    Single-challan    : ${singleGstBillCount + singleNongstBillCount}`,
  );
  console.log(`    Multi-challan     : ${gstMultiCount + nongstMultiCount}`);
  console.log(
    `    Paid              : ${paidBills}  |  Due: ${dueBills}  |  Overpaid: ${overpaidBills}`,
  );
  console.log(
    `  Reports           : ${reportDocs.length} (${C.reportsPerType}/type × ${REPORT_TYPES.length} types)`,
  );
  console.log(
    `  Transactions      : ${allTxnDocs.length} (${gstTxnDocs.length} GST + ${nongstTxnDocs.length} non-GST)`,
  );
  console.log(
    `    Bank Received     : ${txnBankReceived}  |  Cash Received: ${txnCashReceived}`,
  );
  console.log(
    `    Bank Payment      : ${txnBankPayment}  |  Cash Payment : ${txnCashPayment}`,
  );
  console.log(
    `  Returns           : ${allReturnDocs.length} (${saleReturnCount} sale + ${purchaseReturnCount} purchase)`,
  );
  console.log(
    `    GST               : ${gstSaleReturnDocs.length} sale + ${gstPurchaseReturnDocs.length} purchase`,
  );
  console.log(
    `    Non-GST           : ${nongstSaleReturnDocs.length} sale + ${nongstPurchaseReturnDocs.length} purchase`,
  );
  console.log(`  Counters          : 23 sequences`);
  console.log(
    `  Stock adjustments : ${stockBulk.length} items updated (${returnStockBulk.length} return adjustments)`,
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
