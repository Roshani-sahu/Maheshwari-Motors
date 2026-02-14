import mongoose from "mongoose";

const stockAlertSchema = new mongoose.Schema(
  {
    id: { type: Number },
    item_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },
    stock_count: { type: Number, required: true },
    threshold: { type: Number, required: true },
    is_resolved: { type: Boolean, default: false },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true, id: false },
);

stockAlertSchema.index({ id: 1, user_id: 1 });

export default mongoose.model("StockAlert", stockAlertSchema);
