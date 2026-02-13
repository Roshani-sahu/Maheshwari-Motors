import mongoose from "mongoose";

const discountSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["item", "party_item", "party_all", "item_group", "profit_margin"],
      required: true,
    },

    percent1: { type: Number, default: 0, min: 0, max: 100 },
    percent2: { type: Number, default: 0, min: 0, max: 100 },
    fixed_amount: { type: Number, default: 0, min: 0 },

    profit_percent: { type: Number, default: 0, min: 0 },

    item_id: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
    party_id: { type: mongoose.Schema.Types.ObjectId, ref: "Party" },

    item_group_name: { type: String },
    item_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "Item" }],

    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    is_active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

discountSchema.index({ user_id: 1, type: 1 });
discountSchema.index({ user_id: 1, item_id: 1 });
discountSchema.index({ user_id: 1, party_id: 1 });

export default mongoose.model("Discount", discountSchema);
