import mongoose from "mongoose";

/**
 * Discount Model (Redesigned)
 *
 * 3 Discount Columns:
 *   1. percent1 - First percentage discount
 *   2. percent2 - Second percentage discount (applied after first)
 *   3. fixed_amount - Fixed amount discount (applied after percentages)
 *
 * Discount Types:
 *   - item: Apply to specific item for all parties
 *   - party_item: Apply to specific item for specific party
 *   - party_all: Apply to ALL items for specific party
 *   - item_group: Apply to a group of items
 *   - profit_margin: Calculate sale price from purchase price + profit %
 *
 * Calculation Order: Original Price → Apply percent1 → Apply percent2 → Subtract fixed_amount
 */
const discountSchema = new mongoose.Schema(
  {
    // What type of discount rule is this?
    type: {
      type: String,
      enum: ["item", "party_item", "party_all", "item_group", "profit_margin"],
      required: true,
    },

    // 3 discount columns
    percent1: { type: Number, default: 0, min: 0, max: 100 },
    percent2: { type: Number, default: 0, min: 0, max: 100 },
    fixed_amount: { type: Number, default: 0, min: 0 },

    // For profit_margin type: profit percentage to add to purchase rate
    profit_percent: { type: Number, default: 0, min: 0 },

    // References (which item/party/group this applies to)
    item_id: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
    party_id: { type: mongoose.Schema.Types.ObjectId, ref: "Party" },

    // For item_group type: list of items in the group
    item_group_name: { type: String },
    item_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "Item" }],

    // Which firm does this discount belong to
    firm_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Firm",
      required: true,
    },

    // DEPRECATED: user_id - keeping for backward compat
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    is_active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Indexes for efficient queries
discountSchema.index({ firm_id: 1, type: 1 });
discountSchema.index({ firm_id: 1, item_id: 1 });
discountSchema.index({ firm_id: 1, party_id: 1 });

export default mongoose.model("Discount", discountSchema);
