import mongoose from "mongoose";

const discountSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: { type: String, enum: ["item", "party"], required: true },
    discount_type: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "percentage",
    },
    value: { type: Number, required: true },
    item_id: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
    party_id: { type: mongoose.Schema.Types.ObjectId, ref: "Party" },
  },
  { timestamps: true },
);

export default mongoose.model("Discount", discountSchema);
