/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  Maheshwari Motors — Master Seed Script                          ║
 * ║  Populates all collections with rich, realistic test data        ║
 * ║  Run:  npm run seed   OR  node api/seed.js                       ║
 * ╚══════════════════════════════════════════════════════════════╝
 */
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
} from "../src/models/index.js";

// ── Helpers ──────────────────────────────────────────────────────
const SALT = 10;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randBetween = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const round2 = (n) => Math.round(n * 100) / 100;
const BARCODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const usedBarcodes = new Set();

function generateBarcode() {
  let barcode;
  do {
    const bytes = crypto.randomBytes(10);
    barcode = "";
    for (let i = 0; i < 10; i++) {
      barcode += BARCODE_CHARS[bytes[i] % BARCODE_CHARS.length];
    }
  } while (usedBarcodes.has(barcode));
  usedBarcodes.add(barcode);
  return barcode;
}

function daysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

// ── SEED DATA ARRAYS ─────────────────────────────────────────────

const STATES = [
  "Rajasthan",
  "Maharashtra",
  "Gujarat",
  "Madhya Pradesh",
  "Uttar Pradesh",
  "Delhi",
  "Karnataka",
  "Tamil Nadu",
  "Punjab",
  "Haryana",
];
const CITIES = {
  Rajasthan: ["Jaipur", "Udaipur", "Jodhpur", "Kota", "Ajmer", "Bikaner"],
  Maharashtra: ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad"],
  Gujarat: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur"],
  "Uttar Pradesh": ["Lucknow", "Noida", "Agra", "Varanasi", "Kanpur"],
  Delhi: ["New Delhi", "Dwarka", "Rohini"],
  Karnataka: ["Bangalore", "Mysore", "Hubli"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai"],
  Punjab: ["Ludhiana", "Amritsar", "Chandigarh"],
  Haryana: ["Gurgaon", "Faridabad", "Karnal"],
};

const BANK_NAMES = [
  "State Bank of India",
  "HDFC Bank",
  "ICICI Bank",
  "Punjab National Bank",
  "Bank of Baroda",
  "Axis Bank",
  "Kotak Mahindra Bank",
  "Union Bank of India",
  "Canara Bank",
  "IndusInd Bank",
];

const HSN_DATA = [
  {
    hsn_code: "8714",
    description: "Parts and accessories of motorcycles",
    gst_rate: 28,
  },
  {
    hsn_code: "8711",
    description: "Motorcycles and cycles with auxiliary motors",
    gst_rate: 28,
  },
  {
    hsn_code: "4011",
    description: "New pneumatic tyres, of rubber",
    gst_rate: 28,
  },
  {
    hsn_code: "8512",
    description: "Electrical lighting or signalling equipment",
    gst_rate: 18,
  },
  {
    hsn_code: "8511",
    description: "Electrical ignition equipment for engines",
    gst_rate: 18,
  },
  {
    hsn_code: "8421",
    description: "Oil or petrol-filters, air filters",
    gst_rate: 18,
  },
  { hsn_code: "8413", description: "Pumps for liquids", gst_rate: 18 },
  { hsn_code: "4013", description: "Inner tubes of rubber", gst_rate: 28 },
  {
    hsn_code: "7318",
    description: "Screws, bolts, nuts, washers of iron/steel",
    gst_rate: 18,
  },
  {
    hsn_code: "8301",
    description: "Padlocks and locks of base metal",
    gst_rate: 18,
  },
  {
    hsn_code: "4012",
    description: "Retreaded or used pneumatic tyres",
    gst_rate: 18,
  },
  {
    hsn_code: "8539",
    description: "Electric filament or discharge lamps",
    gst_rate: 18,
  },
  {
    hsn_code: "7326",
    description: "Other articles of iron or steel",
    gst_rate: 18,
  },
  { hsn_code: "3926", description: "Other articles of plastics", gst_rate: 18 },
  {
    hsn_code: "8507",
    description: "Electric accumulators (batteries)",
    gst_rate: 28,
  },
];

const CATEGORY_DATA = [
  {
    name: "Engine Parts",
    description:
      "Engine components — pistons, rings, gaskets, valves, crankshafts",
  },
  {
    name: "Body Parts",
    description: "Chassis, panels, fenders, mudguards, tank covers",
  },
  {
    name: "Electrical Parts",
    description: "Wiring harness, CDI units, regulators, coils, bulbs",
  },
  {
    name: "Brake System",
    description: "Disc brakes, drum brakes, brake pads, shoes, levers",
  },
  {
    name: "Suspension",
    description: "Shock absorbers, front forks, bushings, bearings",
  },
  {
    name: "Fuel System",
    description: "Carburetors, fuel pumps, fuel filters, injectors",
  },
  {
    name: "Exhaust System",
    description: "Silencers, mufflers, exhaust pipes, catalytic converters",
  },
  {
    name: "Transmission",
    description: "Clutch plates, gears, chains, sprockets, cables",
  },
  {
    name: "Tyres & Tubes",
    description: "Tyres, tubes, tubeless kits, rim tapes",
  },
  {
    name: "Lubricants & Oils",
    description: "Engine oil, gear oil, brake fluid, chain lube",
  },
  {
    name: "Accessories",
    description: "Mirrors, indicators, grips, seats, leg guards",
  },
  { name: "Filters", description: "Air filters, oil filters, fuel filters" },
];

const BRAND_DATA = [
  {
    name: "Royal Enfield Genuine",
    discount1: { normal: 15, special: 20 },
    discount2: { normal: 5, special: 8 },
  },
  {
    name: "Bajaj Auto",
    discount1: { normal: 12, special: 18 },
    discount2: { normal: 4, special: 7 },
  },
  {
    name: "Hero MotoCorp",
    discount1: { normal: 14, special: 19 },
    discount2: { normal: 5, special: 9 },
  },
  {
    name: "Honda Genuine",
    discount1: { normal: 10, special: 15 },
    discount2: { normal: 3, special: 6 },
  },
  {
    name: "TVS Motor",
    discount1: { normal: 11, special: 16 },
    discount2: { normal: 4, special: 7 },
  },
  {
    name: "KTM Original",
    discount1: { normal: 8, special: 12 },
    discount2: { normal: 2, special: 5 },
  },
  {
    name: "Yamaha Parts",
    discount1: { normal: 13, special: 17 },
    discount2: { normal: 5, special: 8 },
  },
  {
    name: "Suzuki Genuine",
    discount1: { normal: 12, special: 16 },
    discount2: { normal: 4, special: 7 },
  },
  {
    name: "Mahindra Moto",
    discount1: { normal: 10, special: 14 },
    discount2: { normal: 3, special: 6 },
  },
  {
    name: "Bosch India",
    discount1: { normal: 9, special: 13 },
    discount2: { normal: 3, special: 5 },
  },
  {
    name: "Minda Industries",
    discount1: { normal: 15, special: 20 },
    discount2: { normal: 5, special: 8 },
  },
  {
    name: "Endurance Tech",
    discount1: { normal: 14, special: 18 },
    discount2: { normal: 4, special: 7 },
  },
  {
    name: "Fiem Industries",
    discount1: { normal: 12, special: 17 },
    discount2: { normal: 4, special: 6 },
  },
  {
    name: "Rane Group",
    discount1: { normal: 11, special: 15 },
    discount2: { normal: 3, special: 6 },
  },
  {
    name: "Gabriel India",
    discount1: { normal: 13, special: 18 },
    discount2: { normal: 5, special: 8 },
  },
];

const TRANSPORT_DATA = [
  {
    name: "Rajasthan Roadways Transport",
    city: "Jaipur",
    gstin: "08AABCT1234A1Z5",
  },
  { name: "Shree Balaji Transport", city: "Udaipur", gstin: "08AABCS5678B1Z3" },
  {
    name: "Marwar Express Logistics",
    city: "Jodhpur",
    gstin: "08AABCM9012C1Z1",
  },
  { name: "Blue Dart Cargo", city: "Mumbai", gstin: "27AABCB3456D1Z9" },
  { name: "Om Logistics", city: "Ahmedabad", gstin: "24AABCO7890E1Z7" },
  { name: "VRL Logistics", city: "Bangalore", gstin: "29AABCV2345F1Z5" },
  { name: "Gati Limited", city: "Pune", gstin: "27AABCG6789G1Z3" },
  { name: "Delhivery Express", city: "New Delhi", gstin: "07AABCD1234H1Z1" },
  { name: "TCI Express", city: "Gurgaon", gstin: "06AABCT5678I1Z9" },
  { name: "Safexpress", city: "Noida", gstin: "09AABCS9012J1Z7" },
];

const ITEM_TEMPLATES = [
  // Engine Parts
  {
    item_name: "Piston Kit RE Classic 350",
    cat: 0,
    brand: 0,
    sale: 1850,
    purchase: 1200,
    mrp: 2200,
    gst: 28,
    stock: 45,
    threshold: 8,
  },
  {
    item_name: "Piston Rings Set RE Bullet",
    cat: 0,
    brand: 0,
    sale: 480,
    purchase: 290,
    mrp: 580,
    gst: 28,
    stock: 60,
    threshold: 10,
  },
  {
    item_name: "Cylinder Head Gasket RE",
    cat: 0,
    brand: 0,
    sale: 320,
    purchase: 180,
    mrp: 400,
    gst: 18,
    stock: 35,
    threshold: 5,
  },
  {
    item_name: "Engine Valve Set Bajaj Pulsar",
    cat: 0,
    brand: 1,
    sale: 650,
    purchase: 380,
    mrp: 800,
    gst: 28,
    stock: 25,
    threshold: 5,
  },
  {
    item_name: "Crankshaft Bearing Hero Splendor",
    cat: 0,
    brand: 2,
    sale: 420,
    purchase: 250,
    mrp: 520,
    gst: 18,
    stock: 30,
    threshold: 6,
  },
  {
    item_name: "Camshaft Assembly Honda Shine",
    cat: 0,
    brand: 3,
    sale: 1200,
    purchase: 780,
    mrp: 1500,
    gst: 28,
    stock: 12,
    threshold: 3,
  },
  {
    item_name: "Connecting Rod Kit TVS Apache",
    cat: 0,
    brand: 4,
    sale: 950,
    purchase: 580,
    mrp: 1150,
    gst: 28,
    stock: 18,
    threshold: 4,
  },
  {
    item_name: "Oil Pump Assembly RE Himalayan",
    cat: 0,
    brand: 0,
    sale: 750,
    purchase: 450,
    mrp: 900,
    gst: 18,
    stock: 10,
    threshold: 3,
  },

  // Body Parts
  {
    item_name: "Side Panel RE Classic 350 LH",
    cat: 1,
    brand: 0,
    sale: 1100,
    purchase: 680,
    mrp: 1350,
    gst: 28,
    stock: 2,
    threshold: 2,
  },
  {
    item_name: "Side Panel RE Classic 350 RH",
    cat: 1,
    brand: 0,
    sale: 1100,
    purchase: 680,
    mrp: 1350,
    gst: 28,
    stock: 1,
    threshold: 2,
  },
  {
    item_name: "Front Mudguard Bajaj Pulsar 150",
    cat: 1,
    brand: 1,
    sale: 850,
    purchase: 520,
    mrp: 1050,
    gst: 28,
    stock: 8,
    threshold: 3,
  },
  {
    item_name: "Rear Fender Hero HF Deluxe",
    cat: 1,
    brand: 2,
    sale: 620,
    purchase: 380,
    mrp: 780,
    gst: 28,
    stock: 15,
    threshold: 4,
  },
  {
    item_name: "Fuel Tank Cover Honda Unicorn",
    cat: 1,
    brand: 3,
    sale: 2800,
    purchase: 1800,
    mrp: 3500,
    gst: 28,
    stock: 5,
    threshold: 2,
  },
  {
    item_name: "Headlight Visor RE Meteor 350",
    cat: 1,
    brand: 0,
    sale: 450,
    purchase: 280,
    mrp: 580,
    gst: 18,
    stock: 20,
    threshold: 5,
  },
  {
    item_name: "Leg Guard Set RE Classic Chrome",
    cat: 1,
    brand: 0,
    sale: 1650,
    purchase: 1050,
    mrp: 2000,
    gst: 28,
    stock: 7,
    threshold: 2,
  },

  // Electrical
  {
    item_name: "CDI Unit RE Classic 350",
    cat: 2,
    brand: 0,
    sale: 1350,
    purchase: 850,
    mrp: 1650,
    gst: 18,
    stock: 2,
    threshold: 2,
  },
  {
    item_name: "Wiring Harness Bajaj Dominar",
    cat: 2,
    brand: 1,
    sale: 2200,
    purchase: 1400,
    mrp: 2700,
    gst: 18,
    stock: 6,
    threshold: 2,
  },
  {
    item_name: "Regulator Rectifier Hero Glamour",
    cat: 2,
    brand: 2,
    sale: 550,
    purchase: 340,
    mrp: 680,
    gst: 18,
    stock: 22,
    threshold: 5,
  },
  {
    item_name: "Ignition Coil Honda CB300R",
    cat: 2,
    brand: 3,
    sale: 780,
    purchase: 480,
    mrp: 950,
    gst: 18,
    stock: 14,
    threshold: 3,
  },
  {
    item_name: "Starter Motor TVS Jupiter",
    cat: 2,
    brand: 4,
    sale: 1800,
    purchase: 1100,
    mrp: 2200,
    gst: 18,
    stock: 8,
    threshold: 2,
  },
  {
    item_name: "Headlamp Assembly KTM Duke 200",
    cat: 2,
    brand: 5,
    sale: 3500,
    purchase: 2200,
    mrp: 4200,
    gst: 18,
    stock: 4,
    threshold: 2,
  },
  {
    item_name: "Tail Lamp Assembly Yamaha FZ",
    cat: 2,
    brand: 6,
    sale: 680,
    purchase: 420,
    mrp: 850,
    gst: 18,
    stock: 18,
    threshold: 4,
  },
  {
    item_name: "Horn Minda 12V Universal",
    cat: 2,
    brand: 10,
    sale: 180,
    purchase: 100,
    mrp: 230,
    gst: 18,
    stock: 50,
    threshold: 10,
  },

  // Brake System
  {
    item_name: "Disc Brake Assembly KTM Duke 390",
    cat: 3,
    brand: 5,
    sale: 4200,
    purchase: 2700,
    mrp: 5000,
    gst: 28,
    stock: 1,
    threshold: 2,
  },
  {
    item_name: "Front Brake Pad Set Bosch RE",
    cat: 3,
    brand: 9,
    sale: 550,
    purchase: 340,
    mrp: 680,
    gst: 18,
    stock: 40,
    threshold: 8,
  },
  {
    item_name: "Rear Brake Shoe Set Hero Splendor",
    cat: 3,
    brand: 2,
    sale: 280,
    purchase: 170,
    mrp: 350,
    gst: 18,
    stock: 55,
    threshold: 10,
  },
  {
    item_name: "Brake Lever Set Honda Activa",
    cat: 3,
    brand: 3,
    sale: 320,
    purchase: 190,
    mrp: 400,
    gst: 18,
    stock: 35,
    threshold: 7,
  },
  {
    item_name: "Master Cylinder Bajaj Pulsar RS200",
    cat: 3,
    brand: 11,
    sale: 1500,
    purchase: 950,
    mrp: 1850,
    gst: 28,
    stock: 6,
    threshold: 2,
  },
  {
    item_name: "Brake Disc Rotor RE Interceptor 650",
    cat: 3,
    brand: 0,
    sale: 2800,
    purchase: 1800,
    mrp: 3400,
    gst: 28,
    stock: 3,
    threshold: 2,
  },

  // Suspension
  {
    item_name: "Rear Shocker Set Bajaj Pulsar 220",
    cat: 4,
    brand: 14,
    sale: 2400,
    purchase: 1500,
    mrp: 2900,
    gst: 28,
    stock: 2,
    threshold: 2,
  },
  {
    item_name: "Front Fork Oil Seal Kit RE",
    cat: 4,
    brand: 0,
    sale: 350,
    purchase: 210,
    mrp: 430,
    gst: 18,
    stock: 30,
    threshold: 6,
  },
  {
    item_name: "Swing Arm Bush Kit Honda CB350",
    cat: 4,
    brand: 3,
    sale: 280,
    purchase: 165,
    mrp: 350,
    gst: 18,
    stock: 25,
    threshold: 5,
  },
  {
    item_name: "Front Fork Assembly TVS Apache RTR",
    cat: 4,
    brand: 4,
    sale: 3800,
    purchase: 2400,
    mrp: 4600,
    gst: 28,
    stock: 3,
    threshold: 2,
  },
  {
    item_name: "Steering Bearing Set Yamaha R15",
    cat: 4,
    brand: 6,
    sale: 450,
    purchase: 270,
    mrp: 560,
    gst: 18,
    stock: 20,
    threshold: 4,
  },

  // Fuel System
  {
    item_name: "Carburetor Assembly Bajaj CT100",
    cat: 5,
    brand: 1,
    sale: 1800,
    purchase: 1100,
    mrp: 2200,
    gst: 28,
    stock: 1,
    threshold: 2,
  },
  {
    item_name: "Fuel Cock Assembly RE Classic",
    cat: 5,
    brand: 0,
    sale: 380,
    purchase: 230,
    mrp: 470,
    gst: 18,
    stock: 28,
    threshold: 5,
  },
  {
    item_name: "Fuel Filter Honda Activa 6G",
    cat: 5,
    brand: 3,
    sale: 120,
    purchase: 70,
    mrp: 160,
    gst: 18,
    stock: 60,
    threshold: 12,
  },
  {
    item_name: "Injector Nozzle KTM 390",
    cat: 5,
    brand: 5,
    sale: 2500,
    purchase: 1600,
    mrp: 3000,
    gst: 28,
    stock: 5,
    threshold: 2,
  },
  {
    item_name: "Fuel Pump Suzuki Gixxer",
    cat: 5,
    brand: 7,
    sale: 1350,
    purchase: 850,
    mrp: 1650,
    gst: 18,
    stock: 7,
    threshold: 2,
  },

  // Exhaust
  {
    item_name: "Silencer Assembly RE Bullet 350",
    cat: 6,
    brand: 0,
    sale: 3200,
    purchase: 2000,
    mrp: 3900,
    gst: 28,
    stock: 2,
    threshold: 2,
  },
  {
    item_name: "Exhaust Pipe Honda Hornet",
    cat: 6,
    brand: 3,
    sale: 1800,
    purchase: 1100,
    mrp: 2200,
    gst: 28,
    stock: 5,
    threshold: 2,
  },
  {
    item_name: "Muffler Guard RE Classic Chrome",
    cat: 6,
    brand: 0,
    sale: 650,
    purchase: 400,
    mrp: 800,
    gst: 18,
    stock: 12,
    threshold: 3,
  },
  {
    item_name: "Catalytic Converter Bajaj Dominar",
    cat: 6,
    brand: 1,
    sale: 4500,
    purchase: 2900,
    mrp: 5500,
    gst: 28,
    stock: 2,
    threshold: 1,
  },

  // Transmission
  {
    item_name: "Clutch Plate Set RE Himalayan",
    cat: 7,
    brand: 0,
    sale: 1100,
    purchase: 700,
    mrp: 1350,
    gst: 28,
    stock: 15,
    threshold: 4,
  },
  {
    item_name: "Chain Sprocket Kit Hero Passion",
    cat: 7,
    brand: 2,
    sale: 680,
    purchase: 420,
    mrp: 850,
    gst: 28,
    stock: 20,
    threshold: 5,
  },
  {
    item_name: "Clutch Cable Bajaj Avenger",
    cat: 7,
    brand: 1,
    sale: 180,
    purchase: 105,
    mrp: 230,
    gst: 18,
    stock: 40,
    threshold: 8,
  },
  {
    item_name: "Gear Shift Lever Yamaha MT-15",
    cat: 7,
    brand: 6,
    sale: 750,
    purchase: 460,
    mrp: 920,
    gst: 18,
    stock: 10,
    threshold: 3,
  },
  {
    item_name: "Drive Chain 428H Endurance",
    cat: 7,
    brand: 11,
    sale: 550,
    purchase: 340,
    mrp: 680,
    gst: 18,
    stock: 25,
    threshold: 5,
  },

  // Tyres & Tubes
  {
    item_name: "Front Tyre 90/90-19 CEAT",
    cat: 8,
    brand: 9,
    sale: 2200,
    purchase: 1400,
    mrp: 2700,
    gst: 28,
    stock: 10,
    threshold: 3,
  },
  {
    item_name: "Rear Tyre 120/80-18 MRF",
    cat: 8,
    brand: 9,
    sale: 2800,
    purchase: 1800,
    mrp: 3400,
    gst: 28,
    stock: 8,
    threshold: 3,
  },
  {
    item_name: "Inner Tube 3.00-18",
    cat: 8,
    brand: 9,
    sale: 280,
    purchase: 170,
    mrp: 350,
    gst: 28,
    stock: 30,
    threshold: 6,
  },
  {
    item_name: "Tubeless Tyre Kit Minda",
    cat: 8,
    brand: 10,
    sale: 450,
    purchase: 280,
    mrp: 560,
    gst: 28,
    stock: 20,
    threshold: 5,
  },

  // Lubricants
  {
    item_name: "Engine Oil 10W-30 1L Motul",
    cat: 9,
    brand: 9,
    sale: 380,
    purchase: 240,
    mrp: 450,
    gst: 18,
    stock: 80,
    threshold: 15,
  },
  {
    item_name: "Engine Oil 20W-40 1L Castrol",
    cat: 9,
    brand: 9,
    sale: 350,
    purchase: 220,
    mrp: 420,
    gst: 18,
    stock: 90,
    threshold: 15,
  },
  {
    item_name: "Gear Oil 80W-90 150ml",
    cat: 9,
    brand: 9,
    sale: 120,
    purchase: 75,
    mrp: 150,
    gst: 18,
    stock: 100,
    threshold: 20,
  },
  {
    item_name: "Brake Fluid DOT4 100ml Bosch",
    cat: 9,
    brand: 9,
    sale: 180,
    purchase: 110,
    mrp: 220,
    gst: 18,
    stock: 45,
    threshold: 10,
  },
  {
    item_name: "Chain Lube Spray 150ml",
    cat: 9,
    brand: 9,
    sale: 250,
    purchase: 155,
    mrp: 310,
    gst: 18,
    stock: 35,
    threshold: 8,
  },

  // Accessories
  {
    item_name: "Rear View Mirror Pair RE Classic",
    cat: 10,
    brand: 12,
    sale: 550,
    purchase: 340,
    mrp: 680,
    gst: 18,
    stock: 22,
    threshold: 5,
  },
  {
    item_name: "Handle Grip Set Universal",
    cat: 10,
    brand: 10,
    sale: 180,
    purchase: 100,
    mrp: 230,
    gst: 18,
    stock: 60,
    threshold: 12,
  },
  {
    item_name: "Seat Cover RE Classic Deluxe",
    cat: 10,
    brand: 0,
    sale: 1200,
    purchase: 750,
    mrp: 1450,
    gst: 28,
    stock: 10,
    threshold: 3,
  },
  {
    item_name: "Mobile Holder Waterproof",
    cat: 10,
    brand: 10,
    sale: 350,
    purchase: 200,
    mrp: 450,
    gst: 18,
    stock: 40,
    threshold: 8,
  },
  {
    item_name: "Helmet Mount Action Camera Bracket",
    cat: 10,
    brand: 10,
    sale: 450,
    purchase: 280,
    mrp: 580,
    gst: 18,
    stock: 15,
    threshold: 4,
  },
  {
    item_name: "Indicator LED Set Universal Fiem",
    cat: 10,
    brand: 12,
    sale: 380,
    purchase: 230,
    mrp: 470,
    gst: 18,
    stock: 30,
    threshold: 6,
  },
  {
    item_name: "USB Charger Socket 12V",
    cat: 10,
    brand: 10,
    sale: 280,
    purchase: 165,
    mrp: 360,
    gst: 18,
    stock: 25,
    threshold: 5,
  },

  // Filters
  {
    item_name: "Air Filter RE Classic 350",
    cat: 11,
    brand: 0,
    sale: 320,
    purchase: 195,
    mrp: 400,
    gst: 18,
    stock: 35,
    threshold: 7,
  },
  {
    item_name: "Oil Filter Hero Pleasure",
    cat: 11,
    brand: 2,
    sale: 150,
    purchase: 85,
    mrp: 190,
    gst: 18,
    stock: 50,
    threshold: 10,
  },
  {
    item_name: "Air Filter Honda Activa 125",
    cat: 11,
    brand: 3,
    sale: 280,
    purchase: 170,
    mrp: 350,
    gst: 18,
    stock: 40,
    threshold: 8,
  },
  {
    item_name: "Oil Filter Bajaj Pulsar NS200",
    cat: 11,
    brand: 1,
    sale: 180,
    purchase: 105,
    mrp: 230,
    gst: 18,
    stock: 45,
    threshold: 9,
  },
  {
    item_name: "Air Filter Element KTM 200",
    cat: 11,
    brand: 5,
    sale: 550,
    purchase: 340,
    mrp: 680,
    gst: 18,
    stock: 12,
    threshold: 3,
  },
  {
    item_name: "Fuel Filter Universal Inline",
    cat: 11,
    brand: 9,
    sale: 80,
    purchase: 45,
    mrp: 110,
    gst: 18,
    stock: 70,
    threshold: 15,
  },
];

const PARTY_NAMES = [
  "Rajesh Auto Parts",
  "Kumar Motor Works",
  "Agarwal Two Wheeler Spares",
  "Singh Motor House",
  "Patel Auto Components",
  "Sharma Bike Centre",
  "Gupta Motor Store",
  "Joshi Auto Spares",
  "Malhotra Two Wheelers",
  "Verma Motor Parts",
  "Soni Auto Traders",
  "Jain Motor Agency",
  "Thakur Auto Works",
  "Saxena Motor Spares",
  "Rathore Bike Store",
  "Tiwari Auto Parts",
  "Meena Motor Mart",
  "Choudhary Two Wheeler Hub",
  "Pandey Motor Accessories",
  "Dubey Auto World",
  "Kapoor Bike Zone",
  "Nair Auto Solutions",
  "Reddy Motor Parts",
  "Yadav Auto Centre",
  "Bhatt Vehicle Spares",
  "Chauhan Motor Agency",
  "Mishra Two Wheeler Spares",
  "Shukla Auto Parts House",
  "Rawat Motor World",
  "Goyal Bike Components",
];

const SUPPLIER_NAMES = [
  "Shree Krishna Auto Parts Pvt Ltd",
  "National Motor Distributors",
  "Bharat Auto Components Co",
  "Indo-Japan Motor Spares Ltd",
  "Universal Two Wheeler Parts",
  "Laxmi Auto Industries",
  "Ganesh Motor Supplies",
  "Saraswati Auto Distributors",
  "Hanuman Motor Traders",
  "Mahadev Auto Parts Co",
  "Shiv Shakti Motor Components",
  "Balaji Auto Suppliers",
  "Jay Ambe Motor Industries",
  "Durga Auto Distributors",
  "Jai Mata Di Motor Parts Pvt Ltd",
  "Standard Auto Components",
  "Premier Motor Parts Ltd",
  "Royal Auto Distributors",
  "Supreme Motor Spares",
  "Reliable Auto Parts Co",
];

const AGENT_NAMES = [
  "Suresh Kumar",
  "Mohan Lal",
  "Rakesh Sharma",
  "Vijay Singh",
  "Dinesh Joshi",
  "Anil Gupta",
  "Ramesh Patel",
  "Sanjay Verma",
  "Deepak Malhotra",
  "Rajendra Agarwal",
  "Ashok Tiwari",
  "Manoj Saxena",
  "Praveen Rathore",
  "Kailash Meena",
  "Hemant Dubey",
];

// ═══════════════════════════════════════════════════════════════════
// ── MAIN SEED FUNCTION ──────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
async function seed() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // ── 1 · Drop all data ──
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

    // Drop stale unique indexes that may conflict
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
        }
      }
    } catch (_) {}

    try {
      const itemsCol = mongoose.connection.collection("items");
      await itemsCol.dropIndexes();
    } catch (_) {}

    // ── 2 · Users (1 main + 2 secondary) ──────────────────────────
    const adminPass = await bcrypt.hash("Admin@1234", SALT);
    const gstPass = await bcrypt.hash("Test@1234", SALT);
    const nonGstPass = await bcrypt.hash("Test@1234", SALT);
    const staffGstPass = await bcrypt.hash("Staff@1234", SALT);
    const staffNonGstPass = await bcrypt.hash("Staff@1234", SALT);

    const mainUser = await User.create({
      type: "main",
      name: "Ramesh Maheshwari",
      email: "ramesh@maheshwarimotors.com",
      phone: "9876543210",
      gst_firm: {
        username: "gst_ramesh",
        password: gstPass,
        name: "Maheshwari Motors Pvt Ltd",
        phone: "9876543210",
        email: "gst@maheshwarimotors.com",
        address: "123, Industrial Area, MI Road",
        godown_address: "45, Godown Complex, Sitapura",
        city: "Jaipur",
        state: "Rajasthan",
        GSTIN: "08AABCM1234A1Z5",
        CIN: "U50101RJ2020PTC123456",
        reg_number: "RJ-2020-MM-001",
        bank_name: "HDFC Bank",
        bank_branch: "MI Road, Jaipur",
        ifsc_code: "HDFC0001234",
        account_number: "50100068753421",
      },
      nongst_firm: {
        username: "nongst_ramesh",
        password: nonGstPass,
        name: "Maheshwari Motors",
        phone: "9876543211",
        email: "nongst@maheshwarimotors.com",
        address: "124, Industrial Area, MI Road",
        godown_address: "45, Godown Complex, Sitapura",
        city: "Jaipur",
        state: "Rajasthan",
        bank_name: "State Bank of India",
        bank_branch: "Tonk Road, Jaipur",
        ifsc_code: "SBIN0005678",
        account_number: "38764521098765",
      },
      admin: {
        username: "admin_ramesh",
        password: adminPass,
      },
    });

    const staff1 = await User.create({
      type: "secondary",
      name: "Suresh Sharma",
      email: "suresh@maheshwarimotors.com",
      phone: "9876501234",
      gst_firm: {
        username: "gst_suresh",
        password: staffGstPass,
        name: "Maheshwari Motors Pvt Ltd",
        phone: "9876501234",
        email: "suresh.gst@maheshwarimotors.com",
        address: "123, Industrial Area, MI Road",
        city: "Jaipur",
        state: "Rajasthan",
        GSTIN: "08AABCM1234A1Z5",
      },
      nongst_firm: {
        username: "nongst_suresh",
        password: staffNonGstPass,
        name: "Maheshwari Motors",
        phone: "9876501234",
        email: "suresh.nongst@maheshwarimotors.com",
        address: "124, Industrial Area, MI Road",
        city: "Jaipur",
        state: "Rajasthan",
      },
    });

    const staff2Pass = await bcrypt.hash("Staff@1234", SALT);
    const staff2 = await User.create({
      type: "secondary",
      name: "Mukesh Kumar",
      email: "mukesh@maheshwarimotors.com",
      phone: "9876504567",
      gst_firm: {
        username: "gst_mukesh",
        password: staff2Pass,
        name: "Maheshwari Motors Pvt Ltd",
        phone: "9876504567",
        email: "mukesh.gst@maheshwarimotors.com",
        address: "123, Industrial Area, MI Road",
        city: "Jaipur",
        state: "Rajasthan",
        GSTIN: "08AABCM1234A1Z5",
      },
      nongst_firm: {
        username: "nongst_mukesh",
        password: staff2Pass,
        name: "Maheshwari Motors",
        phone: "9876504567",
        email: "mukesh.nongst@maheshwarimotors.com",
        address: "124, Industrial Area, MI Road",
        city: "Jaipur",
        state: "Rajasthan",
      },
    });

    const userId = mainUser._id;
    console.log("✅ Users created: 3 (1 main + 2 staff)");
    console.log(`   Admin: admin_ramesh / Admin@1234`);
    console.log(`   GST Firm: gst_ramesh / Test@1234`);
    console.log(`   Non-GST Firm: nongst_ramesh / Test@1234`);
    console.log(
      `   Staff GST: gst_suresh / Staff@1234, gst_mukesh / Staff@1234`,
    );

    // ── 3 · HSN Codes ─────────────────────────────────────────────
    const hsnDocs = await Hsn.insertMany(
      HSN_DATA.map((h, i) => ({
        id: i + 1,
        hsn_code: h.hsn_code,
        description: h.description,
        gst_rate: h.gst_rate,
        user_id: userId,
      })),
    );
    console.log(`✅ HSN codes created: ${hsnDocs.length}`);

    // ── 4 · Categories ────────────────────────────────────────────
    const categoryDocs = await Category.insertMany(
      CATEGORY_DATA.map((c, i) => ({
        id: i + 1,
        name: c.name,
        description: c.description,
        user_id: userId,
      })),
    );
    console.log(`✅ Categories created: ${categoryDocs.length}`);

    // ── 5 · Brands (linked to HSN + Categories) ──────────────────
    const brandDocs = await Brand.insertMany(
      BRAND_DATA.map((b, i) => ({
        id: i + 1,
        name: b.name,
        discount1: b.discount1,
        discount2: b.discount2,
        hsn_id: hsnDocs[i % hsnDocs.length]._id,
        user_id: userId,
      })),
    );

    // Link brands to categories
    for (let i = 0; i < categoryDocs.length; i++) {
      const linkedBrands = brandDocs
        .filter(
          (_, bIdx) =>
            bIdx % categoryDocs.length === i || randBetween(0, 3) === 0,
        )
        .map((b) => b._id);
      await Category.findByIdAndUpdate(categoryDocs[i]._id, {
        brand_ids: linkedBrands,
      });
    }
    console.log(`✅ Brands created: ${brandDocs.length}`);

    // ── 6 · Transports ────────────────────────────────────────────
    const transportDocs = await Transport.insertMany(
      TRANSPORT_DATA.map((t, i) => ({
        id: i + 1,
        name: t.name,
        address: `${randBetween(1, 500)}, Transport Nagar`,
        city: t.city,
        pincode: `${randBetween(300000, 400000)}`,
        phone: `98${randBetween(10000000, 99999999)}`,
        whatsapp: `98${randBetween(10000000, 99999999)}`,
        gstin: t.gstin,
        user_id: userId,
      })),
    );
    console.log(`✅ Transports created: ${transportDocs.length}`);

    // ── 7 · Contacts: Parties (30) ────────────────────────────────
    const partyDocs = await Contact.insertMany(
      PARTY_NAMES.map((name, i) => {
        const state = pick(STATES);
        const city = pick(CITIES[state]);
        return {
          id: i + 1,
          name,
          type: "party",
          phone: `97${randBetween(10000000, 99999999)}`,
          whatsapp_number: `97${randBetween(10000000, 99999999)}`,
          email: `${name.split(" ")[0].toLowerCase()}${i}@email.com`,
          address: `${randBetween(1, 999)}, ${pick(["Station Road", "MG Road", "Main Bazaar", "Industrial Estate", "GT Road"])}`,
          city,
          state,
          gstin:
            i < 20 ?
              `${String(randBetween(1, 37)).padStart(2, "0")}AABCP${randBetween(1000, 9999)}A1Z${randBetween(1, 9)}`
            : undefined,
          cin:
            i < 5 ?
              `U50100${state.substring(0, 2).toUpperCase()}2020PTC${randBetween(100000, 999999)}`
            : undefined,
          reg_number:
            i < 10 ?
              `${state.substring(0, 2).toUpperCase()}-${randBetween(2018, 2024)}-${randBetween(100, 999)}`
            : undefined,
          bank_name: pick(BANK_NAMES),
          bank_branch: `${city} Main Branch`,
          ifsc_code: `${pick(["HDFC", "SBIN", "ICIC", "PUNB", "BARB"])}0${randBetween(100000, 999999)}`,
          account_number: `${randBetween(10000000000, 99999999999)}`,
          transport_charge: pick([0, 0, 50, 100, 150, 200]),
          area: city,
          is_gst: i < 20 ? 1 : 0,
          transport_id: pick(transportDocs)._id,
          balance: round2(randBetween(-5000, 25000)),
          user_id: userId,
        };
      }),
    );
    console.log(`✅ Parties created: ${partyDocs.length}`);

    // ── 8 · Contacts: Suppliers (20) ──────────────────────────────
    const supplierDocs = await Contact.insertMany(
      SUPPLIER_NAMES.map((name, i) => {
        const state = pick(STATES);
        const city = pick(CITIES[state]);
        return {
          id: partyDocs.length + i + 1,
          name,
          type: "supplier",
          phone: `96${randBetween(10000000, 99999999)}`,
          whatsapp_number: `96${randBetween(10000000, 99999999)}`,
          email: `${name.split(" ")[0].toLowerCase()}${i}@supplier.com`,
          address: `${randBetween(1, 999)}, ${pick(["Industrial Area", "MIDC Area", "Auto Market", "Wholesale Zone"])}`,
          city,
          state,
          gstin: `${String(randBetween(1, 37)).padStart(2, "0")}AABCS${randBetween(1000, 9999)}A1Z${randBetween(1, 9)}`,
          bank_name: pick(BANK_NAMES),
          bank_branch: `${city} Industrial Branch`,
          ifsc_code: `${pick(["HDFC", "SBIN", "ICIC", "PUNB", "BARB"])}0${randBetween(100000, 999999)}`,
          account_number: `${randBetween(10000000000, 99999999999)}`,
          is_gst: 1,
          transport_id: pick(transportDocs)._id,
          balance: round2(randBetween(-50000, 10000)),
          user_id: userId,
        };
      }),
    );
    console.log(`✅ Suppliers created: ${supplierDocs.length}`);

    // ── 9 · Agents (linked to parties) ────────────────────────────
    const agentDocs = await Agent.insertMany(
      AGENT_NAMES.map((name, i) => {
        const state = pick(STATES);
        const city = pick(CITIES[state]);
        return {
          id: i + 1,
          name,
          address: `${randBetween(1, 500)}, ${city}`,
          city,
          pincode: `${randBetween(300000, 400000)}`,
          phone: `99${randBetween(10000000, 99999999)}`,
          whatsapp: `99${randBetween(10000000, 99999999)}`,
          party_id: partyDocs[i % partyDocs.length]._id,
          user_id: userId,
        };
      }),
    );
    console.log(`✅ Agents created: ${agentDocs.length}`);

    // Link agents to some parties
    for (let i = 0; i < partyDocs.length; i++) {
      if (i < agentDocs.length) {
        await Contact.findByIdAndUpdate(partyDocs[i]._id, {
          agent_id: agentDocs[i % agentDocs.length]._id,
        });
      }
    }

    // ── 10 · Areas (linked to agents + transports) ───────────────
    const areaDocs = [];
    for (const state of STATES) {
      for (const city of CITIES[state]) {
        const area = await Area.create({
          id: areaDocs.length + 1,
          city,
          state,
          pincode: `${randBetween(300000, 800000)}`,
          phone: `98${randBetween(10000000, 99999999)}`,
          whatsapp: `98${randBetween(10000000, 99999999)}`,
          agent_id: pick(agentDocs)._id,
          transport_id: pick(transportDocs)._id,
          user_id: userId,
        });
        areaDocs.push(area);
      }
    }
    console.log(`✅ Areas created: ${areaDocs.length}`);

    // Link areas to some parties
    for (let i = 0; i < partyDocs.length; i++) {
      await Contact.findByIdAndUpdate(partyDocs[i]._id, {
        area_id: areaDocs[i % areaDocs.length]._id,
      });
    }

    // ── 11 · Items (with barcode + item_id) ───────────────────────
    const itemDocs = await Item.insertMany(
      ITEM_TEMPLATES.map((t, i) => ({
        id: i + 1,
        item_name: t.item_name,
        barcode: generateBarcode(),
        item_id: 1001 + i,
        sale_rate: t.sale,
        purchase_rate: t.purchase,
        mrp_rate: t.mrp,
        gst_percent: t.gst,
        discount: pick([0, 2, 5, 8, 10]),
        stock: t.stock,
        threshold: t.threshold,
        is_gst: 1,
        category_id: categoryDocs[t.cat]._id,
        brand_id: brandDocs[t.brand]._id,
        contact_id: supplierDocs[i % supplierDocs.length]._id,
        user_id: userId,
      })),
    );
    console.log(`✅ Items created: ${itemDocs.length}`);

    // Also create some Non-GST items
    const nonGstItems = await Item.insertMany(
      ITEM_TEMPLATES.slice(0, 20).map((t, i) => ({
        id: itemDocs.length + i + 1,
        item_name: `${t.item_name} (Non-GST)`,
        barcode: generateBarcode(),
        item_id: 2001 + i,
        sale_rate: round2(t.sale * 0.85),
        purchase_rate: round2(t.purchase * 0.85),
        mrp_rate: round2(t.mrp * 0.85),
        gst_percent: 0,
        discount: pick([0, 5, 10]),
        stock: Math.max(1, Math.floor(t.stock * 0.7)),
        threshold: t.threshold,
        is_gst: 0,
        category_id: categoryDocs[t.cat]._id,
        brand_id: brandDocs[t.brand]._id,
        contact_id: supplierDocs[i % supplierDocs.length]._id,
        user_id: userId,
      })),
    );
    console.log(`✅ Non-GST Items created: ${nonGstItems.length}`);

    const allItems = [...itemDocs, ...nonGstItems];

    // ── 12 · Sale Challans (GST — 25) ────────────────────────────
    const gstSaleChallans = [];
    for (let i = 0; i < 25; i++) {
      const party = partyDocs[i % partyDocs.length];
      const numItems = randBetween(1, 5);
      const selectedItems = [];
      for (let j = 0; j < numItems; j++) {
        const item = pick(itemDocs);
        const qty = randBetween(1, 6);
        const rate = item.sale_rate;
        const disc = item.discount || 0;
        const grossAmt = round2(qty * rate);
        const discAmt = round2((grossAmt * disc) / 100);
        const taxableAmt = round2(grossAmt - discAmt);
        const gstAmt = round2((taxableAmt * item.gst_percent) / 100);
        const amt = round2(taxableAmt + gstAmt);
        selectedItems.push({
          item_id: item._id,
          quantity: qty,
          rate,
          discount: disc,
          special_discount: 0,
          gross_amount: grossAmt,
          discount_amount: discAmt,
          total_discount: discAmt,
          taxable_amount: taxableAmt,
          gst_percent: item.gst_percent,
          gst_amount: gstAmt,
          amount: amt,
          is_gst: 1,
        });
      }

      const grossTotal = round2(
        selectedItems.reduce((s, x) => s + x.gross_amount, 0),
      );
      const subTotal = round2(
        selectedItems.reduce((s, x) => s + x.taxable_amount, 0),
      );
      const totalAmt = round2(selectedItems.reduce((s, x) => s + x.amount, 0));

      gstSaleChallans.push({
        id: i + 1,
        challan_no: `SC-GST-${String(i + 1).padStart(4, "0")}`,
        challan_type: "sale",
        date: daysAgo(randBetween(0, 60)),
        contact_id: party._id,
        items: selectedItems,
        gross_total: grossTotal,
        sub_total: subTotal,
        discount: round2(grossTotal - subTotal),
        amount: totalAmt,
        converted_to_bill: i < 15,
        payment_status:
          i < 10 ? "paid"
          : i < 20 ? "due"
          : "overpaid",
        paid_amount:
          i < 10 ? totalAmt
          : i < 20 ? round2(totalAmt * 0.5)
          : round2(totalAmt * 1.1),
        is_gst: 1,
        user_id: userId,
      });
    }
    const gstSaleChallanDocs = await Challan.insertMany(gstSaleChallans);
    console.log(`✅ GST Sale Challans created: ${gstSaleChallanDocs.length}`);

    // ── 13 · Sale Challans (Non-GST — 15) ────────────────────────
    const nonGstSaleChallans = [];
    for (let i = 0; i < 15; i++) {
      const party =
        partyDocs.filter((p) => p.is_gst === 0)[i % 10] ||
        partyDocs[i % partyDocs.length];
      const numItems = randBetween(1, 4);
      const selectedItems = [];
      for (let j = 0; j < numItems; j++) {
        const item =
          nonGstItems.length > 0 ? pick(nonGstItems) : pick(itemDocs);
        const qty = randBetween(1, 8);
        const rate = item.sale_rate;
        const grossAmt = round2(qty * rate);
        selectedItems.push({
          item_id: item._id,
          quantity: qty,
          rate,
          discount: 0,
          special_discount: 0,
          gross_amount: grossAmt,
          discount_amount: 0,
          total_discount: 0,
          taxable_amount: grossAmt,
          gst_percent: 0,
          gst_amount: 0,
          amount: grossAmt,
          is_gst: 0,
        });
      }

      const grossTotal = round2(
        selectedItems.reduce((s, x) => s + x.gross_amount, 0),
      );
      const totalAmt = grossTotal;

      nonGstSaleChallans.push({
        id: gstSaleChallans.length + i + 1,
        challan_no: `SC-NONGST-${String(i + 1).padStart(4, "0")}`,
        challan_type: "sale",
        date: daysAgo(randBetween(0, 45)),
        contact_id: party._id,
        items: selectedItems,
        gross_total: grossTotal,
        sub_total: grossTotal,
        discount: 0,
        amount: totalAmt,
        converted_to_bill: i < 8,
        payment_status: i < 6 ? "paid" : "due",
        paid_amount: i < 6 ? totalAmt : round2(totalAmt * 0.3),
        is_gst: 0,
        user_id: userId,
      });
    }
    const nonGstSaleChallanDocs = await Challan.insertMany(nonGstSaleChallans);
    console.log(
      `✅ Non-GST Sale Challans created: ${nonGstSaleChallanDocs.length}`,
    );

    // ── 14 · Purchase Challans (GST — 20) ─────────────────────────
    const gstPurchaseChallans = [];
    for (let i = 0; i < 20; i++) {
      const supplier = supplierDocs[i % supplierDocs.length];
      const numItems = randBetween(2, 6);
      const selectedItems = [];
      for (let j = 0; j < numItems; j++) {
        const item = pick(itemDocs);
        const qty = randBetween(5, 20);
        const rate = item.purchase_rate;
        const grossAmt = round2(qty * rate);
        const gstAmt = round2((grossAmt * item.gst_percent) / 100);
        const amt = round2(grossAmt + gstAmt);
        selectedItems.push({
          item_id: item._id,
          quantity: qty,
          rate,
          discount: 0,
          special_discount: 0,
          gross_amount: grossAmt,
          discount_amount: 0,
          total_discount: 0,
          taxable_amount: grossAmt,
          gst_percent: item.gst_percent,
          gst_amount: gstAmt,
          amount: amt,
          is_gst: 1,
        });
      }

      const grossTotal = round2(
        selectedItems.reduce((s, x) => s + x.gross_amount, 0),
      );
      const totalAmt = round2(selectedItems.reduce((s, x) => s + x.amount, 0));

      gstPurchaseChallans.push({
        id: gstSaleChallans.length + nonGstSaleChallans.length + i + 1,
        challan_no: `PC-GST-${String(i + 1).padStart(4, "0")}`,
        challan_type: "purchase",
        date: daysAgo(randBetween(0, 60)),
        contact_id: supplier._id,
        items: selectedItems,
        gross_total: grossTotal,
        sub_total: grossTotal,
        discount: 0,
        amount: totalAmt,
        payment_status: i < 12 ? "paid" : "due",
        paid_amount: i < 12 ? totalAmt : round2(totalAmt * 0.4),
        is_gst: 1,
        user_id: userId,
      });
    }
    const gstPurchaseChallanDocs =
      await Challan.insertMany(gstPurchaseChallans);
    console.log(
      `✅ GST Purchase Challans created: ${gstPurchaseChallanDocs.length}`,
    );

    // ── 15 · Purchase Challans (Non-GST — 10) ────────────────────
    const nonGstPurchaseChallans = [];
    for (let i = 0; i < 10; i++) {
      const supplier = supplierDocs[i % supplierDocs.length];
      const numItems = randBetween(2, 4);
      const selectedItems = [];
      for (let j = 0; j < numItems; j++) {
        const item =
          nonGstItems.length > 0 ? pick(nonGstItems) : pick(itemDocs);
        const qty = randBetween(5, 15);
        const rate = item.purchase_rate;
        const grossAmt = round2(qty * rate);
        selectedItems.push({
          item_id: item._id,
          quantity: qty,
          rate,
          discount: 0,
          special_discount: 0,
          gross_amount: grossAmt,
          discount_amount: 0,
          total_discount: 0,
          taxable_amount: grossAmt,
          gst_percent: 0,
          gst_amount: 0,
          amount: grossAmt,
          is_gst: 0,
        });
      }

      const grossTotal = round2(
        selectedItems.reduce((s, x) => s + x.gross_amount, 0),
      );

      nonGstPurchaseChallans.push({
        id:
          gstSaleChallans.length +
          nonGstSaleChallans.length +
          gstPurchaseChallans.length +
          i +
          1,
        challan_no: `PC-NONGST-${String(i + 1).padStart(4, "0")}`,
        challan_type: "purchase",
        date: daysAgo(randBetween(0, 45)),
        contact_id: supplier._id,
        items: selectedItems,
        gross_total: grossTotal,
        sub_total: grossTotal,
        discount: 0,
        amount: grossTotal,
        payment_status: i < 6 ? "paid" : "due",
        paid_amount: i < 6 ? grossTotal : round2(grossTotal * 0.25),
        is_gst: 0,
        user_id: userId,
      });
    }
    const nonGstPurchaseChallanDocs = await Challan.insertMany(
      nonGstPurchaseChallans,
    );
    console.log(
      `✅ Non-GST Purchase Challans created: ${nonGstPurchaseChallanDocs.length}`,
    );

    // ── 16 · Bills (GST — 15, from converted sale challans) ──────
    const gstBills = [];
    const convertedGstChallans = gstSaleChallanDocs.filter(
      (c) => c.converted_to_bill,
    );
    for (let i = 0; i < convertedGstChallans.length; i++) {
      const challan = convertedGstChallans[i];
      const amt = challan.amount;
      const paidAmt = i < 8 ? amt : round2((amt * randBetween(30, 80)) / 100);
      const status = paidAmt >= amt ? "paid" : "due";

      gstBills.push({
        id: i + 1,
        bill_no: `BILL-GST-${String(i + 1).padStart(4, "0")}`,
        date: new Date(challan.date.getTime() + 86400000 * randBetween(1, 5)),
        contact_id: challan.contact_id,
        amount: amt,
        paid_amount: paidAmt,
        return_amount: 0,
        payment_status: status,
        challan_ids: [challan._id],
        is_gst: 1,
        user_id: userId,
      });
    }
    const gstBillDocs = await Bill.insertMany(gstBills);

    // Link bills back to challans
    for (let i = 0; i < gstBillDocs.length; i++) {
      await Challan.findByIdAndUpdate(convertedGstChallans[i]._id, {
        bill_id: gstBillDocs[i]._id,
      });
    }
    console.log(`✅ GST Bills created: ${gstBillDocs.length}`);

    // ── 17 · Bills (Non-GST — 8, from converted non-gst sale challans) ─
    const nonGstBills = [];
    const convertedNonGstChallans = nonGstSaleChallanDocs.filter(
      (c) => c.converted_to_bill,
    );
    for (let i = 0; i < convertedNonGstChallans.length; i++) {
      const challan = convertedNonGstChallans[i];
      const amt = challan.amount;
      const paidAmt = i < 5 ? amt : round2((amt * randBetween(20, 70)) / 100);
      const status = paidAmt >= amt ? "paid" : "due";

      nonGstBills.push({
        id: gstBills.length + i + 1,
        bill_no: `BILL-NONGST-${String(i + 1).padStart(4, "0")}`,
        date: new Date(challan.date.getTime() + 86400000 * randBetween(1, 5)),
        contact_id: challan.contact_id,
        amount: amt,
        paid_amount: paidAmt,
        return_amount: 0,
        payment_status: status,
        challan_ids: [challan._id],
        is_gst: 0,
        user_id: userId,
      });
    }
    const nonGstBillDocs = await Bill.insertMany(nonGstBills);

    for (let i = 0; i < nonGstBillDocs.length; i++) {
      await Challan.findByIdAndUpdate(convertedNonGstChallans[i]._id, {
        bill_id: nonGstBillDocs[i]._id,
      });
    }
    console.log(`✅ Non-GST Bills created: ${nonGstBillDocs.length}`);

    // ── 18 · Multi-challan Bills (some bills combining 2-3 challans) ─
    const multiChallanBills = [];
    const unconvertedGst = gstSaleChallanDocs.filter(
      (c) => !c.converted_to_bill,
    );
    for (let i = 0; i + 1 < unconvertedGst.length; i += 2) {
      const c1 = unconvertedGst[i];
      const c2 = unconvertedGst[i + 1];
      const totalAmt = round2(c1.amount + c2.amount);
      const billId =
        gstBills.length + nonGstBills.length + Math.floor(i / 2) + 1;

      multiChallanBills.push({
        id: billId,
        bill_no: `BILL-GST-MULTI-${String(Math.floor(i / 2) + 1).padStart(4, "0")}`,
        date: daysAgo(randBetween(0, 15)),
        contact_id: c1.contact_id,
        amount: totalAmt,
        paid_amount: round2(totalAmt * 0.6),
        return_amount: 0,
        payment_status: "due",
        challan_ids: [c1._id, c2._id],
        is_gst: 1,
        user_id: userId,
      });
    }
    if (multiChallanBills.length > 0) {
      const multiBillDocs = await Bill.insertMany(multiChallanBills);
      for (let i = 0; i < multiBillDocs.length; i++) {
        const challanIds = multiChallanBills[i].challan_ids;
        for (const cId of challanIds) {
          await Challan.findByIdAndUpdate(cId, {
            converted_to_bill: true,
            bill_id: multiBillDocs[i]._id,
          });
        }
      }
      console.log(`✅ Multi-Challan Bills created: ${multiBillDocs.length}`);
    }

    // ── 19 · Reports ──────────────────────────────────────────────
    const reportTypes = [
      "challan",
      "bill",
      "inventory",
      "transaction",
      "other",
    ];
    const reportDocs = await Report.insertMany(
      Array.from({ length: 12 }, (_, i) => ({
        pdf_link: `https://s3.amazonaws.com/mm-reports/report_${i + 1}_${Date.now()}.pdf`,
        date_created: daysAgo(randBetween(0, 90)),
        user_id: userId,
        is_gst: i < 6 ? 1 : 0,
        report_type: reportTypes[i % reportTypes.length],
      })),
    );
    console.log(`✅ Reports created: ${reportDocs.length}`);

    // ── 20 · Counters (sync with actual data counts) ─────────────
    const counterData = [
      { model_name: "Item", user_id: userId, seq: allItems.length },
      {
        model_name: "ItemId",
        user_id: userId,
        seq: 2001 + nonGstItems.length - 1,
      },
      { model_name: "Category", user_id: userId, seq: categoryDocs.length },
      { model_name: "Brand", user_id: userId, seq: brandDocs.length },
      { model_name: "Hsn", user_id: userId, seq: hsnDocs.length },
      {
        model_name: "Contact",
        user_id: userId,
        seq: partyDocs.length + supplierDocs.length,
      },
      { model_name: "Agent", user_id: userId, seq: agentDocs.length },
      { model_name: "Transport", user_id: userId, seq: transportDocs.length },
      { model_name: "Area", user_id: userId, seq: areaDocs.length },
      {
        model_name: "Challan",
        user_id: userId,
        seq:
          gstSaleChallanDocs.length +
          nonGstSaleChallanDocs.length +
          gstPurchaseChallanDocs.length +
          nonGstPurchaseChallanDocs.length,
      },
      {
        model_name: "Bill",
        user_id: userId,
        seq:
          gstBillDocs.length + nonGstBillDocs.length + multiChallanBills.length,
      },
    ];
    await Counter.insertMany(counterData);
    console.log(`✅ Counters synced: ${counterData.length}`);

    // ── SUMMARY ──────────────────────────────────────────────────
    const totalChallans =
      gstSaleChallanDocs.length +
      nonGstSaleChallanDocs.length +
      gstPurchaseChallanDocs.length +
      nonGstPurchaseChallanDocs.length;
    const totalBills =
      gstBillDocs.length + nonGstBillDocs.length + multiChallanBills.length;

    console.log("\n╔══════════════════════════════════════════╗");
    console.log("║   SEED COMPLETED SUCCESSFULLY            ║");
    console.log("╠══════════════════════════════════════════╣");
    console.log(`║ Users:              3                    ║`);
    console.log(`║ HSN Codes:          ${String(hsnDocs.length).padEnd(22)}║`);
    console.log(
      `║ Categories:         ${String(categoryDocs.length).padEnd(22)}║`,
    );
    console.log(
      `║ Brands:             ${String(brandDocs.length).padEnd(22)}║`,
    );
    console.log(
      `║ Transports:         ${String(transportDocs.length).padEnd(22)}║`,
    );
    console.log(
      `║ Agents:             ${String(agentDocs.length).padEnd(22)}║`,
    );
    console.log(`║ Areas:              ${String(areaDocs.length).padEnd(22)}║`);
    console.log(
      `║ Parties:            ${String(partyDocs.length).padEnd(22)}║`,
    );
    console.log(
      `║ Suppliers:          ${String(supplierDocs.length).padEnd(22)}║`,
    );
    console.log(`║ Items (GST):        ${String(itemDocs.length).padEnd(22)}║`);
    console.log(
      `║ Items (Non-GST):    ${String(nonGstItems.length).padEnd(22)}║`,
    );
    console.log(
      `║ Sale Challans:      ${String(gstSaleChallanDocs.length + nonGstSaleChallanDocs.length).padEnd(22)}║`,
    );
    console.log(
      `║ Purchase Challans:  ${String(gstPurchaseChallanDocs.length + nonGstPurchaseChallanDocs.length).padEnd(22)}║`,
    );
    console.log(`║ Bills:              ${String(totalBills).padEnd(22)}║`);
    console.log(
      `║ Reports:            ${String(reportDocs.length).padEnd(22)}║`,
    );
    console.log(
      `║ Counters:           ${String(counterData.length).padEnd(22)}║`,
    );
    console.log("╠══════════════════════════════════════════╣");
    console.log("║ LOGIN CREDENTIALS                        ║");
    console.log("╠══════════════════════════════════════════╣");
    console.log("║ Admin:  admin_ramesh / Admin@1234        ║");
    console.log("║ GST:    gst_ramesh   / Test@1234         ║");
    console.log("║ NonGST: nongst_ramesh / Test@1234        ║");
    console.log("║ Staff:  gst_suresh   / Staff@1234        ║");
    console.log("║         gst_mukesh   / Staff@1234        ║");
    console.log("╚══════════════════════════════════════════╝");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seed();
