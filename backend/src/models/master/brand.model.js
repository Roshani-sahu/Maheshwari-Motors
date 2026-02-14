import mongoose from "mongoose";

const brandSchema = new mongoose.Schema(
  {
    id: { type: Number },
    name: { type: String, required: true, trim: true },
    item_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "Item" }],
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true, id: false },
);

brandSchema.index({ name: 1, user_id: 1 });
brandSchema.index({ id: 1, user_id: 1 });

export default mongoose.model("Brand", brandSchema);
